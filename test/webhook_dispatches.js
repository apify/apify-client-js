import { expect } from 'chai';
import ApifyClient from '../build';
import mockServer from './mock_server/server';
import { cleanUpBrowser, getInjectedPage, validateRequest, DEFAULT_QUERY } from './_helper';

describe('Actor methods', () => {
    let baseUrl = null;
    let page;
    before(async () => {
        const server = await mockServer.start(3333);
        baseUrl = `http://localhost:${server.address().port}`;
    });
    after(() => mockServer.close());

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

    it('listDispatches() works', async () => {
        const opts = {
            limit: 5,
            offset: 3,
            desc: true,
        };

        const res = await client.webhookDispatches.listDispatches(opts);
        expect(res.id).to.be.eql('list-dispatches');
        validateRequest(opts);

        const browserRes = await page.evaluate(options => client.webhookDispatches.listDispatches(options), opts);
        expect(browserRes).to.eql(res);
        validateRequest(opts);
    });

    it('getDispatch() works', async () => {
        const webhookDispatchId = 'some-id';

        const res = await client.webhookDispatches.getDispatch({ webhookDispatchId });
        expect(res.id).to.be.eql('get-dispatch');
        validateRequest({}, { webhookDispatchId });

        const browserRes = await page.evaluate(options => client.webhookDispatches.getDispatch(options), { webhookDispatchId });
        expect(browserRes).to.eql(res);
        validateRequest({}, { webhookDispatchId });
    });

    it('getDispatch() 404 works', async () => {
        const webhookDispatchId = '404';

        const res = await client.webhookDispatches.getDispatch({ webhookDispatchId });
        expect(res).to.be.eql(null);
        validateRequest({}, { webhookDispatchId });

        const browserRes = await page.evaluate(options => client.webhookDispatches.getDispatch(options), { webhookDispatchId });
        expect(browserRes).to.eql(res);
        validateRequest({}, { webhookDispatchId });
    });
});
