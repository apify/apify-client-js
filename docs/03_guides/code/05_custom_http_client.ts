import { Readable } from 'node:stream';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';

import { ApifyClient, HttpClient } from 'apify-client';
import type { HttpRequest, HttpResponse } from 'apify-client';

const RETRYABLE_CODES = new Set(['ECONNREFUSED', 'ECONNRESET', 'EPIPE', 'ETIMEDOUT', 'EAI_AGAIN', 'UND_ERR_SOCKET']);

class FetchHttpClient extends HttpClient {
    override async sendRequest(request: HttpRequest): Promise<HttpResponse> {
        const { method, url, headers, body, timeoutMillis, stream, signal } = request;

        const signals = signal ? [signal] : [];
        if (timeoutMillis !== undefined) signals.push(AbortSignal.timeout(timeoutMillis));

        const response = await fetch(url, {
            method,
            headers,
            // `fetch` in Node.js streams a `Readable` body, which the DOM `BodyInit` type doesn't list.
            body: body as BodyInit | undefined,
            signal: AbortSignal.any(signals),
            ...(body instanceof Readable ? { duplex: 'half' } : {}),
        });

        return {
            status: response.status,
            headers: Object.fromEntries(response.headers),
            body:
                stream && response.body
                    ? Readable.fromWeb(response.body as NodeReadableStream)
                    : Buffer.from(await response.arrayBuffer()),
        };
    }

    override isRetryableTransportError(error: unknown): boolean {
        if (this.isTimeoutError(error)) return true;
        return error instanceof TypeError && RETRYABLE_CODES.has((error.cause as { code?: string })?.code ?? '');
    }
}

const client = ApifyClient.withCustomHttpClient({
    token: 'MY-APIFY-TOKEN',
    httpClient: new FetchHttpClient({ maxRetries: 4, timeoutLongSecs: 60 }),
});

const user = await client.user('me').get();
console.log(user?.username);
