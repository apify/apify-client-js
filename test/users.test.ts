import type { AddressInfo } from 'node:net';

import { ApifyClient } from 'apify-client';
import type { Page } from 'puppeteer';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest';

import { ME_USER_NAME_PLACEHOLDER } from '@apify/consts';

import { Browser, DEFAULT_OPTIONS, validateRequest } from './_helper';
import { mockServer } from './mock_server/server';

describe('User methods', () => {
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

    describe('user(id)', () => {
        test('get() works', async () => {
            const userId = 'some-id';

            const res = await client.user(userId).get();
            expect(res.id).toEqual('get-user');
            validateRequest({ query: {}, params: { userId } });

            const browserRes = await page.evaluate((id) => client.user(id).get(), userId);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { userId } });
        });

        test('get() with no userId', async () => {
            const res = await client.user().get();
            expect(res.id).toEqual('get-user');
            validateRequest({ query: {}, params: { userId: ME_USER_NAME_PLACEHOLDER } });

            const browserRes = await page.evaluate((id) => client.user(id).get(), undefined);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { userId: ME_USER_NAME_PLACEHOLDER } });
        });

        test('monthlyUsage() works', async () => {
            const userId = 'some-id';

            const res = await client.user(userId).monthlyUsage();
            validateRequest({ query: {}, params: { userId }, endpointId: 'get-monthly-usage' });

            const browserRes = await page.evaluate((id) => client.user(id).monthlyUsage(), userId);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { userId } });
        });

        test('limits() works', async () => {
            const userId = 'some-id';

            const res = await client.user(userId).limits();
            validateRequest({ query: {}, params: { userId }, endpointId: 'get-limits' });

            const browserRes = await page.evaluate((id) => client.user(id).limits(), userId);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { userId } });
        });

        test('updateLimits() works', async () => {
            const userId = 'me';
            const opts = { maxMonthlyUsageUsd: 1000, dataRetentionDays: 20 };

            const res = await client.user(userId).updateLimits(opts);
            expect(res).toBeUndefined();
            validateRequest({ query: {}, params: { userId }, body: opts });

            const browserRes = await page.evaluate((id, o) => client.user(id).updateLimits(o), userId, opts);
            expect(browserRes).toBeUndefined();
            validateRequest({ query: {}, params: { userId }, body: opts });
        });
    });
});
