const { ApifyClient } = require('../src');
const mockServer = require('./mock_server/server');
const { Browser, validateRequest, DEFAULT_OPTIONS } = require('./_helper');

describe('Webhook methods', () => {
    let baseUrl;
    const browser = new Browser();

    beforeAll(async () => {
        const server = await mockServer.start();
        await browser.start();
        baseUrl = `http://localhost:${server.address().port}`;
    });

    afterAll(async () => {
        await Promise.all([
            mockServer.close(),
            browser.cleanUpBrowser(),
        ]);
    });

    let client;
    let page;
    beforeEach(async () => {
        page = await browser.getInjectedPage(baseUrl, DEFAULT_OPTIONS);
        client = new ApifyClient({
            baseUrl,
            maxRetries: 0,
            ...DEFAULT_OPTIONS,
        });
    });
    afterEach(async () => {
        client = null;
        page.close().catch(() => {});
    });

    describe('webhooks()', () => {
        test('create() works', async () => {
            const webhook = { foo: 'bar' };

            const res = await client.webhooks().create(webhook);
            expect(res.id).toEqual('create-webhook');
            validateRequest({}, {}, webhook);

            const browserRes = await page.evaluate((w) => client.webhooks().create(w), webhook);
            expect(browserRes).toEqual(res);
            validateRequest({}, {}, webhook);
        });

        test('listWebhooks() works', async () => {
            const opts = {
                limit: 5,
                offset: 3,
                desc: true,
            };

            const res = await client.webhooks().list(opts);
            expect(res.id).toEqual('list-webhooks');
            validateRequest(opts);

            const browserRes = await page.evaluate((options) => client.webhooks().list(options), opts);
            expect(browserRes).toEqual(res);
            validateRequest(opts);
        });
    });

    describe('webhook(id)', () => {
        test('get() works', async () => {
            const webhookId = 'webhook_id';

            const res = await client.webhook(webhookId).get();
            expect(res.id).toEqual('get-webhook');
            validateRequest({}, { webhookId });

            const browserRes = await page.evaluate((id) => client.webhook(id).get(), webhookId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { webhookId });
        });

        test('get() 404', async () => {
            const webhookId = '404';

            const res = await client.webhook(webhookId).get();
            expect(res).toBeUndefined();
            validateRequest({}, { webhookId });

            const browserRes = await page.evaluate((id) => client.webhook(id).get(), webhookId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { webhookId });
        });

        test('update() works', async () => {
            const webhookId = 'webhook_id';
            const webhook = {
                foo: 'bar',
                updated: 'value',
            };

            const res = await client.webhook(webhookId).update(webhook);
            expect(res.id).toEqual('update-webhook');
            validateRequest({}, { webhookId }, webhook);

            const browserRes = await page.evaluate((id, w) => client.webhook(id).update(w), webhookId, webhook);
            expect(browserRes).toEqual(res);
            validateRequest({}, { webhookId }, webhook);
        });

        test('delete() works', async () => {
            const webhookId = '204';

            const res = await client.webhook(webhookId).delete();
            expect(res).toBeUndefined();
            validateRequest({}, { webhookId });

            const browserRes = await page.evaluate((id) => client.webhook(id).delete(), webhookId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { webhookId });
        });

        test('test() works', async () => {
            const webhookId = 'webhook_test_id';

            const res = await client.webhook(webhookId).test();
            expect(res.id).toEqual('test-webhook');
            validateRequest({}, { webhookId });

            const browserRes = await page.evaluate((id) => client.webhook(id).test(), webhookId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { webhookId });
        });

        test('listDispatches() works', async () => {
            const webhookId = 'webhook_id';
            const opts = {
                limit: 5,
                offset: 3,
                desc: true,
            };

            const res = await client.webhook(webhookId).dispatches().list(opts);
            expect(res.id).toEqual('list-dispatches');
            validateRequest(opts, { webhookId });

            const browserRes = await page.evaluate((id, o) => client.webhook(id).dispatches().list(o), webhookId, opts);
            expect(browserRes).toEqual(res);
            validateRequest(opts, { webhookId });
        });
    });
});
