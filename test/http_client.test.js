const { Browser } = require('./_helper');
const mockServer = require('./mock_server/server');
const { ApifyClient } = require('../src/index');

describe('HttpClient', () => {
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
        page = await browser.getInjectedPage(baseUrl, { timeoutSecs: 1 });
        client = new ApifyClient({
            baseUrl,
            timeoutSecs: 1,
            maxRetries: 0,
        });
    });
    afterEach(async () => {
        client = null;
        page.close().catch(() => {});
    });
    test('requests timeout after timeoutSecs', async () => {
        const context = { delayMillis: 3000 };
        const resourceId = Buffer.from(JSON.stringify(context)).toString('hex');

        expect.assertions(2);
        try {
            await client.actor(resourceId).get();
        } catch (err) {
            expect(err.message).toMatch('timeout of 1000ms exceeded');
        }

        try {
            const r = await page.evaluate((rId) => client.task(rId).get(), resourceId);
            expect(r).toBeDefined();
        } catch (err) {
            expect(err.message).toMatch('timeout of 1000ms exceeded');
        }
    });
});
