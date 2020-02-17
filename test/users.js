import { ME_USER_NAME_PLACEHOLDER } from 'apify-shared/consts';
import { expect } from 'chai';
import ApifyClient from '../build';

import mockServer from './mock_server/server';
import { cleanUpBrowser, getInjectedPage, validateRequest, DEFAULT_QUERY } from './_helper';

describe('User methods', () => {
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

    it('getUser() works', async () => {
        const userId = 'some-id';

        const res = await client.users.getUser({ userId });
        expect(res.id).to.be.eql('get-user');
        validateRequest({}, { userId });

        const browserRes = await page.evaluate(options => client.users.getUser(options), { userId });
        expect(browserRes).to.eql(res);
        validateRequest({}, { userId });
    });


    it('getUser() with no userId, but with token works', async () => {
        const res = await client.users.getUser();
        expect(res.id).to.be.eql('get-user');
        validateRequest({}, { userId: ME_USER_NAME_PLACEHOLDER });

        const browserRes = await page.evaluate(options => client.users.getUser(options));
        expect(browserRes).to.eql(res);
        validateRequest({}, { userId: ME_USER_NAME_PLACEHOLDER });
    });
});
