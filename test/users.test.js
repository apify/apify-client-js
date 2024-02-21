const { ME_USER_NAME_PLACEHOLDER } = require('@apify/consts');

const { Browser, validateRequest, DEFAULT_OPTIONS } = require('./_helper');
const mockServer = require('./mock_server/server');
const { ApifyClient } = require('../src');

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

        test('monthlyUsage() works', async () => {
            const userId = 'some-id';

            const res = await client.user(userId).monthlyUsage();
            expect(res.id).toEqual('get-monthly-usage');
            validateRequest({}, { userId });

            const browserRes = await page.evaluate((id) => client.user(id).monthlyUsage(), userId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { userId });
        });

        test('limits() works', async () => {
            const userId = 'some-id';

            const res = await client.user(userId).limits();
            expect(res.id).toEqual('get-limits');
            validateRequest({}, { userId });

            const browserRes = await page.evaluate((id) => client.user(id).limits(), userId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { userId });
        });
    });
});
