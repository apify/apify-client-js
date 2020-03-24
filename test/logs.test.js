import ApifyClient from '../build';

import mockServer from './mock_server/server';
import { cleanUpBrowser, getInjectedPage, validateRequest, DEFAULT_QUERY } from './_helper';

describe('Log methods', () => {
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


    test('getLog() works', async () => {
        const logId = 'some-id';

        const res = await client.logs.getLog({ logId });
        validateRequest({}, { logId });

        const browserRes = await page.evaluate(options => client.logs.getLog(options), { logId });
        expect(browserRes).toEqual(res);
        validateRequest({}, { logId });
    });
});
