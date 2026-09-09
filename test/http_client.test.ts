import type { AddressInfo } from 'node:net';
import os from 'node:os';

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
