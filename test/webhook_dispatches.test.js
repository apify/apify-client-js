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
