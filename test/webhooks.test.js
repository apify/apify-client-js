const ApifyClient = require('../src');

const mockServer = require('./mock_server/server');
const { cleanUpBrowser, getInjectedPage, validateRequest, DEFAULT_QUERY } = require('./_helper');


describe('Actor methods', () => {
    let baseUrl = null;
    let page;
    beforeAll(async () => {
        const server = await mockServer.start();
        baseUrl = `http://localhost:${server.address().port}`;
    });
    afterAll(() => mockServer.close());

    let client = null;
    beforeEach(async () => {
        page = await getInjectedPage(baseUrl, DEFAULT_QUERY);
        client = new ApifyClient({
            baseUrl,
            expBackoffMaxRepeats: 0,
            expBackoffMillis: 1,
            ...DEFAULT_QUERY,
        });
    });
    afterEach(async () => {
        client = null;
        await cleanUpBrowser(page);
    });


    test('createWebhook() works', async () => {
        const webhook = { foo: 'bar' };

        const res = await client.webhooks.createWebhook({ webhook });
        expect(res.id).toEqual('create-webhook');
        validateRequest({}, {}, webhook);

        const browserRes = await page.evaluate(options => client.webhooks.createWebhook(options), { webhook });
        expect(browserRes).toEqual(res);
        validateRequest({}, {}, webhook);
    });

    test('listWebhooks() works', async () => {
        const opts = {
            limit: 5,
            offset: 3,
            desc: true,
        };

        const res = await client.webhooks.listWebhooks(opts);
        expect(res.id).toEqual('list-webhooks');
        validateRequest(opts);

        const browserRes = await page.evaluate(options => client.webhooks.listWebhooks(options), opts);
        expect(browserRes).toEqual(res);
        validateRequest(opts);
    });

    test('getWebhook() works', async () => {
        const webhookId = 'webhook_id';

        const res = await client.webhooks.getWebhook({ webhookId });
        expect(res.id).toEqual('get-webhook');
        validateRequest({}, { webhookId });

        const browserRes = await page.evaluate(options => client.webhooks.getWebhook(options), { webhookId });
        expect(browserRes).toEqual(res);
        validateRequest({}, { webhookId });
    });

    test('getWebhook() 404', async () => {
        const webhookId = '404';

        const res = await client.webhooks.getWebhook({ webhookId });
        expect(res).toEqual(null);
        validateRequest({}, { webhookId });

        const browserRes = await page.evaluate(options => client.webhooks.getWebhook(options), { webhookId });
        expect(browserRes).toEqual(res);
        validateRequest({}, { webhookId });
    });

    test('updateWebhook() works', async () => {
        const webhookId = 'webhook_id';
        const webhook = {
            foo: 'bar',
            updated: 'value',
        };

        const res = await client.webhooks.updateWebhook({ webhookId, webhook });
        expect(res.id).toEqual('update-webhook');
        validateRequest({}, { webhookId }, webhook);

        const browserRes = await page.evaluate(options => client.webhooks.updateWebhook(options), { webhookId, webhook });
        expect(browserRes).toEqual(res);
        validateRequest({}, { webhookId }, webhook);
    });

    test('deleteWebhook() works', async () => {
        const webhookId = '204';

        const res = await client.webhooks.deleteWebhook({ webhookId });
        expect(res).toEqual('');
        validateRequest({}, { webhookId });

        const browserRes = await page.evaluate(options => client.webhooks.deleteWebhook(options), { webhookId });
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

        const res = await client.webhooks.listDispatches({ webhookId, ...opts });
        expect(res.id).toEqual('list-dispatches');
        validateRequest(opts, { webhookId });

        const browserRes = await page.evaluate(options => client.webhooks.listDispatches(options), { webhookId, ...opts });
        expect(browserRes).toEqual(res);
        validateRequest(opts, { webhookId });
    });
});
