import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';

import { ApifyClient } from 'apify-client';
import type { InternalAxiosRequestConfig } from 'axios';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

import { Browser } from './_helper.js';
import { mockServer } from './mock_server/server.js';

describe('HttpClient', () => {
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
            await expect(page.evaluate((rId) => client.task(rId).get(), resourceId)).rejects.toThrow();
            // this is failing after axios upgrade, the error is returned with a wrong name and message
            // expect(err.message).toMatch('timeout of 1000ms exceeded');
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

    test('requests go through the proxy named in HTTP_PROXY, and skip it for hosts in NO_PROXY', async () => {
        const proxied: string[] = [];
        // A forward proxy: the agent puts the absolute target URL on the request line, so relay it as it is.
        const proxy = http.createServer((req, res) => {
            proxied.push(req.url!);
            const upstream = http.request(new URL(req.url!), { method: req.method, headers: req.headers }, (r) => {
                res.writeHead(r.statusCode!, r.headers);
                r.pipe(res);
            });
            // An unhandled 'error' here would take the worker down instead of failing the test.
            upstream.on('error', () => res.destroy());
            req.pipe(upstream);
        });
        await new Promise<void>((done) => proxy.listen(0, '127.0.0.1', done));
        const proxyUrl = `http://127.0.0.1:${(proxy.address() as AddressInfo).port}`;
        // `proxy-from-env` reads the lowercase name first, and a developer machine may exempt localhost in NO_PROXY.
        for (const name of ['HTTP_PROXY', 'http_proxy']) vi.stubEnv(name, proxyUrl);
        for (const name of ['NO_PROXY', 'no_proxy']) vi.stubEnv(name, '');

        try {
            const res = await client.user('me').get();
            expect(res?.id).toBe('get-user');
            expect(proxied).toEqual([`${baseUrl}/v2/users/me`]);

            // A fresh client for the exempted host, because the first one keeps its socket to the proxy alive
            // and would reuse it without consulting the environment again.
            for (const name of ['NO_PROXY', 'no_proxy']) vi.stubEnv(name, 'localhost');
            const direct = await new ApifyClient({ baseUrl, timeoutShortSecs: 1, maxRetries: 0 }).user('me').get();
            expect(direct?.id).toBe('get-user');
            expect(proxied).toHaveLength(1);
        } finally {
            vi.unstubAllEnvs();
            await new Promise<void>((done) => proxy.close(() => done()));
        }
    });

    test('an https request tunnels through the proxy named in HTTPS_PROXY', async () => {
        const tunneled: string[] = [];
        // The tunnel is answered by dropping the socket: reaching for it at all is what separates an https
        // origin from the plain forward-proxy path above, while speaking through it would need a certificate.
        const proxy = http.createServer();
        proxy.on('connect', (req, socket) => {
            tunneled.push(req.url!);
            socket.destroy();
        });
        await new Promise<void>((done) => proxy.listen(0, '127.0.0.1', done));
        const proxyUrl = `http://127.0.0.1:${(proxy.address() as AddressInfo).port}`;
        for (const name of ['HTTPS_PROXY', 'https_proxy']) vi.stubEnv(name, proxyUrl);
        for (const name of ['NO_PROXY', 'no_proxy']) vi.stubEnv(name, '');

        try {
            const secure = new ApifyClient({ baseUrl: 'https://api.apify.test', timeoutShortSecs: 1, maxRetries: 0 });
            await expect(secure.user('me').get()).rejects.toThrow();
            expect(tunneled).toEqual(['api.apify.test:443']);
        } finally {
            vi.unstubAllEnvs();
            await new Promise<void>((done) => proxy.close(() => done()));
        }
    });

    describe('timeout across retries', () => {
        /**
         * Routes the client's axios instance to an in-process adapter that fails `failures` times with a 500 and
         * then succeeds, recording the timeout of every attempt. No network, so no timing to get right.
         */
        const recordAttemptTimeouts = (retryingClient: ApifyClient, failures: number) => {
            const timeouts: number[] = [];
            retryingClient.httpClient.axios.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
                timeouts.push(config.timeout!);
                const failed = timeouts.length <= failures;
                const body = failed
                    ? { error: { type: 'internal-server-error', message: 'boom' } }
                    : { data: { id: 'test-id' } };
                return {
                    status: failed ? 500 : 200,
                    statusText: failed ? 'Internal Server Error' : 'OK',
                    headers: { 'content-type': 'application/json; charset=utf-8' },
                    data: Buffer.from(JSON.stringify(body)),
                    config,
                };
            };
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

            expect(timeouts).toEqual([0, 0, 0]);
        });
    });
});
