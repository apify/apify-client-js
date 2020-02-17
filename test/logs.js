import { expect } from 'chai';
import ApifyClient from '../build';

import mockServer from './mock_server/server';
import { cleanUpBrowser, getInjectedPage, validateRequest, DEFAULT_QUERY } from './_helper';

describe('Log methods', () => {
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


    it('getLog() works', async () => {
        const logId = 'some-id';

        const res = await client.logs.getLog({ logId });
        expect(res.id).to.be.eql('get-log');
        validateRequest({}, { logId });

        const browserRes = await page.evaluate(options => client.logs.getLog(options), { logId });
        expect(browserRes).to.eql(res);
        validateRequest({}, { logId });
    });
});
