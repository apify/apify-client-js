import { execFile } from 'node:child_process';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

import { ApifyClient } from 'apify-client';
import type { Page } from 'puppeteer';
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
    let page: Page;
    beforeEach(async () => {
        page = await browser.getInjectedPage(baseUrl, { timeoutSecs: 1 });
        client = new ApifyClient({
            baseUrl,
            timeoutSecs: 1,
            maxRetries: 0,
            userAgentSuffix: ['SDK/3.1.1', 'Crawlee/3.11.5'],
        });
    });
    afterEach(async () => {
        client = null as unknown as ApifyClient;
        page.close().catch(() => {});
    });
    test('requests timeout after timeoutSecs', async () => {
        const context = { delayMillis: 3000 };
        const resourceId = Buffer.from(JSON.stringify(context)).toString('hex');

        await expect(client.actor(resourceId).get()).rejects.toThrow('timeout of 1000ms exceeded');
        const ua = mockServer.getLastRequest()?.headers['user-agent'];
        expect(ua).toMatch(/ApifyClient\/\d+\.\d+\.\d+/);
        expect(ua).toMatch(`(${os.platform()}; Node/${process.version})`);
        expect(ua).toMatch('isAtHome/false; SDK/3.1.1; Crawlee/3.11.5');

        await expect(page.evaluate((rId) => client.task(rId).get(), resourceId)).rejects.toThrow();
        // this is failing after axios upgrade, the error is returned with a wrong name and message
        // expect(err.message).toMatch('timeout of 1000ms exceeded');
    });

    test('requests go through the proxy named in HTTP_PROXY', async () => {
        const proxied: string[] = [];
        // A forward proxy: the agent puts the absolute target URL on the request line, so relay it as it is.
        const proxy = http.createServer((req, res) => {
            proxied.push(req.url!);
            const upstream = http.request(new URL(req.url!), { method: req.method, headers: req.headers }, (r) => {
                res.writeHead(r.statusCode!, r.headers);
                r.pipe(res);
            });
            req.pipe(upstream);
        });
        await new Promise<void>((done) => proxy.listen(0, '127.0.0.1', done));
        const proxyUrl = `http://127.0.0.1:${(proxy.address() as AddressInfo).port}`;
        // `proxy-from-env` reads the lowercase name first, and a developer machine may exempt localhost in NO_PROXY.
        for (const name of ['HTTP_PROXY', 'http_proxy']) vi.stubEnv(name, proxyUrl);
        for (const name of ['NO_PROXY', 'no_proxy']) vi.stubEnv(name, '');

        try {
            const res = await client.user('me').get();
            expect(res.id).toBe('get-user');
            expect(proxied).toEqual([`${baseUrl}/v2/users/me`]);
        } finally {
            vi.unstubAllEnvs();
            await new Promise<void>((done) => proxy.close(() => done()));
        }
    });

    test('a request emits no deprecation warning', async () => {
        // A deprecation Node still lists as pending only surfaces with the flag, so the check does not depend on
        // the Node version running the suite. Each warning fires once per process, hence a fresh one.
        const entry = pathToFileURL(resolve(import.meta.dirname, '../dist/index.js')).href;
        const script = `
            import { ApifyClient } from ${JSON.stringify(entry)};
            const warnings = [];
            process.on('warning', ({ name, code, message }) => warnings.push({ name, code, message }));
            await new ApifyClient({ baseUrl: ${JSON.stringify(baseUrl)}, maxRetries: 0 }).user('me').get();
            console.log(JSON.stringify(warnings));
        `;
        const args = ['--pending-deprecation', '--input-type=module', '--eval', script];
        const { stdout } = await promisify(execFile)(process.execPath, args, { env: {} });

        const warnings: { name: string }[] = JSON.parse(stdout);
        expect(warnings.filter(({ name }) => name === 'DeprecationWarning')).toEqual([]);
    });
});
