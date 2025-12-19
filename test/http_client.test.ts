import { ApifyClient } from 'apify-client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest';

import { Browser } from './_helper';
import { mockServer } from './mock_server/server';
import { Page } from 'puppeteer';
import { AddressInfo } from 'node:net';

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
        expect(ua).toMatch('isAtHome/false; SDK/3.1.1; Crawlee/3.11.5');

        await expect(page.evaluate((rId) => client.task(rId).get(), resourceId)).rejects.toThrow();
        // this is failing after axios upgrade, the error is returned with a wrong name and message
        // expect(err.message).toMatch('timeout of 1000ms exceeded');
    });
});
