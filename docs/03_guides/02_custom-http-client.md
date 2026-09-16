---
id: custom-http-client
title: Build a custom HTTP client
sidebar_label: Custom HTTP client
description: 'Implement the HTTP client contract of the Apify API client for JavaScript with fetch, or reuse a Crawlee HTTP client.'
---

import ApiLink from '@theme/ApiLink';

This guide implements a custom <ApiLink to="class/HttpClient">`HttpClient`</ApiLink> over the global `fetch`, which Node.js 22 and browsers provide. It shows the three hooks a transport fills in and how a foreign response API is adapted to the <ApiLink to="interface/HttpResponse">`HttpResponse`</ApiLink> shape the pipeline expects. The same adaptation then puts a [Crawlee](https://crawlee.dev) HTTP client behind the API client.

For an overview of the architecture and the built-in axios client, see [HTTP clients](../02_concepts/08_http-clients.md).

## Implementation

The client has three parts:

1. `sendRequest()` sends one prepared request and adapts the `Response` that `fetch` resolves to. The pipeline hands it the URL with the query string encoded, the headers merged and the body serialized, so the method only moves bytes. The timeout of the attempt becomes an `AbortSignal.timeout()`, unless the request runs without one, which the pipeline signals with an `undefined` `timeoutMillis`. `AbortSignal.any()` joins it with the signal of a caller who wants to abort the call. A `Readable` body is streamed, which `fetch` requires to be flagged with `duplex: 'half'`. When the caller asked for a streamed response, the body goes back unread as a `Readable`, otherwise as a `Buffer`.
2. `isRetryableTransportError()` maps the transport's transient failures for the shared retry loop. `fetch` reports every network failure as a `TypeError` with the underlying error in `cause`, so the classification reads the error code from there. A timeout from `AbortSignal.timeout()` is a `DOMException` named `TimeoutError`, which the inherited `isTimeoutError()` already recognizes, so the override only has to make it retryable.
3. <ApiLink to="class/ApifyClient#withCustomHttpClient">`ApifyClient.withCustomHttpClient()`</ApiLink> connects the client to the resource clients and applies the API token.

```js
import { Readable } from 'node:stream';

import { ApifyClient, HttpClient } from 'apify-client';

const RETRYABLE_CODES = new Set(['ECONNREFUSED', 'ECONNRESET', 'EPIPE', 'ETIMEDOUT', 'EAI_AGAIN', 'UND_ERR_SOCKET']);

class FetchHttpClient extends HttpClient {
    async sendRequest({ method, url, headers, body, timeoutMillis, stream, signal }) {
        const signals = signal ? [signal] : [];
        if (timeoutMillis !== undefined) signals.push(AbortSignal.timeout(timeoutMillis));

        const response = await fetch(url, {
            method,
            headers,
            body,
            signal: AbortSignal.any(signals),
            ...(body instanceof Readable ? { duplex: 'half' } : {}),
        });

        return {
            status: response.status,
            headers: Object.fromEntries(response.headers),
            body:
                stream && response.body
                    ? Readable.fromWeb(response.body)
                    : Buffer.from(await response.arrayBuffer()),
        };
    }

    isRetryableTransportError(error) {
        if (this.isTimeoutError(error)) return true;
        return error instanceof TypeError && RETRYABLE_CODES.has(error.cause?.code);
    }
}

const client = ApifyClient.withCustomHttpClient({
    token: 'MY-APIFY-TOKEN',
    httpClient: new FetchHttpClient({ maxRetries: 4, timeoutLongSecs: 60 }),
});

const user = await client.user('me').get();
console.log(user.username);
```

The constructor options of <ApiLink to="class/HttpClient">`HttpClient`</ApiLink> configure the inherited pipeline: retries, the [timeout tiers](../02_concepts/06_timeouts.md) and their cap, default headers and statistics. A transport with a connection pool of its own also overrides `close()` to release it.

:::warning
This example is a compact integration, not a replacement for all built-in client behavior. A production custom client should account for transport-specific details such as proxy configuration, TLS settings, redirects and response resource cleanup. Timeout semantics differ per transport too: `AbortSignal.timeout()` bounds the whole request, headers and body included, while the timeout of the built-in axios client fires after that long without socket activity, so a response whose body keeps trickling in can outlast it.
:::

## Reuse a Crawlee HTTP client

Crawlee 4 has an HTTP client contract of its own, `BaseHttpClient` from `@crawlee/http-client`, whose `sendRequest()` takes a web `Request` and resolves to a web `Response`. The clients built on it are where proxying and browser impersonation live, such as `ImpitHttpClient` from `@crawlee/impit-client`. An adapter lets an Actor send its API traffic through the client it crawls with.

```bash
npm install @crawlee/http-client
```

The adapter maps between the two contracts:

- A `Readable` body becomes a web stream, which `Request` requires to be flagged with `duplex: 'half'`.
- The timeout of the attempt and the abort signal go to `sendRequest()` as `timeoutMillis` and `signal`. Crawlee joins them into the one signal it hands to its transport.
- `Headers` folds a header the server sent more than once into one comma-separated value. `getSetCookie()` returns the `Set-Cookie` values one by one, which is the header where the folding loses information.
- Crawlee classifies no error as retryable, so `isRetryableTransportError()` reads the error codes the same way the `fetch` client does.

```js
import { Readable } from 'node:stream';

import { FetchHttpClient } from '@crawlee/http-client';
import { ApifyClient, HttpClient } from 'apify-client';

const RETRYABLE_CODES = new Set(['ECONNREFUSED', 'ECONNRESET', 'EPIPE', 'ETIMEDOUT', 'EAI_AGAIN', 'UND_ERR_SOCKET']);

class CrawleeHttpClient extends HttpClient {
    constructor(crawleeClient, options) {
        super(options);
        this.crawleeClient = crawleeClient;
    }

    async sendRequest({ method, url, headers, body, timeoutMillis, stream, signal }) {
        const streamed = body instanceof Readable;
        const request = new Request(url, {
            method,
            headers,
            body: streamed ? Readable.toWeb(body) : body,
            ...(streamed ? { duplex: 'half' } : {}),
        });

        const response = await this.crawleeClient.sendRequest(request, { signal, timeoutMillis });

        return {
            status: response.status,
            headers: toHeaderRecord(response.headers),
            body:
                stream && response.body
                    ? Readable.fromWeb(response.body)
                    : Buffer.from(await response.arrayBuffer()),
        };
    }

    isRetryableTransportError(error) {
        if (this.isTimeoutError(error)) return true;
        return error instanceof TypeError && RETRYABLE_CODES.has(error.cause?.code);
    }
}

function toHeaderRecord(headers) {
    const record = Object.fromEntries(headers);
    const setCookie = headers.getSetCookie();
    if (setCookie.length > 0) record['set-cookie'] = setCookie;
    return record;
}

const client = ApifyClient.withCustomHttpClient({
    token: 'MY-APIFY-TOKEN',
    httpClient: new CrawleeHttpClient(new FetchHttpClient()),
});
```

:::note
Crawlee's `sendRequest()` follows redirects and keeps the cookies of every request in a jar of its own. API traffic needs neither, and both cost little at the request sizes of an API client. One difference does matter: the built-in axios client refuses to follow a redirect while it sends a stream body, since the part already sent can't be replayed, and a Crawlee client follows it.
:::
