const ApifyClient = require('../src');
const mockServer = require('./mock_server/server');
const { Browser, validateRequest, DEFAULT_QUERY } = require('./_helper');

describe('Run methods', () => {
    let baseUrl;
    const browser = new Browser();

    beforeAll(async () => {
        const server = await mockServer.start();
        await browser.start();
        baseUrl = `http://localhost:${server.address().port}/v2`;
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

    test('get() works', async () => {
        const actorId = 'some-act-id';
        const runId = 'some-run-id';

        const res = await client.run(runId, actorId).get();
        expect(res.id).toEqual('get-run');
        validateRequest({}, { actorId, runId });

        const browserRes = await page.evaluate((rId, aId) => client.run(rId, aId).get(), runId, actorId);
        expect(browserRes).toEqual(res);
        validateRequest({}, { actorId, runId });
    });

    test('get() returns undefined on 404 status code (RECORD_NOT_FOUND)', async () => {
        const actorId = '404';
        const runId = 'some-run-id';

        const res = await client.run(runId, actorId).get();
        expect(res).toBeUndefined();
        validateRequest({}, { actorId, runId });

        const browserRes = await page.evaluate((rId, aId) => client.run(rId, aId).get(), runId, actorId);
        expect(browserRes).toEqual(res);
        validateRequest({}, { actorId, runId });
    });

    test('abort() works', async () => {
        const actorId = 'some-act-id';
        const runId = 'some-run-id';

        const res = await client.run(runId, actorId).abort();
        expect(res.id).toEqual('abort-run');
        validateRequest({}, { actorId, runId });

        const browserRes = await page.evaluate((rId, aId) => client.run(rId, aId).abort(), runId, actorId);
        expect(browserRes).toEqual(res);
        validateRequest({}, { actorId, runId });
    });

    test('resurrect() works', async () => {
        const actorId = 'some-act-id';
        const runId = 'some-run-id';

        const res = await client.run(runId, actorId).resurrect();
        expect(res.id).toEqual('resurrect-run');
        validateRequest({}, { actorId, runId });

        const browserRes = await page.evaluate((rId, aId) => client.run(rId, aId).resurrect(), runId, actorId);
        expect(browserRes).toEqual(res);
        validateRequest({}, { actorId, runId });
    });

    test('metamorph() works', async () => {
        const actorId = 'some-id';
        const runId = 'some-run-id';
        const targetActorId = 'some-target-id';
        const contentType = 'application/x-www-form-urlencoded';
        const input = 'some=body';
        const build = '1.2.0';

        const options = {
            build,
            contentType,
            input,
        };

        const actualQuery = {
            targetActorId,
            build,
        };

        const res = await client.run(runId, actorId).metamorph(targetActorId, options);
        expect(res.id).toEqual('metamorph-run');
        validateRequest(actualQuery, { actorId, runId }, { some: 'body' }, { 'content-type': contentType });

        const browserRes = await page.evaluate((rId, aId, targetId, opts) => {
            return client.run(rId, aId).metamorph(targetId, opts);
        }, runId, actorId, targetActorId, options);
        expect(browserRes).toEqual(res);
        validateRequest(actualQuery, { actorId, runId }, { some: 'body' }, { 'content-type': contentType });
    });

    test('dataset().get() works', async () => {

    });

    test('keyValueStore().get() works', async () => {

    });

    test('requestQueue().get() works', async () => {

    });

    test('log().get() works', async () => {

    });
});
