const ApifyClient = require('../src');
const mockServer = require('./mock_server/server');
const { Browser, validateRequest, DEFAULT_QUERY } = require('./_helper');

describe('User methods', () => {
    let baseUrl;
    const browser = new Browser();

    beforeAll(async () => {
        const server = await mockServer.start();
        await browser.start();
        baseUrl = `http://localhost:${server.address().port}/v2`;
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
        page = await browser.getInjectedPage(baseUrl, DEFAULT_QUERY);
        client = new ApifyClient({
            baseUrl,
            maxRetries: 0,
            ...DEFAULT_QUERY,
        });
    });
    afterEach(async () => {
        client = null;
        page.close().catch(() => {});
    });

    test('listDispatches() works', async () => {
        const opts = {
            limit: 5,
            offset: 3,
            desc: true,
        };

        const res = await client.webhookDispatches.listDispatches(opts);
        expect(res.id).toEqual('list-dispatches');
        validateRequest(opts);

        const browserRes = await page.evaluate(options => client.webhookDispatches.listDispatches(options), opts);
        expect(browserRes).toEqual(res);
        validateRequest(opts);
    });

    test('getDispatch() works', async () => {
        const webhookDispatchId = 'some-id';

        const res = await client.webhookDispatches.getDispatch({ webhookDispatchId });
        expect(res.id).toEqual('get-dispatch');
        validateRequest({}, { webhookDispatchId });

        const browserRes = await page.evaluate(options => client.webhookDispatches.getDispatch(options), { webhookDispatchId });
        expect(browserRes).toEqual(res);
        validateRequest({}, { webhookDispatchId });
    });

    test('getDispatch() 404 works', async () => {
        const webhookDispatchId = '404';

        const res = await client.webhookDispatches.getDispatch({ webhookDispatchId });
        expect(res).toEqual(null);
        validateRequest({}, { webhookDispatchId });

        const browserRes = await page.evaluate(options => client.webhookDispatches.getDispatch(options), { webhookDispatchId });
        expect(browserRes).toEqual(res);
        validateRequest({}, { webhookDispatchId });
    });
});
