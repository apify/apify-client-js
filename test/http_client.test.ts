import { randomBytes } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import { createServer } from 'node:net';
import os from 'node:os';
import { gzipSync } from 'node:zlib';

import type { HttpRequest } from 'apify-client';
import { ApifyClient, FetchHttpClient, GzipHttpCompressor } from 'apify-client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

import { runtime } from '../src/runtime/node.js';
import { Browser } from './_helper.js';
import { mockServer } from './mock_server/server.js';

describe('FetchHttpClient', () => {
    let baseUrl: string;
    const browser = new Browser();

    beforeAll(async () => {
        const server = await mockServer.start();
        await browser.start();
        baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
    });

    afterAll(async () => {
        await Promise.all([mockServer.close(), browser.cleanUpBrowser()]);
    });

    /** A resource id the mock server reads as "answer after this many milliseconds". */
    const delayedResourceId = (delayMillis: number) => Buffer.from(JSON.stringify({ delayMillis })).toString('hex');

    let client: ApifyClient;
    beforeEach(() => {
        client = new ApifyClient({
            baseUrl,
            timeoutShortSecs: 1,
            maxRetries: 0,
            userAgentSuffix: ['SDK/3.1.1', 'Crawlee/3.11.5'],
        });
    });
    afterEach(() => {
        client = null as unknown as ApifyClient;
    });
    test('requests time out after the duration configured for their tier', async () => {
        const resourceId = delayedResourceId(3000);

        // `get()` sits in the short tier, which the client above shortens to one second.
        await expect(client.actor(resourceId).get()).rejects.toThrow('timeout of 1000ms exceeded');
        const ua = mockServer.getLastRequest()?.headers['user-agent'];
        expect(ua).toMatch(/ApifyClient\/\d+\.\d+\.\d+/);
        expect(ua).toMatch(`(${os.platform()}; Node/${process.version})`);
        expect(ua).toMatch('isAtHome/false; SDK/3.1.1; Crawlee/3.11.5');

        const page = await browser.getInjectedPage(baseUrl, { timeoutShortSecs: 1 });
        try {
            await expect(page.evaluate((rId) => client.task(rId).get(), resourceId)).rejects.toThrow(
                'timeout of 1000ms exceeded',
            );
        } finally {
            page.close().catch(() => {});
        }
    });

    test('a per-call timeout replaces the tier of the method', async () => {
        const resourceId = delayedResourceId(1500);

        // Another tier, with its own duration, and an explicit number of seconds.
        await expect(client.actor(resourceId).get({ timeoutSecs: 'medium' })).resolves.toBeDefined();
        await expect(client.actor(resourceId).get({ timeoutSecs: 0.5 })).rejects.toThrow('timeout of 500ms exceeded');
    });

    test("'noTimeout' lets a request run past every tier", async () => {
        const resourceId = delayedResourceId(1500);

        await expect(client.actor(resourceId).get({ timeoutSecs: 'noTimeout' })).resolves.toBeDefined();
    });

    test('a timeout above timeoutMaxSecs is capped at it, with a warning', async () => {
        const cappedClient = new ApifyClient({ baseUrl, timeoutLongSecs: 10, timeoutMaxSecs: 1, maxRetries: 0 });
        const warningOnce = vi.spyOn(cappedClient.logger, 'warningOnce');
        const resourceId = delayedResourceId(1500);

        await expect(cappedClient.actor(resourceId).get({ timeoutSecs: 'long' })).rejects.toThrow(
            'timeout of 1000ms exceeded',
        );
        await expect(cappedClient.actor(resourceId).get({ timeoutSecs: 5 })).rejects.toThrow(
            'timeout of 1000ms exceeded',
        );

        expect(warningOnce.mock.calls.map(([message]) => message)).toEqual([
            'The requested timeout of 10s exceeds timeoutMaxSecs (1s) and is capped at it. Raise timeoutMaxSecs on the client to allow longer request timeouts.',
            'The requested timeout of 5s exceeds timeoutMaxSecs (1s) and is capped at it. Raise timeoutMaxSecs on the client to allow longer request timeouts.',
        ]);
    });

    test.each([
        { name: 'lowercase', header: 'content-encoding' },
        { name: 'canonical casing', header: 'Content-Encoding' },
        { name: 'uppercase', header: 'CONTENT-ENCODING' },
    ])('forwards a body pre-encoded with a $name header as it is', async ({ header }) => {
        // Gzipped random bytes: incompressible, and above the 1 KiB threshold that would otherwise
        // send the body through the compressor.
        const payload = randomBytes(8192);
        const encoded = gzipSync(payload);

        await client.httpClient.call({
            url: `${baseUrl}/v2/key-value-stores/some-id/records/some-key`,
            method: 'PUT',
            data: encoded,
            headers: { 'content-type': 'application/octet-stream', [header]: 'gzip' },
        });

        const request = mockServer.getLastRequest();
        expect(request?.headers['content-encoding']).toBe('gzip');
        expect(request?.headers['content-length']).toBe(String(encoded.length));
        expect(request?.body).toEqual(payload);
    });

    test.each([
        { name: 'lowercase', header: 'content-type' },
        { name: 'canonical casing', header: 'Content-Type' },
        { name: 'uppercase', header: 'CONTENT-TYPE' },
    ])('skips compression for an already-compressed type sent with a $name header', async ({ header }) => {
        // Trivially compressible and well above the 1 KiB threshold, so an unchanged content length
        // is proof the body was not run through the compressor.
        const payload = Buffer.alloc(4096, 'a');

        await client.httpClient.call({
            url: `${baseUrl}/v2/key-value-stores/some-id/records/some-key`,
            method: 'PUT',
            data: payload,
            headers: { [header]: 'image/png' },
        });

        const request = mockServer.getLastRequest();
        expect(request?.headers['content-encoding']).toBeUndefined();
        expect(request?.headers['content-length']).toBe(String(payload.length));
    });

    test('sends the body uncompressed with compression set to false', async () => {
        const payload = Buffer.alloc(4096, 'a');

        await client.httpClient.call({
            url: `${baseUrl}/v2/key-value-stores/some-id/records/some-key`,
            method: 'PUT',
            data: payload,
            compression: false,
        });

        const request = mockServer.getLastRequest();
        expect(request?.headers['content-encoding']).toBeUndefined();
        expect(request?.headers['content-length']).toBe(String(payload.length));
    });

    test('uses the compressor passed in compression for that request', async () => {
        const payload = Buffer.alloc(4096, 'a');

        await client.httpClient.call({
            url: `${baseUrl}/v2/key-value-stores/some-id/records/some-key`,
            method: 'PUT',
            data: payload,
            headers: { 'content-type': 'application/octet-stream' },
            compression: new GzipHttpCompressor(),
        });

        const request = mockServer.getLastRequest();
        expect(client.httpClient.httpCompressor.contentEncoding).toBe('br');
        expect(request?.headers['content-encoding']).toBe('gzip');
        expect(request?.body).toEqual(payload);
    });

    test('a timed-out request fails with a TimeoutError', async () => {
        const call = client.actor(delayedResourceId(1500)).get({ timeoutSecs: 0.2 });

        await expect(call).rejects.toMatchObject({ name: 'TimeoutError', message: 'timeout of 200ms exceeded' });
    });

    test('the timeout starts over with every chunk of the response body', async () => {
        const trickle = async () => {
            const encoder = new TextEncoder();
            const chunks = ['{"data":', '{"id":', '"slow"}}'];
            return new Response(
                new ReadableStream<Uint8Array>({
                    async pull(controller) {
                        await new Promise((done) => setTimeout(done, 150));
                        const chunk = chunks.shift();
                        if (chunk === undefined) controller.close();
                        else controller.enqueue(encoder.encode(chunk));
                    },
                }),
                { headers: { 'content-type': 'application/json' } },
            );
        };
        const httpClient = new FetchHttpClient({ fetch: trickle, maxRetries: 0 });

        // The body takes 600 ms in all, with no more than 150 ms between two chunks.
        const response = await httpClient.call({ url: `${baseUrl}/v2/x`, method: 'GET', timeoutSecs: 0.4 });

        expect(response.data).toEqual({ data: { id: 'slow' } });
    });

    test('sends the requests through the fetch function passed to the client', async () => {
        const httpClient = new FetchHttpClient({
            fetch: async (input, init) => fetch(input, { ...init, headers: { ...init?.headers, 'X-Wrapped': 'yes' } }),
        });
        const custom = ApifyClient.withCustomHttpClient({ baseUrl, token: 'test_token', httpClient });

        const user = await custom.user('me').get();

        expect(user?.id).toBe('get-user');
        const request = mockServer.getLastRequest();
        expect(request?.headers['x-wrapped']).toBe('yes');
        expect(request?.headers.authorization).toBe('Bearer test_token');
    });

    test('retries a request whose connection failed', async () => {
        const networkError = () => new TypeError('fetch failed', { cause: failure('ECONNRESET') });
        const fetchMock = vi
            .fn<typeof fetch>()
            .mockRejectedValueOnce(networkError())
            .mockRejectedValueOnce(networkError())
            .mockResolvedValue(Response.json({ data: { id: 'test-id' } }));
        const httpClient = new FetchHttpClient({ fetch: fetchMock, minDelayBetweenRetriesMillis: 1 });

        const response = await httpClient.call({ url: `${baseUrl}/v2/x`, method: 'GET' });

        expect(response.data).toEqual({ data: { id: 'test-id' } });
        expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    test('the retry warning names the network error behind a failed fetch', async () => {
        const server = createServer((socket) => socket.on('data', () => socket.destroy())).listen(0);
        const retrying = new ApifyClient({
            baseUrl: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
            maxRetries: 2,
            minDelayBetweenRetriesMillis: 1,
        });
        const warning = vi.spyOn(retrying.logger, 'warning').mockImplementation(() => {});

        try {
            await expect(retrying.user('me').get()).rejects.toThrow('fetch failed');
        } finally {
            server.close();
        }

        expect(warning).toHaveBeenCalledTimes(1);
        expect(warning.mock.calls[0][0]).toMatch('Caused by: SocketError: other side closed');
    });

    test('does not retry a request that could not be sent', async () => {
        const httpClient = new FetchHttpClient({ minDelayBetweenRetriesMillis: 1 });
        const sendRequest = vi.spyOn(httpClient, 'sendRequest');

        await expect(httpClient.call({ url: 'http://', method: 'GET' })).rejects.toThrow(TypeError);
        expect(sendRequest).toHaveBeenCalledTimes(1);
    });

    test('hands back every Set-Cookie header of the response', async () => {
        const headers = new Headers([
            ['set-cookie', 'a=1; Expires=Wed, 21 Oct 2026 07:28:00 GMT'],
            ['set-cookie', 'b=2'],
        ]);
        const httpClient = new FetchHttpClient({ fetch: async () => new Response('', { headers }) });

        const response = await httpClient.call({ url: `${baseUrl}/v2/x`, method: 'GET' });

        expect(response.headers['set-cookie']).toEqual(['a=1; Expires=Wed, 21 Oct 2026 07:28:00 GMT', 'b=2']);
    });

    test.each([
        { name: 'a TimeoutError', error: new DOMException('late', 'TimeoutError'), expected: true },
        {
            name: 'a headers timeout of Node.js',
            error: new TypeError('fetch failed', { cause: failure('UND_ERR_HEADERS_TIMEOUT') }),
            expected: true,
        },
        {
            name: 'a connection reset',
            error: new TypeError('fetch failed', { cause: failure('ECONNRESET') }),
            expected: false,
        },
        { name: 'a plain error', error: new Error('boom'), expected: false },
    ])('isTimeoutError() classifies $name', ({ error, expected }) => {
        expect(new FetchHttpClient().isTimeoutError(error)).toBe(expected);
    });

    test('isRetryableTransportError() retries the network failures of fetch', () => {
        const httpClient = new FetchHttpClient();
        const withCause = (code: string) => new TypeError('fetch failed', { cause: failure(code) });

        expect(httpClient.isRetryableTransportError(withCause('ECONNRESET'))).toBe(true);
        expect(httpClient.isRetryableTransportError(withCause('UND_ERR_SOCKET'))).toBe(true);
        expect(httpClient.isRetryableTransportError(withCause('UND_ERR_BODY_TIMEOUT'))).toBe(true);
        expect(httpClient.isRetryableTransportError(new DOMException('late', 'TimeoutError'))).toBe(true);
        expect(httpClient.isRetryableTransportError(withCause('ERR_INVALID_URL'))).toBe(false);
        expect(httpClient.isRetryableTransportError(new TypeError('invalid header value'))).toBe(false);
        expect(httpClient.isRetryableTransportError(new Error('boom'))).toBe(false);
    });

    test('isRetryableTransportError() retries the network failures of a fetch that names no cause', () => {
        const httpClient = new FetchHttpClient();
        runtime.fetchFailsWithCause = false;
        try {
            // Browsers and Deno.
            expect(httpClient.isRetryableTransportError(new TypeError('Failed to fetch'))).toBe(true);
            // Bun.
            expect(httpClient.isRetryableTransportError(failure('ConnectionRefused'))).toBe(true);
            expect(httpClient.isRetryableTransportError(failure('ECONNRESET'))).toBe(true);
            const invalidUrl = Object.assign(new TypeError('fetch() URL is invalid'), { code: 'ERR_INVALID_URL' });
            expect(httpClient.isRetryableTransportError(invalidUrl)).toBe(false);
            expect(httpClient.isRetryableTransportError(new Error('boom'))).toBe(false);
        } finally {
            runtime.fetchFailsWithCause = true;
        }
    });

    describe('with a proxy in the environment', () => {
        const failingClient = () => {
            const failing = new ApifyClient({ baseUrl, maxRetries: 1, minDelayBetweenRetriesMillis: 1 });
            return { failing, warningOnce: vi.spyOn(failing.logger, 'warningOnce') };
        };

        beforeEach(() => {
            for (const name of ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'NODE_USE_ENV_PROXY']) {
                vi.stubEnv(name, '');
            }
            vi.stubEnv('NODE_OPTIONS', '');
            vi.stubGlobal(
                'fetch',
                vi.fn(async () => {
                    throw new TypeError('fetch failed', { cause: failure('ECONNREFUSED') });
                }),
            );
        });
        afterEach(() => {
            vi.unstubAllEnvs();
            vi.unstubAllGlobals();
        });

        test('a failed connection warns once that Node.js is not using the proxy', async () => {
            vi.stubEnv('HTTPS_PROXY', 'http://proxy.example.com:3128');
            const { failing, warningOnce } = failingClient();

            await expect(failing.user('me').get()).rejects.toThrow('fetch failed');

            const warnings = warningOnce.mock.calls.map(([message]) => message);
            expect(warnings).toHaveLength(2);
            expect(new Set(warnings).size).toBe(1);
            expect(warnings[0]).toMatch('the proxy set in HTTPS_PROXY was not used');
            expect(warnings[0]).toMatch('NODE_USE_ENV_PROXY=1');
        });

        test('a failed connection does not warn once Node.js reads the proxy from the environment', async () => {
            vi.stubEnv('HTTPS_PROXY', 'http://proxy.example.com:3128');
            vi.stubEnv('NODE_USE_ENV_PROXY', '1');
            const { failing, warningOnce } = failingClient();

            await expect(failing.user('me').get()).rejects.toThrow('fetch failed');

            expect(warningOnce).not.toHaveBeenCalled();
        });

        test('a failed connection does not warn without a proxy', async () => {
            const { failing, warningOnce } = failingClient();

            await expect(failing.user('me').get()).rejects.toThrow('fetch failed');

            expect(warningOnce).not.toHaveBeenCalled();
        });
    });

    test('sends a string body with an explicit content type as it is', async () => {
        // Validating the body would trim this whitespace away.
        const body = ' [{"uniqueKey": "key-1", "url": "http://example.com/1"}] ';

        const response = await client.httpClient.call({
            url: `${baseUrl}/v2/request-queues/some-id/requests/batch`,
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            data: body,
        });

        expect(response.config.data).toBe(body);
        expect(mockServer.getLastRequest()?.body).toEqual(JSON.parse(body));
    });

    describe('timeout across retries', () => {
        /**
         * Replaces the transport of the client with one that fails `failures` times with a 500 and then succeeds,
         * recording the timeout of every attempt. No network, so no timing to get right.
         */
        const recordAttemptTimeouts = (retryingClient: ApifyClient, failures: number) => {
            const timeouts: (number | undefined)[] = [];
            vi.spyOn(retryingClient.httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
                timeouts.push(request.timeoutMillis);
                const failed = timeouts.length <= failures;
                const body = failed
                    ? { error: { type: 'internal-server-error', message: 'boom' } }
                    : { data: { id: 'test-id' } };
                return {
                    status: failed ? 500 : 200,
                    headers: { 'content-type': 'application/json; charset=utf-8' },
                    body: Buffer.from(JSON.stringify(body)),
                };
            });
            return timeouts;
        };

        test('doubles from the requested value on each attempt, up to timeoutMaxSecs', async () => {
            const retryingClient = new ApifyClient({
                baseUrl,
                timeoutMaxSecs: 12,
                maxRetries: 3,
                minDelayBetweenRetriesMillis: 1,
            });
            const timeouts = recordAttemptTimeouts(retryingClient, 3);

            await retryingClient.httpClient.call({ url: `${baseUrl}/v2/x`, method: 'GET', timeoutSecs: 'short' });

            expect(timeouts).toEqual([5000, 10000, 12000, 12000]);
        });

        test('an explicit number of seconds doubles the same way', async () => {
            const retryingClient = new ApifyClient({ baseUrl, maxRetries: 2, minDelayBetweenRetriesMillis: 1 });
            const timeouts = recordAttemptTimeouts(retryingClient, 2);

            await retryingClient.httpClient.call({ url: `${baseUrl}/v2/x`, method: 'GET', timeoutSecs: 2 });

            expect(timeouts).toEqual([2000, 4000, 8000]);
        });

        test("'noTimeout' stays off on every attempt", async () => {
            const retryingClient = new ApifyClient({ baseUrl, maxRetries: 2, minDelayBetweenRetriesMillis: 1 });
            const timeouts = recordAttemptTimeouts(retryingClient, 2);

            await retryingClient.httpClient.call({ url: `${baseUrl}/v2/x`, method: 'GET', timeoutSecs: 'noTimeout' });

            expect(timeouts).toEqual([undefined, undefined, undefined]);
        });
    });
});

/** An error shaped like the ones Node.js names as the cause of a failed fetch. */
function failure(code: string): Error {
    return Object.assign(new Error(code), { code });
}
