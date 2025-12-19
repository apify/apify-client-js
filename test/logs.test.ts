import { ApifyClient } from 'apify-client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest';

import { Browser, DEFAULT_OPTIONS,validateRequest } from './_helper';
import { mockServer } from './mock_server/server';
import { Page } from 'puppeteer';
import { AddressInfo } from 'node:net';

describe('Log methods', () => {
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
        page = await browser.getInjectedPage(baseUrl, DEFAULT_OPTIONS);
        client = new ApifyClient({
            baseUrl,
            maxRetries: 0,
            ...DEFAULT_OPTIONS,
        });
    });
    afterEach(async () => {
        client = null as unknown as ApifyClient;
        page.close().catch(() => {});
    });

    describe('log(buildOrRunId)', () => {
        test('get() works', async () => {
            const logId = 'some-id';

            const res = await client.log(logId).get();
            expect(res).toBe('get-log');
            validateRequest({}, { logId });

            const browserRes = await page.evaluate((id) => client.log(id).get(), logId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { logId });
        });

        test('stream() works', async () => {
            const logId = 'some-id';

            const res = await client.log(logId).stream();
            const chunks = [];

            if (!res) {
                throw new Error('Expected stream to be defined');
            }

            for await (const chunk of res) {
                chunks.push(chunk);
            }
            const id = Buffer.concat(chunks).toString();
            expect(id).toBe('get-log');
            validateRequest({ stream: true }, { logId });
        });
    });
});
