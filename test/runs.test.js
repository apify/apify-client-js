const { ApifyClient } = require('../src');
const mockServer = require('./mock_server/server');
const { Browser, validateRequest, DEFAULT_OPTIONS } = require('./_helper');

describe('Run methods', () => {
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

    test('get() works', async () => {
        const runId = 'some-run-id';

        const res = await client.run(runId).get();
        expect(res.id).toEqual('get-run');
        validateRequest({}, { runId });

        const browserRes = await page.evaluate((rId) => client.run(rId).get(), runId);
        expect(browserRes).toEqual(res);
        validateRequest({}, { runId });
    });

    test('get() returns undefined on 404 status code (RECORD_NOT_FOUND)', async () => {
        const runId = '404';

        const res = await client.run(runId).get();
        expect(res).toBeUndefined();
        validateRequest({}, { runId });

        const browserRes = await page.evaluate((rId) => client.run(rId).get(), runId);
        expect(browserRes).toEqual(res);
        validateRequest({}, { runId });
    });

    test('abort() works', async () => {
        const runId = 'some-run-id';

        const res = await client.run(runId).abort();
        expect(res.id).toEqual('abort-run');
        validateRequest({}, { runId });

        const browserRes = await page.evaluate((rId) => client.run(rId).abort(), runId);
        expect(browserRes).toEqual(res);
        validateRequest({}, { runId });
    });

    test('resurrect() works', async () => {
        const runId = 'some-run-id';

        const options = {
            build: 'some-build',
            memory: 1024,
            timeout: 400,
        };

        const res = await client.run(runId).resurrect(options);
        expect(res.id).toEqual('resurrect-run');
        validateRequest(options, { runId });

        const browserRes = await page.evaluate((rId, opts) => client.run(rId).resurrect(opts), runId, options);
        expect(browserRes).toEqual(res);
        validateRequest(options, { runId });
    });

    test('metamorph() works', async () => {
        const runId = 'some-run-id';
        const targetActorId = 'some-target-id';
        const contentType = 'application/x-www-form-urlencoded';
        const input = 'some=body';
        const build = '1.2.0';

        const options = {
            build,
            contentType,
        };

        const actualQuery = {
            targetActorId,
            build,
        };

        const res = await client.run(runId).metamorph(targetActorId, input, options);
        expect(res.id).toEqual('metamorph-run');
        validateRequest(actualQuery, { runId }, { some: 'body' }, { 'content-type': contentType });

        const browserRes = await page.evaluate((rId, targetId, i, opts) => {
            return client.run(rId).metamorph(targetId, i, opts);
        }, runId, targetActorId, input, options);
        expect(browserRes).toEqual(res);
        validateRequest(actualQuery, { runId }, { some: 'body' }, { 'content-type': contentType });
    });

    test('metamorph() works with pre-stringified JSON input', async () => {
        const runId = 'some-run-id';
        const targetActorId = 'some-target-id';
        const contentType = 'application/json; charset=utf-8';
        const input = JSON.stringify({ foo: 'bar' });

        const expectedRequest = [
            { targetActorId },
            { runId },
            { foo: 'bar' },
            { 'content-type': contentType },
        ];

        const res = await client.run(runId).metamorph(targetActorId, input, { contentType });
        expect(res.id).toEqual('metamorph-run');
        validateRequest(...expectedRequest);

        const browserRes = await page.evaluate((rId, tId, i, cType) => {
            return client.run(rId).metamorph(tId, i, { contentType: cType });
        }, runId, targetActorId, input, contentType);
        expect(browserRes).toEqual(res);
        validateRequest(...expectedRequest);
    });

    test('metamorph() works with functions in input', async () => {
        const runId = 'some-run-id';
        const targetActorId = 'some-target-id';
        const input = {
            foo: 'bar',
            fn: async (a, b) => a + b,
        };

        const expectedRequest = [
            { targetActorId },
            { runId },
            { foo: 'bar', fn: input.fn.toString() },
            { 'content-type': 'application/json' },
        ];

        const res = await client.run(runId).metamorph(targetActorId, input);
        expect(res.id).toEqual('metamorph-run');
        validateRequest(...expectedRequest);

        const browserRes = await page.evaluate((rId, tId) => {
            return client.run(rId).metamorph(tId, {
                foo: 'bar',
                fn: async (a, b) => a + b,
            });
        }, runId, targetActorId);
        expect(browserRes).toEqual(res);
        validateRequest(...expectedRequest);
    });

    test('reboot() works', async () => {
        const runId = 'some-run-id';

        const res = await client.run(runId).reboot();
        expect(res.id).toEqual('reboot-run');
        validateRequest({}, { runId });

        const browserRes = await page.evaluate((rId) => client.run(rId).reboot(), runId);
        expect(browserRes).toEqual(res);
        validateRequest({}, { runId });
    });

    test('waitForFinish() works', async () => {
        const runId = 'some-run-id';
        const waitSecs = 0.1;
        const data = { status: 'SUCCEEDED' };
        const body = { data };

        setTimeout(() => mockServer.setResponse({ body }), (waitSecs * 1000) / 2);
        const res = await client.run(runId).waitForFinish({ waitSecs });
        expect(res).toEqual(data);
        validateRequest({ waitForFinish: 0 }, { runId });

        const browserRes = await page.evaluate((rId, ws) => client.run(rId).waitForFinish({ waitSecs: ws }), runId, waitSecs);
        expect(browserRes).toEqual(res);
        validateRequest({ waitForFinish: 0 }, { runId });
    });

    test('waitForFinish() resolves immediately with waitSecs: 0', async () => {
        const runId = 'some-run-id';
        const waitSecs = 0;
        const data = { status: 'SUCCEEDED' };
        const body = { data };

        setTimeout(() => mockServer.setResponse({ body }), 10);
        const res = await client.run(runId).waitForFinish({ waitSecs });
        expect(res).toEqual(data);
        validateRequest({ waitForFinish: 0 }, { runId });

        const browserRes = await page.evaluate((rId, ws) => client.run(rId).waitForFinish({ waitSecs: ws }), runId, waitSecs);
        expect(browserRes).toEqual(res);
        validateRequest({ waitForFinish: 0 }, { runId });
    });

    test('dataset().get() works', async () => {
        const runId = 'some-run-id';

        const res = await client.run(runId).dataset().get();
        expect(res.id).toEqual('run-dataset');

        validateRequest({}, { runId });

        const browserRes = await page.evaluate((rId) => client.run(rId).dataset().get(), runId);
        expect(browserRes).toEqual(res);
        validateRequest({}, { runId });
    });

    test('keyValueStore().get() works', async () => {
        const runId = 'some-run-id';

        const res = await client.run(runId).keyValueStore().get();
        expect(res.id).toEqual('run-keyValueStore');

        validateRequest({}, { runId });

        const browserRes = await page.evaluate((rId) => client.run(rId).keyValueStore().get(), runId);
        expect(browserRes).toEqual(res);
        validateRequest({}, { runId });
    });

    test('requestQueue().get() works', async () => {
        const runId = 'some-run-id';

        const res = await client.run(runId).requestQueue().get();
        expect(res.id).toEqual('run-requestQueue');

        validateRequest({}, { runId });

        const browserRes = await page.evaluate((rId) => client.run(rId).requestQueue().get(), runId);
        expect(browserRes).toEqual(res);
        validateRequest({}, { runId });
    });

    test('log().get() works', async () => {
        const runId = 'some-run-id';

        const res = await client.run(runId).log().get();
        expect(res).toEqual('run-log');

        validateRequest({}, { runId });

        const browserRes = await page.evaluate((rId) => client.run(rId).log().get(), runId);
        expect(browserRes).toEqual(res);
        validateRequest({}, { runId });
    });
});
