const { Browser, validateRequest, DEFAULT_OPTIONS } = require('./_helper');
const { ApifyClient, LoggerActorRedirect } = require('apify-client');
const { MOCKED_ACTOR_LOGS_PROCESSED } = require('./mock_server/consts');
const mockServer = require('./mock_server/server');
const c = require('ansi-colors');

describe('Log methods', () => {
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

    describe('log(buildOrRunId)', () => {
        test('get() works', async () => {
            const logId = 'some-id';

            const res = await client.log(logId).get();
            expect(res).toBe('get-log');
            validateRequest({}, { logId });

            const browserRes = await page.evaluate((id) => client.log(id).get(), logId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { logId });
        });

        test('stream() works', async () => {
            const logId = 'some-id';

            const res = await client.log(logId).stream();
            const chunks = [];
            for await (const chunk of res) {
                chunks.push(chunk);
            }
            const id = Buffer.concat(chunks).toString();
            expect(id).toBe('get-log');
            validateRequest({ stream: true }, { logId });
        });
    });
});

describe('Redirect logs', () => {
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

    describe('run.getStreamedLog', () => {
        test('getStreamedLog - fromStart', async () => {
            const logSpy = jest.spyOn(LoggerActorRedirect.prototype, '_console_log').mockImplementation(() => {});

            // Set fake time in constructor to skip the first redirected log entry, fromStart=True should redirect all logs
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2025-05-13T07:24:12.686Z'));
            const streamedLog = await client.run('redirect-run-id').getStreamedLog();
            jest.useRealTimers();

            await streamedLog.start();
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

            await streamedLog.start();
            await streamedLog.stop();
            const loggerPrefix = c.cyan('redirect-actor-name runId:redirect-run-id -> ');
            expect(logSpy.mock.calls).toEqual(
                MOCKED_ACTOR_LOGS_PROCESSED.slice(1).map((item) => [loggerPrefix + item]),
            );
            logSpy.mockRestore();
        });
    });
});
