const { Browser, validateRequest, DEFAULT_OPTIONS } = require('./_helper');
const mockServer = require('./mock_server/server');
const { ApifyClient } = require('../src');

describe('Build methods', () => {
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

    describe('builds()', () => {
        test('list() works', async () => {
            const query = {
                limit: 5,
                offset: 3,
                desc: true,
            };

            const res = await client.builds().list(query);
            expect(res.id).toEqual('list-builds');
            validateRequest(query);

            const browserRes = await page.evaluate((opts) => client.builds().list(opts), query);
            expect(browserRes).toEqual(res);
            validateRequest(query);
        });
    });

    describe('build()', () => {
        test('get() works', async () => {
            const buildId = 'some-build-id';

            const res = await client.build(buildId).get();
            expect(res.id).toEqual('get-build');
            validateRequest({}, { buildId });

            const browserRes = await page.evaluate((bId) => client.build(bId).get(), buildId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { buildId });
        });

        test('get() returns undefined on 404 status code (RECORD_NOT_FOUND)', async () => {
            const buildId = '404';

            const res = await client.build(buildId).get();
            expect(res).toBeUndefined();
            validateRequest({}, { buildId });

            const browserRes = await page.evaluate((bId) => client.build(bId).get(), buildId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { buildId });
        });

        test('abort() works', async () => {
            const buildId = 'some-build-id';

            const res = await client.build(buildId).abort();
            expect(res.id).toEqual('abort-build');
            validateRequest({}, { buildId });

            const browserRes = await page.evaluate((bId) => client.build(bId).abort(), buildId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { buildId });
        });

        test('waitForFinish() works', async () => {
            const buildId = 'some-build-id';
            const waitSecs = 0.1;
            const data = { status: 'SUCCEEDED' };
            const body = { data };

            setTimeout(() => mockServer.setResponse({ body }), (waitSecs * 1000) / 2);
            const res = await client.build(buildId).waitForFinish({ waitSecs });
            expect(res).toEqual(data);
            validateRequest({ waitForFinish: 0 }, { buildId });

            const browserRes = await page.evaluate(
                (bId, ws) => client.build(bId).waitForFinish({ waitSecs: ws }),
                buildId,
                waitSecs,
            );
            expect(browserRes).toEqual(res);
            validateRequest({ waitForFinish: 0 }, { buildId });
        });

        test('log().get() works', async () => {
            const buildId = 'some-build-id';

            const resource = await client.build(buildId).log().get();
            expect(resource).toEqual('build-log');
            validateRequest({}, { buildId });

            const browserRes = await page.evaluate((id) => client.build(id).log().get(), buildId);
            expect(browserRes).toEqual('build-log');
            validateRequest({}, { buildId });
        });
    });
});
