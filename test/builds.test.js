const ApifyClient = require('../src');
const mockServer = require('./mock_server/server');
const { Browser, validateRequest, DEFAULT_QUERY } = require('./_helper');

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
        page = await browser.getInjectedPage(baseUrl, DEFAULT_QUERY);
        client = new ApifyClient({
            baseUrl,
            maxRetries: 0,
            ...DEFAULT_QUERY,
        });
    });
    afterEach(async () => {
        client = null;
        page.close().catch(() => {});
    });

    describe('builds()', () => {
        test.skip('list() works', async () => {
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
            const actorId = 'some-act-id';
            const buildId = 'some-build-id';

            const res = await client.build(buildId, actorId).get();
            expect(res.id).toEqual('get-build');
            validateRequest({}, { actorId, buildId });

            const browserRes = await page.evaluate((bId, aId) => client.build(bId, aId).get(), buildId, actorId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { actorId, buildId });
        });

        test('get() returns undefined on 404 status code (RECORD_NOT_FOUND)', async () => {
            const actorId = '404';
            const buildId = 'some-build-id';

            const res = await client.build(buildId, actorId).get();
            expect(res).toBeUndefined();
            validateRequest({}, { actorId, buildId });

            const browserRes = await page.evaluate((bId, aId) => client.build(bId, aId).get(), buildId, actorId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { actorId, buildId });
        });

        test('abort() works', async () => {
            const actorId = 'some-act-id';
            const buildId = 'some-build-id';

            const res = await client.build(buildId, actorId).abort();
            expect(res.id).toEqual('abort-build');
            validateRequest({}, { actorId, buildId });

            const browserRes = await page.evaluate((bId, aId) => client.build(bId, aId).abort(), buildId, actorId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { actorId, buildId });
        });

        test('waitForFinish() works', async () => {
            const actorId = 'some-actor-id';
            const buildId = 'some-build-id';
            const waitSecs = 0.1;
            const data = { status: 'SUCCEEDED' };
            const body = { data };

            setTimeout(() => mockServer.setResponse({ body }), (waitSecs * 1000) / 2);
            const res = await client.build(buildId, actorId).waitForFinish({ waitSecs });
            expect(res).toEqual(data);
            validateRequest({ waitForFinish: 0 }, { actorId, buildId });

            const browserRes = await page.evaluate(
                (bId, aId, ws) => client.build(bId, aId).waitForFinish({ waitSecs: ws }),
                buildId, actorId, waitSecs,
            );
            expect(browserRes).toEqual(res);
            validateRequest({ waitForFinish: 0 }, { actorId, buildId });
        });
    });
});
