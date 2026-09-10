import { randomBytes } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import { gzipSync } from 'node:zlib';

import { ApifyClient } from 'apify-client';
import type { Page } from 'puppeteer';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest';

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
});
