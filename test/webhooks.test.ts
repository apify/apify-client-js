import type { AddressInfo } from 'node:net';

import type { WebhookUpdateData } from 'apify-client';
import { ApifyClient } from 'apify-client';
import type { Page } from 'puppeteer';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest';

import { Browser, DEFAULT_OPTIONS, validateRequest } from './_helper';
import { mockServer } from './mock_server/server';

describe('Webhook methods', () => {
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

    describe('webhooks()', () => {
        test('create() works', async () => {
            const webhook: WebhookUpdateData = { description: 'My new webhook' };

            const res = await client.webhooks().create(webhook);
            validateRequest({
                endpointId: 'create-webhook',
                body: webhook,
            });

            const browserRes = await page.evaluate((w) => client.webhooks().create(w), webhook);
            expect(browserRes).toEqual(res);
            validateRequest({
                body: webhook,
            });
        });

        test('listWebhooks() works', async () => {
            const opts = {
                limit: 5,
                offset: 3,
                desc: true,
            };

            const res = await client.webhooks().list(opts);
            validateRequest({
                endpointId: 'list-webhooks',
                query: opts,
            });

            const browserRes = await page.evaluate((options) => client.webhooks().list(options), opts);
            expect(browserRes).toEqual(res);
            validateRequest({
                query: opts,
            });
        });
    });

    describe('webhook(id)', () => {
        test('get() works', async () => {
            const webhookId = 'webhook_id';

            const res = await client.webhook(webhookId).get();
            validateRequest({
                endpointId: 'get-webhook',
                params: { webhookId },
            });

            const browserRes = await page.evaluate((id) => client.webhook(id).get(), webhookId);
            expect(browserRes).toEqual(res);
            validateRequest({
                endpointId: 'get-webhook',
                params: { webhookId },
            });
        });

        test('get() 404', async () => {
            const webhookId = '404';

            const res = await client.webhook(webhookId).get();
            expect(res).toBeUndefined();
            validateRequest({
                params: { webhookId },
            });

            const browserRes = await page.evaluate((id) => client.webhook(id).get(), webhookId);
            expect(browserRes).toEqual(res);
            validateRequest({
                params: { webhookId },
            });
        });

        test('update() works', async () => {
            const webhookId = 'webhook_id';
            const webhook: WebhookUpdateData = {
                description: 'My updated webhook',
                isAdHoc: true,
            };

            const res = await client.webhook(webhookId).update(webhook);
            validateRequest({
                endpointId: 'update-webhook',
                body: webhook,
                params: { webhookId },
            });

            const browserRes = await page.evaluate((id, w) => client.webhook(id).update(w), webhookId, webhook);
            expect(browserRes).toEqual(res);
            validateRequest({
                endpointId: 'update-webhook',
                body: webhook,
                params: { webhookId },
            });
        });

        test('delete() works', async () => {
            const webhookId = '204';

            const res = await client.webhook(webhookId).delete();
            expect(res).toBeUndefined();
            validateRequest({
                endpointId: 'delete-webhook',
                params: { webhookId },
            });

            const browserRes = await page.evaluate((id) => client.webhook(id).delete(), webhookId);
            expect(browserRes).toEqual(res);
            validateRequest({
                endpointId: 'delete-webhook',
                params: { webhookId },
            });
        });

        test('test() works', async () => {
            const webhookId = 'webhook_test_id';

            const res = await client.webhook(webhookId).test();
            validateRequest({
                endpointId: 'test-webhook',
                params: { webhookId },
            });

            const browserRes = await page.evaluate((id) => client.webhook(id).test(), webhookId);
            expect(browserRes).toEqual(res);
            validateRequest({
                endpointId: 'test-webhook',
                params: { webhookId },
            });
        });

        test('listDispatches() works', async () => {
            const webhookId = 'webhook_id';
            const opts = {
                limit: 5,
                offset: 3,
                desc: true,
            };

            const res = await client.webhook(webhookId).dispatches().list(opts);
            validateRequest({
                endpointId: 'list-dispatches',
                params: { webhookId },
                query: opts,
            });

            const browserRes = await page.evaluate((id, o) => client.webhook(id).dispatches().list(o), webhookId, opts);
            expect(browserRes).toEqual(res);
            validateRequest({
                endpointId: 'list-dispatches',
                params: { webhookId },
                query: opts,
            });
        });
    });
});
