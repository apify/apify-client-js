const { ME_USER_NAME_PLACEHOLDER } = require('@apify/consts');
const ApifyClient = require('../src');
const mockServer = require('./mock_server/server');
const { Browser, validateRequest, DEFAULT_OPTIONS } = require('./_helper');

describe('User methods', () => {
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

    describe('user(id)', () => {
        test('get() works', async () => {
            const userId = 'some-id';

            const res = await client.user(userId).get();
            expect(res.id).toEqual('get-user');
            validateRequest({}, { userId });

            const browserRes = await page.evaluate((id) => client.user(id).get(), userId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { userId });
        });

        test('get() with no userId', async () => {
            const res = await client.user().get();
            expect(res.id).toEqual('get-user');
            validateRequest({}, { userId: ME_USER_NAME_PLACEHOLDER });

            const browserRes = await page.evaluate((id) => client.user(id).get());
            expect(browserRes).toEqual(res);
            validateRequest({}, { userId: ME_USER_NAME_PLACEHOLDER });
        });
    });
});
