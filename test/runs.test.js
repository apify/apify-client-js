const { Browser, validateRequest, DEFAULT_OPTIONS } = require('./_helper');
const { ApifyClient, LoggerActorRedirect } = require('apify-client');
const { mockServer, createDefaultApp } = require('./mock_server/server');
const c = require('ansi-colors');
const { MOCKED_ACTOR_LOGS_PROCESSED, MOCKED_ACTOR_STATUSES, StatusGenerator } = require('./mock_server/consts');
const express = require("express");

describe('Run methods', () => {
    let baseUrl;
    const browser = new Browser();

    beforeAll(async () => {
        const server = await mockServer.start();
        await browser.start();
        baseUrl = `http://localhost:${server.address().port}`;
    });

    afterAll(async () => {
        await Promise.all([mockServer.close(), browser.cleanUpBrowser()]);
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

    describe('runs()', () => {
        test('list() works single status', async () => {
            const query = {
                limit: 5,
                offset: 3,
                desc: true,
                status: 'SUCCEEDED',
            };

            const res = await client.runs().list(query);
            expect(res.id).toEqual('list-runs');
            validateRequest(query);

            const browserRes = await page.evaluate((opts) => client.runs().list(opts), query);
            expect(browserRes).toEqual(res);
            validateRequest(query);
        });

        test('list() works multiple statuses', async () => {
            const query = {
                limit: 5,
                offset: 3,
                desc: true,
                status: ['SUCCEEDED', 'FAILED'],
            };

            const expectedQuery = {
                ...query,
                status: 'SUCCEEDED,FAILED', // This is what should be sent to the API
            };

            const res = await client.runs().list(query);
            expect(res.id).toEqual('list-runs');
            validateRequest(expectedQuery);

            const browserRes = await page.evaluate((opts) => client.runs().list(opts), query);
            expect(browserRes).toEqual(res);
            validateRequest(expectedQuery);
        });

        test('list() allows startedBefore and startedAfter to be passed as Date object', async () => {
            const now = new Date();
            const query = {
                startedBefore: now,
                startedAfter: now,
            };

            const expectedQuery = {
                startedBefore: now.toISOString(),
                startedAfter: now.toISOString(),
            };

            const res = await client.runs().list(query);
            expect(res.id).toEqual('list-runs');
            validateRequest(expectedQuery);

            const browserRes = await page.evaluate((opts) => client.runs().list(opts), query);
            expect(browserRes).toEqual(res);
            validateRequest(expectedQuery);
        });

        test('list() allows startedBefore and startedAfter to be passed as string', async () => {
            const now = new Date();
            const query = {
                startedBefore: now.toISOString(),
                startedAfter: now.toISOString(),
            };

            const expectedQuery = {
                ...query,
            };

            const res = await client.runs().list(query);
            expect(res.id).toEqual('list-runs');
            validateRequest(expectedQuery);

            const browserRes = await page.evaluate((opts) => client.runs().list(opts), query);
            expect(browserRes).toEqual(res);
            validateRequest(expectedQuery);
        });
    });

    describe('run()', () => {
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

            const browserRes = await page.evaluate(
                (rId, targetId, i, opts) => {
                    return client.run(rId).metamorph(targetId, i, opts);
                },
                runId,
                targetActorId,
                input,
                options,
            );
            expect(browserRes).toEqual(res);
            validateRequest(actualQuery, { runId }, { some: 'body' }, { 'content-type': contentType });
        });

        test('metamorph() works with pre-stringified JSON input', async () => {
            const runId = 'some-run-id';
            const targetActorId = 'some-target-id';
            const contentType = 'application/json; charset=utf-8';
            const input = JSON.stringify({ foo: 'bar' });

            const expectedRequest = [{ targetActorId }, { runId }, { foo: 'bar' }, { 'content-type': contentType }];

            const res = await client.run(runId).metamorph(targetActorId, input, { contentType });
            expect(res.id).toEqual('metamorph-run');
            validateRequest(...expectedRequest);

            const browserRes = await page.evaluate(
                (rId, tId, i, cType) => {
                    return client.run(rId).metamorph(tId, i, { contentType: cType });
                },
                runId,
                targetActorId,
                input,
                contentType,
            );
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

            const browserRes = await page.evaluate(
                (rId, tId) => {
                    return client.run(rId).metamorph(tId, {
                        foo: 'bar',
                        fn: async (a, b) => a + b,
                    });
                },
                runId,
                targetActorId,
            );
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

            const browserRes = await page.evaluate(
                (rId, ws) => client.run(rId).waitForFinish({ waitSecs: ws }),
                runId,
                waitSecs,
            );
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

            const browserRes = await page.evaluate(
                (rId, ws) => client.run(rId).waitForFinish({ waitSecs: ws }),
                runId,
                waitSecs,
            );
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

        test('charge() works', async () => {
            const runId = 'some-run-id';

            const res = await client.run(runId).charge({ eventName: 'some-event' });
            expect(res.status).toEqual(200);

            await expect(client.run(runId).charge()).rejects.toThrow(
                'Expected `options` to be of type `object` but received type `undefined`\n' +
                    'Cannot convert undefined or null to object in object `options`',
            );
        });
    });
});

describe('Redirect run logs', () => {
    let baseUrl;

    beforeAll(async () => {
        // Ensure that the tests that use characters like á are correctly decoded in console.
        process.stdout.setDefaultEncoding('utf8');
        const server = await mockServer.start();
        baseUrl = `http://localhost:${server.address().port}`;
    });

    afterAll(async () => {
        await Promise.all([mockServer.close()]);
    });

    let client;
    beforeEach(async () => {
        client = new ApifyClient({
            baseUrl,
            maxRetries: 0,
            ...DEFAULT_OPTIONS,
        });
    });
    afterEach(async () => {
        client = null;
    });

    describe('run.getStreamedLog', () => {
        test('getStreamedLog - fromStart', async () => {
            const logSpy = jest.spyOn(LoggerActorRedirect.prototype, '_console_log').mockImplementation(() => {});

            // Set fake time in constructor to skip the first redirected log entry, fromStart=True should redirect all logs
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2025-05-13T07:24:12.686Z'));
            const streamedLog = await client.run('redirect-run-id').getStreamedLog();
            jest.useRealTimers();

            streamedLog.start();
            // Wait some time to accumulate logs
            await new Promise((resolve) => {
                setTimeout(resolve, 1000);
            });
            await streamedLog.stop();

            const loggerPrefix = c.cyan('redirect-actor-name runId:redirect-run-id -> ');
            expect(logSpy.mock.calls).toEqual(MOCKED_ACTOR_LOGS_PROCESSED.map((item) => [loggerPrefix + item]));
            logSpy.mockRestore();
        });

        test('getStreamedLog - not fromStart', async () => {
            const logSpy = jest.spyOn(LoggerActorRedirect.prototype, '_console_log').mockImplementation(() => {});

            // Set fake time in constructor to skip the first redirected log entry, fromStart is redirecting only new logs
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2025-05-13T07:24:12.686Z'));
            const streamedLog = await client.run('redirect-run-id').getStreamedLog({ fromStart: false });
            jest.useRealTimers();

            streamedLog.start();
            // Wait some time to accumulate logs
            await new Promise((resolve) => {
                setTimeout(resolve, 1000);
            });
            await streamedLog.stop();

            const loggerPrefix = c.cyan('redirect-actor-name runId:redirect-run-id -> ');
            expect(logSpy.mock.calls).toEqual(
                MOCKED_ACTOR_LOGS_PROCESSED.slice(1).map((item) => [loggerPrefix + item]),
            );
            logSpy.mockRestore();
        });
    });
});

describe('Redirect run status message', () => {
    let baseUrl;
    let client;
    const statusGenerator = new StatusGenerator();

    beforeAll(async () => {
        // Use custom router for the tests
        const router = express.Router();
        // Set up a status generator to simulate run status changes. It will be reset for each test.
        router.get('/actor-runs/redirect-run-id', async (req, res) => {
            // Delay the response to give the actor time to run and produce expected logs
            await new Promise((resolve) => {
                setTimeout(resolve, 10);
            });
            const [status, statusMessage] = statusGenerator.next().value;
            res.json({ data: { id: 'redirect-run-id', actId: 'redirect-actor-id', status, statusMessage } });
        });
        const app = createDefaultApp(router);
        const server = await mockServer.start(undefined, app);
        baseUrl = `http://localhost:${server.address().port}`;
    });

    afterAll(async () => {
        await Promise.all([mockServer.close()]);
    });

    beforeEach(async () => {
        client = new ApifyClient({
            baseUrl,
            maxRetries: 0,
            ...DEFAULT_OPTIONS,
        });
    });
    afterEach(async () => {
        // Reset the generator to so that the next test starts fresh
        statusGenerator.reset();
        client = null;
    });

    describe('run.getStatusMessageWatcher', () => {
        test('Log same repeated statuses just once', async () => {
            const logSpy = jest.spyOn(LoggerActorRedirect.prototype, '_console_log').mockImplementation(() => {});

            const statusMessageWatcher = await client
                .run('redirect-run-id').getStatusMessageWatcher({ checkPeriod: 1 });

            statusMessageWatcher.start();
            // Wait some time to accumulate statuses
            await new Promise((resolve) => {
                setTimeout(resolve, 1000);
            });
            await statusMessageWatcher.stop();

            const loggerPrefix = c.cyan('redirect-actor-name runId:redirect-run-id -> ');
            const uniqueStatuses = Array.from(new Set(MOCKED_ACTOR_STATUSES.map(JSON.stringify))).map(JSON.parse);
            expect(logSpy.mock.calls).toEqual(
                uniqueStatuses.map((item) => [`${loggerPrefix}Status: ${item[0]}, Message: ${item[1]}`]),
            );
            logSpy.mockRestore();
        });
    });
});
