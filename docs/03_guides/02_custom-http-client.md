---
id: custom-http-client
title: Build a custom HTTP client
sidebar_label: Custom HTTP client
description: 'Implement the HTTP client contract of the Apify API client for JavaScript with fetch.'
---

import ApiLink from '@theme/ApiLink';

This guide implements a custom <ApiLink to="class/HttpClient">`HttpClient`</ApiLink> over the global `fetch`, which Node.js 22 and browsers provide. It shows the three hooks a transport fills in and how a foreign response API is adapted to the <ApiLink to="interface/HttpResponse">`HttpResponse`</ApiLink> shape the pipeline expects.

For an overview of the architecture and the built-in axios client, see [HTTP clients](../02_concepts/06_http-clients.md).

## Implementation

The client has three parts:

1. `sendRequest()` sends one prepared request and adapts the `Response` that `fetch` resolves to. The pipeline hands it the URL with the query string encoded, the headers merged and the body serialized, so the method only moves bytes. A `Readable` body is streamed, which `fetch` requires to be flagged with `duplex: 'half'`. When the caller asked for a streamed response, the body goes back unread as a `Readable`, otherwise as a `Buffer`.
2. `isRetryableTransportError()` maps the transport's transient failures for the shared retry loop. `fetch` reports every network failure as a `TypeError` with the underlying error in `cause`, so the classification reads the error code from there. A timeout from `AbortSignal.timeout()` is a `DOMException` named `TimeoutError`, which the inherited `isTimeoutError()` already recognizes, so the override only has to make it retryable.
3. <ApiLink to="class/ApifyClient#withCustomHttpClient">`ApifyClient.withCustomHttpClient()`</ApiLink> connects the client to the resource clients and applies the API token.

```js
import { Readable } from 'node:stream';

import { ApifyClient, HttpClient } from 'apify-client';

const RETRYABLE_CODES = new Set(['ECONNREFUSED', 'ECONNRESET', 'EPIPE', 'ETIMEDOUT', 'EAI_AGAIN', 'UND_ERR_SOCKET']);

class FetchHttpClient extends HttpClient {
    async sendRequest({ method, url, headers, body, timeoutMillis, stream }) {
        const response = await fetch(url, {
            method,
            headers,
            body,
            signal: AbortSignal.timeout(timeoutMillis),
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
    httpClient: new FetchHttpClient({ maxRetries: 4, timeoutSecs: 60 }),
});

const user = await client.user('me').get();
console.log(user.username);
```

The constructor options of <ApiLink to="class/HttpClient">`HttpClient`</ApiLink> configure the inherited pipeline: retries, the timeout cap, default headers and statistics. A transport with a connection pool of its own also overrides `close()` to release it.

:::warning
This example is a compact integration, not a replacement for all built-in client behavior. A production custom client should account for transport-specific details such as proxy configuration, TLS settings, redirects and response resource cleanup. Timeout semantics differ per transport too: `AbortSignal.timeout()` bounds the whole request, headers and body included, while the timeout of the built-in axios client fires after that long without socket activity, so a response whose body keeps trickling in can outlast it.
:::
