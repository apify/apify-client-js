import { ME_USER_NAME_PLACEHOLDER } from 'apify-shared/consts';
import ApifyClient from '../build';

import mockServer from './mock_server/server';
import { cleanUpBrowser, getInjectedPage, validateRequest, DEFAULT_QUERY } from './_helper';

describe('User methods', () => {
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

    test('getUser() works', async () => {
        const userId = 'some-id';

        const res = await client.users.getUser({ userId });
        expect(res.id).toEqual('get-user');
        validateRequest({}, { userId });

        const browserRes = await page.evaluate(options => client.users.getUser(options), { userId });
        expect(browserRes).toEqual(res);
        validateRequest({}, { userId });
    });


    test('getUser() with no userId, but with token works', async () => {
        const res = await client.users.getUser();
        expect(res.id).toEqual('get-user');
        validateRequest({}, { userId: ME_USER_NAME_PLACEHOLDER });

        const browserRes = await page.evaluate(options => client.users.getUser(options));
        expect(browserRes).toEqual(res);
        validateRequest({}, { userId: ME_USER_NAME_PLACEHOLDER });
    });
});
