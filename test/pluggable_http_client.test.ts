import http from 'node:http';
import type { AddressInfo } from 'node:net';

import type { ApifyRequestConfig, ApifyResponse, HttpRequest, HttpResponse } from 'apify-client';
import {
    ApifyClient,
    ArgumentValidationError,
    AxiosHttpClient,
    HttpClient,
    InvalidResponseBodyError,
    NotFoundError,
} from 'apify-client';
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

/** A custom client that replaces `call()` entirely and records what the resource clients hand it. */
class FakeHttpClient extends HttpClient {
    calls: ApifyRequestConfig[] = [];

    override async call<T>(config: ApifyRequestConfig): Promise<ApifyResponse<T>> {
        this.calls.push(config);
        return { status: 200, headers: { 'content-type': 'text/plain' }, data: 'hello' as T, config };
    }
}

/** A hooks-only client: implements `sendRequest()` over `node:http` and inherits the shared pipeline. */
class NodeHttpClient extends HttpClient {
    override async sendRequest(request: HttpRequest): Promise<HttpResponse> {
        return new Promise((resolve, reject) => {
            const options = { method: request.method, headers: request.headers, timeout: request.timeoutMillis };
            const req = http.request(request.url, options, (res) => {
                const chunks: Buffer[] = [];
                res.on('data', (chunk: Buffer) => chunks.push(chunk));
                res.on('end', () =>
                    resolve({ status: res.statusCode!, headers: res.headers, body: Buffer.concat(chunks) }),
                );
                res.on('error', reject);
            });
            req.on('error', reject);
            req.on('timeout', () =>
                req.destroy(Object.assign(new Error('Request timed out'), { name: 'TimeoutError' })),
            );
            req.end(request.body as string | Buffer | undefined);
        });
    }

    override isRetryableTransportError(error: unknown): boolean {
        return error instanceof Error && 'code' in error && error.code === 'ECONNRESET';
    }
}

/** A client that classifies every transport error as retryable, to exercise the retry loop with mocked transports. */
class RetryingHttpClient extends NodeHttpClient {
    override isRetryableTransportError(): boolean {
        return true;
    }
}

const okResponse = (body: unknown = { data: { id: 'abc' } }) => ({
    status: 200,
    headers: { 'content-type': 'application/json' },
    body: Buffer.from(JSON.stringify(body)),
});

describe('pluggable HTTP client', () => {
    let baseUrl: string;
    let server: http.Server;
    /** Requests the test server received, oldest first. */
    let received: { method: string; url: string; headers: http.IncomingHttpHeaders; body: string }[] = [];
    /** How many more requests to `/flaky` and `/broken-json` fail before they succeed. */
    let failuresLeft = 0;

    beforeAll(async () => {
        server = http.createServer((req, res) => {
            const chunks: Buffer[] = [];
            req.on('data', (chunk: Buffer) => chunks.push(chunk));
            req.on('end', () => {
                const body = Buffer.concat(chunks).toString('utf8');
                received.push({ method: req.method!, url: req.url!, headers: req.headers, body });
                const path = req.url!.split('?')[0];
                const json = (status: number, payload: unknown) => {
                    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify(payload));
                };

                if (path === '/flaky' && failuresLeft-- > 0) {
                    json(500, { error: { type: 'internal-error', message: 'Server exploded.' } });
                } else if (path === '/broken-json' && failuresLeft-- > 0) {
                    res.writeHead(200, { 'content-type': 'application/json' });
                    res.end('{"data": ');
                } else if (path === '/missing') {
                    json(404, { error: { type: 'record-not-found', message: 'Not there.' } });
                } else if (path === '/binary') {
                    res.writeHead(200, { 'content-type': 'application/octet-stream' });
                    res.end(Buffer.from([1, 2, 3]));
                } else {
                    json(200, { data: { method: req.method, url: req.url, headers: req.headers, body } });
                }
            });
        });
        await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
        baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    });

    afterAll(async () => {
        await new Promise<void>((done) => server.close(() => done()));
    });

    beforeEach(() => {
        received = [];
        failuresLeft = 0;
    });

    describe('ApifyClient.withCustomHttpClient()', () => {
        test('uses the given client and exposes its statistics', () => {
            const httpClient = new FakeHttpClient();
            const client = ApifyClient.withCustomHttpClient({ token: 'test_token', httpClient });

            expect(client.httpClient).toBe(httpClient);
            expect(client.stats).toBe(httpClient.stats);
        });

        test('accepts the API URLs alongside the client', () => {
            const client = ApifyClient.withCustomHttpClient({
                baseUrl: 'https://custom.api.example.com/',
                publicBaseUrl: 'https://public.api.example.com',
                httpClient: new FakeHttpClient(),
            });

            expect(client.baseUrl).toBe('https://custom.api.example.com/v2');
            expect(client.publicBaseUrl).toBe('https://public.api.example.com/v2');
        });

        test('rejects a client that does not extend HttpClient', () => {
            const httpClient = { call: async () => ({}) } as unknown as HttpClient;

            expect(() => ApifyClient.withCustomHttpClient({ httpClient })).toThrow(ArgumentValidationError);
        });

        test('rejects options that configure the default client', () => {
            const call = () =>
                ApifyClient.withCustomHttpClient({ httpClient: new FakeHttpClient(), maxRetries: 3 } as any);

            expect(call).toThrow(ArgumentValidationError);
            expect(call).toThrow('maxRetries');
        });

        test('routes the resource clients through a call()-only client', async () => {
            const httpClient = new FakeHttpClient();
            const client = ApifyClient.withCustomHttpClient({ token: 'test_token', httpClient });

            const record = await client.keyValueStore('my-store').getRecord('my-key');

            expect(record).toEqual({ key: 'my-key', value: 'hello', contentType: 'text/plain' });
            expect(httpClient.calls).toHaveLength(1);
            expect(httpClient.calls[0]).toMatchObject({
                method: 'GET',
                url: 'https://api.apify.com/v2/key-value-stores/my-store/records/my-key',
                params: { attachment: 'true' },
            });
        });

        test('sends the token through a hooks-only client', async () => {
            const client = ApifyClient.withCustomHttpClient({ token: 'outer_token', httpClient: new NodeHttpClient() });

            await client.httpClient.call({ url: `${baseUrl}/echo`, method: 'GET' });

            expect(received[0].headers.authorization).toBe('Bearer outer_token');
        });

        test('keeps the token the client was constructed with', async () => {
            const httpClient = new NodeHttpClient({ token: 'client_token' });
            const client = ApifyClient.withCustomHttpClient({ token: 'outer_token', httpClient });

            await client.httpClient.call({ url: `${baseUrl}/echo`, method: 'GET' });

            expect(received[0].headers.authorization).toBe('Bearer client_token');
        });

        test('does not duplicate a differently cased authorization header', async () => {
            const httpClient = new NodeHttpClient({ headers: { authorization: 'Bearer own_token' } });
            const client = ApifyClient.withCustomHttpClient({ token: 'outer_token', httpClient });

            await client.httpClient.call({ url: `${baseUrl}/echo`, method: 'GET' });

            // Node.js joins repeated request headers with a comma, so a single value proves there was one header.
            expect(received[0].headers.authorization).toBe('Bearer own_token');
        });
    });

    describe('ApifyClient default client', () => {
        test('is an AxiosHttpClient created once, on first access', () => {
            const client = new ApifyClient({ token: 'test_token' });

            expect(client.httpClient).toBeInstanceOf(AxiosHttpClient);
            expect(client.httpClient).toBe(client.httpClient);
            expect(client.httpClient.stats).toBe(client.stats);
        });

        test('can be swapped through the setter', () => {
            const client = new ApifyClient();
            const httpClient = new FakeHttpClient();

            client.httpClient = httpClient;

            expect(client.httpClient).toBe(httpClient);
            expect(client.stats).toBe(httpClient.stats);
        });

        test('applies the token to a client set through the setter', async () => {
            const client = new ApifyClient({ token: 'outer_token' });

            client.httpClient = new NodeHttpClient();
            await client.httpClient.call({ url: `${baseUrl}/echo`, method: 'GET' });

            expect(received[0].headers.authorization).toBe('Bearer outer_token');
        });
    });

    describe('HttpClient base', () => {
        test('fails loudly without a transport', async () => {
            class BareHttpClient extends HttpClient {}

            const call = new BareHttpClient().call({ url: 'https://example.com', method: 'GET' });

            await expect(call).rejects.toThrow('Implement sendRequest()');
        });

        test('close() is a no-op by default', async () => {
            await expect(new FakeHttpClient().close()).resolves.toBeUndefined();
        });

        test('recognizes a TimeoutError as a timeout and nothing as retryable', () => {
            const httpClient = new FakeHttpClient();

            expect(httpClient.isTimeoutError(Object.assign(new Error('late'), { name: 'TimeoutError' }))).toBe(true);
            expect(httpClient.isTimeoutError(new Error('late'))).toBe(false);
            expect(
                httpClient.isRetryableTransportError(Object.assign(new Error('reset'), { code: 'ECONNRESET' })),
            ).toBe(false);
        });

        test('AxiosHttpClient is an HttpClient', () => {
            expect(new AxiosHttpClient()).toBeInstanceOf(HttpClient);
        });
    });

    describe('shared pipeline through a hooks-only client', () => {
        test('retries a server error and sends the default headers every time', async () => {
            failuresLeft = 2;
            const httpClient = new NodeHttpClient({ token: 'hook_token', minDelayBetweenRetriesMillis: 1 });

            const response = await httpClient.call({ url: `${baseUrl}/flaky`, method: 'GET' });

            expect(response.status).toBe(200);
            expect(response.data).toMatchObject({ data: { method: 'GET' } });
            expect(received.map((request) => request.headers.authorization)).toEqual(
                Array(3).fill('Bearer hook_token'),
            );
            expect(received.map((request) => request.headers['user-agent'])).toEqual(
                Array(3).fill(expect.stringMatching(/^ApifyClient\/\d+\.\d+\.\d+ /)),
            );
            expect(httpClient.stats).toMatchObject({ calls: 1, requests: 3 });
        });

        test('throws an ApifyApiError for a non-retryable status after a single attempt', async () => {
            const httpClient = new NodeHttpClient({ token: 'hook_token' });

            const call = httpClient.call({ url: `${baseUrl}/missing`, method: 'GET' });

            await expect(call).rejects.toThrow(NotFoundError);
            await expect(call).rejects.toMatchObject({ statusCode: 404, type: 'record-not-found', httpMethod: 'GET' });
            expect(received).toHaveLength(1);
        });

        test('gives up on a transport error the client does not classify as retryable', async () => {
            const httpClient = new NodeHttpClient({ minDelayBetweenRetriesMillis: 1 });
            const sendRequest = vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new Error('connection lost'));

            await expect(httpClient.call({ url: `${baseUrl}/echo`, method: 'GET' })).rejects.toThrow('connection lost');
            expect(sendRequest).toHaveBeenCalledTimes(1);
        });

        test('retries a transport error the client classifies as retryable', async () => {
            const httpClient = new NodeHttpClient({ minDelayBetweenRetriesMillis: 1 });
            const reset = Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' });
            const sendRequest = vi
                .spyOn(httpClient, 'sendRequest')
                .mockRejectedValueOnce(reset)
                .mockRejectedValueOnce(reset)
                .mockResolvedValueOnce(okResponse());

            const response = await httpClient.call({ url: `${baseUrl}/echo`, method: 'GET' });

            expect(response.data).toEqual({ data: { id: 'abc' } });
            expect(sendRequest).toHaveBeenCalledTimes(3);
        });

        test('grows the timeout with every attempt, capped at the client timeout', async () => {
            const httpClient = new RetryingHttpClient({ minDelayBetweenRetriesMillis: 1, timeoutSecs: 5 });
            const sendRequest = vi
                .spyOn(httpClient, 'sendRequest')
                .mockRejectedValueOnce(new Error('nope'))
                .mockRejectedValueOnce(new Error('nope'))
                .mockResolvedValueOnce(okResponse());

            await httpClient.call({ url: `${baseUrl}/echo`, method: 'GET', timeout: 2000 });

            expect(sendRequest.mock.calls.map(([request]) => request.timeoutMillis)).toEqual([2000, 4000, 5000]);
        });

        test('stops retrying a timeout when the request opts out of it', async () => {
            const timeout = Object.assign(new Error('late'), { name: 'TimeoutError' });
            const httpClient = new RetryingHttpClient({ minDelayBetweenRetriesMillis: 1, maxRetries: 2 });
            const sendRequest = vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(timeout);
            const request = { url: `${baseUrl}/echo`, method: 'GET' } as const;

            await expect(httpClient.call({ ...request, doNotRetryTimeouts: true })).rejects.toThrow('late');
            expect(sendRequest).toHaveBeenCalledTimes(1);

            await expect(httpClient.call(request)).rejects.toThrow('late');
            expect(sendRequest).toHaveBeenCalledTimes(1 + 3);
        });

        test('retries a response body that does not parse', async () => {
            failuresLeft = 1;
            const httpClient = new NodeHttpClient({ minDelayBetweenRetriesMillis: 1 });

            const response = await httpClient.call({ url: `${baseUrl}/broken-json`, method: 'GET' });

            expect(response.data).toMatchObject({ data: { method: 'GET' } });
            expect(received).toHaveLength(2);
        });

        test('throws InvalidResponseBodyError once the retries are exhausted', async () => {
            failuresLeft = 10;
            const httpClient = new NodeHttpClient({ maxRetries: 0 });

            const call = httpClient.call({ url: `${baseUrl}/broken-json`, method: 'GET' });

            await expect(call).rejects.toThrow(InvalidResponseBodyError);
            await expect(call).rejects.toMatchObject({ response: { status: 200, body: Buffer.from('{"data": ') } });
            expect(received).toHaveLength(1);
        });

        test('encodes the query parameters', async () => {
            const httpClient = new NodeHttpClient();

            await httpClient.call({
                url: `${baseUrl}/echo`,
                method: 'GET',
                params: { yes: true, no: false, skipped: undefined, at: new Date(0), list: ['a', 'b'], n: 1 },
            });

            expect(received[0].url).toBe('/echo?yes=1&no=0&at=1970-01-01T00%3A00%3A00.000Z&list=a%2Cb&n=1');
        });

        test('serializes an object body to JSON and sets the content type', async () => {
            const httpClient = new NodeHttpClient();

            await httpClient.call({ url: `${baseUrl}/echo`, method: 'POST', data: { some: 'body' } });

            expect(received[0].headers['content-type']).toBe('application/json');
            expect(received[0].body).toBe('{"some":"body"}');
        });

        test('keeps functions in a JSON body when asked to', async () => {
            const httpClient = new NodeHttpClient();
            const data = { pageFunction: () => 1 };

            await httpClient.call({ url: `${baseUrl}/echo`, method: 'POST', data });
            await httpClient.call({ url: `${baseUrl}/echo`, method: 'POST', data, stringifyFunctions: true });

            expect(received[0].body).toBe('{}');
            expect(JSON.parse(received[1].body)).toEqual({ pageFunction: data.pageFunction.toString() });
        });

        test.each([
            { name: 'a JSON string as it is', data: ' [{"a":1}] ', expected: '[{"a":1}]' },
            { name: 'a plain string JSON-encoded', data: 'item1', expected: '"item1"' },
        ])('sends $name under a JSON content type', async ({ data, expected }) => {
            const httpClient = new NodeHttpClient();

            await httpClient.call({
                url: `${baseUrl}/echo`,
                method: 'POST',
                data,
                headers: { 'content-type': 'application/json; charset=utf-8' },
            });

            expect(received[0].body).toBe(expected);
        });

        test('sends a string body as it is without a JSON content type', async () => {
            const httpClient = new NodeHttpClient();

            await httpClient.call({ url: `${baseUrl}/echo`, method: 'POST', data: 'plain text' });

            expect(received[0].headers['content-type']).toBeUndefined();
            expect(received[0].body).toBe('plain text');
        });

        test('sends a URLSearchParams body form-encoded', async () => {
            const httpClient = new NodeHttpClient();

            await httpClient.call({
                url: `${baseUrl}/echo`,
                method: 'POST',
                data: new URLSearchParams({ a: '1', b: 'two words' }),
            });

            expect(received[0].headers['content-type']).toBe('application/x-www-form-urlencoded;charset=utf-8');
            expect(received[0].body).toBe('a=1&b=two+words');
        });

        test.each([
            { name: 'a Blob', data: new Blob([Buffer.from([1, 2, 3])]) },
            { name: 'a FormData', data: new FormData() },
            { name: 'a ReadableStream', data: new ReadableStream() },
        ])('throws instead of sending $name as an empty JSON body', async ({ data }) => {
            const httpClient = new NodeHttpClient();

            const call = httpClient.call({ url: `${baseUrl}/echo`, method: 'POST', data });

            await expect(call).rejects.toThrow(TypeError);
            await expect(call).rejects.toThrow(`Unsupported request body type: ${data.constructor.name}`);
            expect(received).toHaveLength(0);
        });

        test('lets per-request headers override the defaults regardless of casing', async () => {
            const httpClient = new NodeHttpClient({ token: 'default_token', headers: { 'X-Custom': 'default' } });

            await httpClient.call({
                url: `${baseUrl}/echo`,
                method: 'GET',
                headers: { authorization: 'Bearer request_token', 'x-custom': 'request' },
            });

            expect(received[0].headers.authorization).toBe('Bearer request_token');
            expect(received[0].headers['x-custom']).toBe('request');
        });

        test('hands back the raw body for responseType buffer', async () => {
            const httpClient = new NodeHttpClient();

            const response = await httpClient.call({ url: `${baseUrl}/binary`, method: 'GET', responseType: 'buffer' });

            expect(response.data).toEqual(Buffer.from([1, 2, 3]));
        });

        test('resolves an empty body to undefined', async () => {
            const httpClient = new NodeHttpClient();
            vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 204, headers: {}, body: Buffer.alloc(0) });

            const response = await httpClient.call({ url: `${baseUrl}/echo`, method: 'DELETE' });

            expect(response.data).toBeUndefined();
        });
    });
});
