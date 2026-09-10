---
id: http-clients
title: HTTP clients
sidebar_label: HTTP clients
description: 'Understand the built-in axios HTTP client of the Apify API client for JavaScript and the interface a custom one implements.'
---

import ApiLink from '@theme/ApiLink';

The Apify API client uses a pluggable HTTP layer. It ships with an [axios](https://axios-http.com)-based default and accepts custom implementations.

## Default HTTP client

When you create an <ApiLink to="class/ApifyClient">`ApifyClient`</ApiLink>, it sends its requests through the built-in <ApiLink to="class/AxiosHttpClient">`AxiosHttpClient`</ApiLink>. This default client provides:

- Automatic retries with exponential backoff for network errors, HTTP 429 and HTTP 5xx responses.
- Configurable timeouts that grow with every retry.
- Request compression and preparation of API-compatible bodies, query parameters and headers, including authentication.
- Keep-alive connections and proxy support through the `HTTP_PROXY`, `HTTPS_PROXY` and `NO_PROXY` environment variables in Node.js.
- API error handling and request statistics.

You configure the default client through the <ApiLink to="class/ApifyClient">`ApifyClient`</ApiLink> constructor:

```js
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
    token: 'MY-APIFY-TOKEN',
    maxRetries: 4,
    minDelayBetweenRetriesMillis: 500,
    timeoutSecs: 360,
});
```

Anything beyond those options, such as [axios request interceptors](https://axios-http.com/docs/interceptors), is configured on an <ApiLink to="class/AxiosHttpClient">`AxiosHttpClient`</ApiLink> instance that you plug in yourself. Retries and timeouts then live on the HTTP client too:

```js
import { ApifyClient, AxiosHttpClient } from 'apify-client';

const httpClient = new AxiosHttpClient({
    maxRetries: 4,
    requestInterceptors: [
        (config) => {
            config.headers.set('X-Request-Id', crypto.randomUUID());
            return config;
        },
    ],
});

const client = ApifyClient.withCustomHttpClient({ token: 'MY-APIFY-TOKEN', httpClient });
```

## Architecture

The HTTP client hierarchy has two layers:

- <ApiLink to="class/HttpClient">`HttpClient`</ApiLink> is the abstract base. It holds the shared request pipeline: header merging, body serialization and compression, query encoding, the retry loop, timeout growth, response body parsing, statistics and the conversion of error statuses to <ApiLink to="class/ApifyApiError">`ApifyApiError`</ApiLink>. It declares the transport hooks a concrete client implements.
- <ApiLink to="class/AxiosHttpClient">`AxiosHttpClient`</ApiLink> extends it and adapts axios as the transport.

A custom client extends <ApiLink to="class/HttpClient">`HttpClient`</ApiLink> the same way. It implements the transport hook and inherits everything else, so its requests get the same retries, timeouts, compression and error handling as the built-in client.

`HttpClient.isTimeoutError(error)` is the transport-neutral way to tell whether an error is a timeout, so code built on the client does not need to know which transport threw it.

### The transport contract

The public `call()` method provides the shared request pipeline. A concrete transport implements these hooks:

- `sendRequest(request)` sends one prepared request and returns its response, error statuses included. It receives an <ApiLink to="interface/HttpRequest">`HttpRequest`</ApiLink>: the URL with the query string already encoded into it, the headers with the client's default headers already merged in, the body already serialized and compressed, the timeout for this attempt in milliseconds, and whether the caller wants the response body as a stream. The inherited `call()` needs it, so every transport has to implement it. Let the HTTP library's errors propagate unwrapped, and leave status handling and <ApiLink to="class/ApifyApiError">`ApifyApiError`</ApiLink> to `call()`.
- `isRetryableTransportError(error)` classifies transport failures for the shared retry loop. The default classifies nothing as retryable, so a transport that does not override it gives up on the first connection failure.
- `isTimeoutError(error)` identifies the transport's timeout errors. The default recognizes errors named `TimeoutError`, which is what `AbortSignal.timeout()` produces. Timeout classification is independent of retryability, so a timeout the retry loop should retry has to be covered by `isRetryableTransportError()` too.
- `close()` releases resources owned by the transport, such as a connection pool. The default does nothing.

Mark your implementations with the `override` keyword, as the built-in axios client does, so the TypeScript compiler catches a misspelled hook.

### Request and response shapes

`sendRequest()` receives an <ApiLink to="interface/HttpRequest">`HttpRequest`</ApiLink>:

| Field | Description |
| --- | --- |
| `method: HttpMethod` | HTTP method, for example `GET` or `POST` |
| `url: string` | Full URL, query string included |
| `headers: Record<string, string>` | Final request headers |
| `body?: string \| Buffer \| ArrayBuffer \| ArrayBufferView \| Readable` | Serialized and compressed body, or `undefined` |
| `timeoutMillis: number` | Timeout of this attempt |
| `stream: boolean` | Whether to return the body unread, as a `Readable` |

It returns an <ApiLink to="interface/HttpResponse">`HttpResponse`</ApiLink>. It is an interface, not a class, so any object of this shape will do:

| Field | Description |
| --- | --- |
| `status: number` | HTTP status code |
| `headers: Record<string, string \| string[] \| undefined>` | Response headers keyed by lowercase name |
| `body: Buffer \| ArrayBuffer \| Readable \| undefined` | Raw body, a `Readable` for a streamed response, or `undefined` |

The pipeline decodes the body by its content type for the resource clients, so the transport returns raw bytes. For a streamed response, return the body unread and let the caller consume it.

### Plugging it in

Use <ApiLink to="class/ApifyClient#withCustomHttpClient">`ApifyClient.withCustomHttpClient()`</ApiLink> to create a client with your implementation. The token you pass is set as the HTTP client's `Authorization` header, unless the client already has one configured:

```js
import { ApifyClient, HttpClient } from 'apify-client';

class MyHttpClient extends HttpClient {
    async sendRequest({ method, url, headers, body, timeoutMillis, stream }) {
        // Send the request with the HTTP library of your choice.
        throw new Error('Not implemented');
    }

    isRetryableTransportError(error) {
        // List the transport's transient failures here, such as its timeout and connection errors.
        // Returning false for everything opts out of transport retries entirely.
        return this.isTimeoutError(error);
    }
}

const client = ApifyClient.withCustomHttpClient({
    token: 'MY-APIFY-TOKEN',
    httpClient: new MyHttpClient(),
});
```

After that, all API calls made through the client go through your HTTP client.

:::warning
If you override `call()` itself, your implementation becomes responsible for request preparation, retries, timeouts, API error conversion and statistics. It also has to send the client's default headers with every request, otherwise the `Authorization` header never reaches the API. Implementing the transport hooks and inheriting `call()` keeps the shared behavior.
:::

## Use cases

Custom HTTP clients might be useful when the built-in axios client does not cover your requirements, for example when you need to:

- **Use a different HTTP library** - Integrate `fetch`, [undici](https://undici.nodejs.org), or another transport.
- **Route through a proxy** - Add proxy support or request routing the environment variables cannot express.
- **Implement custom retry logic** - Use different backoff strategies or retry conditions.
- **Log requests and responses** - Track API calls for debugging or auditing.
- **Modify requests** - Add custom fields, modify the body, or change headers.
- **Collect custom metrics** - Measure request latency, track error rates, or count API calls.

For a complete implementation over `fetch`, see [Build a custom HTTP client](../03_guides/02_custom-http-client.md). The <ApiLink to="class/HttpClient">`HttpClient`</ApiLink> API reference documents the full contract.
