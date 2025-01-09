const { Browser, validateRequest, DEFAULT_OPTIONS } = require('./_helper');
const mockServer = require('./mock_server/server');
const { ApifyClient } = require('../src');

describe('Webhook Dispatch methods', () => {
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

    describe('webhookDispatches()', () => {
        test('list() works', async () => {
            const opts = {
                limit: 5,
                offset: 3,
                desc: true,
            };

            const res = await client.webhookDispatches().list(opts);
            expect(res.id).toEqual('list-dispatches');
            validateRequest(opts);

            const browserRes = await page.evaluate((options) => client.webhookDispatches().list(options), opts);
            expect(browserRes).toEqual(res);
            validateRequest(opts);
        });
    });

    describe('webhookDispatch(id)', () => {
        test('get() works', async () => {
            const webhookDispatchId = 'some-id';

            const res = await client.webhookDispatch(webhookDispatchId).get();
            expect(res.id).toEqual('get-dispatch');
            validateRequest({}, { webhookDispatchId });

            const browserRes = await page.evaluate((id) => client.webhookDispatch(id).get(), webhookDispatchId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { webhookDispatchId });
        });

        test('get() 404 works', async () => {
            const webhookDispatchId = '404';

            const res = await client.webhookDispatch(webhookDispatchId).get();
            expect(res).toBeUndefined();
            validateRequest({}, { webhookDispatchId });

            const browserRes = await page.evaluate((id) => client.webhookDispatch(id).get(), webhookDispatchId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { webhookDispatchId });
        });
    });
});
