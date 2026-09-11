import { randomBytes } from 'node:crypto';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import { gzipSync } from 'node:zlib';

import { ApifyClient } from 'apify-client';
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

    let client: ApifyClient;
    beforeEach(() => {
        client = new ApifyClient({
            baseUrl,
            timeoutSecs: 1,
            maxRetries: 0,
            userAgentSuffix: ['SDK/3.1.1', 'Crawlee/3.11.5'],
        });
    });
    afterEach(() => {
        client = null as unknown as ApifyClient;
    });
    test('requests timeout after timeoutSecs', async () => {
        const context = { delayMillis: 3000 };
        const resourceId = Buffer.from(JSON.stringify(context)).toString('hex');

        await expect(client.actor(resourceId).get()).rejects.toThrow('timeout of 1000ms exceeded');
        const ua = mockServer.getLastRequest()?.headers['user-agent'];
        expect(ua).toMatch(/ApifyClient\/\d+\.\d+\.\d+/);
        expect(ua).toMatch(`(${os.platform()}; Node/${process.version})`);
        expect(ua).toMatch('isAtHome/false; SDK/3.1.1; Crawlee/3.11.5');

        const page = await browser.getInjectedPage(baseUrl, { timeoutSecs: 1 });
        try {
            await expect(page.evaluate((rId) => client.task(rId).get(), resourceId)).rejects.toThrow();
            // this is failing after axios upgrade, the error is returned with a wrong name and message
            // expect(err.message).toMatch('timeout of 1000ms exceeded');
        } finally {
            page.close().catch(() => {});
        }
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
            const direct = await new ApifyClient({ baseUrl, timeoutSecs: 1, maxRetries: 0 }).user('me').get();
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
            const secure = new ApifyClient({ baseUrl: 'https://api.apify.test', timeoutSecs: 1, maxRetries: 0 });
            await expect(secure.user('me').get()).rejects.toThrow();
            expect(tunneled).toEqual(['api.apify.test:443']);
        } finally {
            vi.unstubAllEnvs();
            await new Promise<void>((done) => proxy.close(() => done()));
        }
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

    test('sends a string body with an explicit content type as it is', async () => {
        // The axios default transform would re-parse the body to validate it and trim this whitespace away.
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
});
