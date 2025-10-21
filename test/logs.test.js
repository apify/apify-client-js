const { Browser, validateRequest, DEFAULT_OPTIONS } = require('./_helper');
const { ApifyClient, LoggerActorRedirect } = require('apify-client');
const {MOCKED_ACTOR_LOGS, MOCKED_ACTOR_LOGS_PROCESSED} = require('./mock_server/consts');
const mockServer = require('./mock_server/server');
const c = require("ansi-colors");
const { Logger } = require("@apify/log");

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

    describe('run log', () => {
        test('stream() works', async () => {
            const logId = 'redirect-log-id';

            const res = await client.log(logId).stream();
            const chunks = [];
            for await (const chunk of res) {
                chunks.push(chunk);
            }
            const log = Buffer.concat(chunks).toString();
            expect(log).toBe(MOCKED_ACTOR_LOGS.join(""));
        });

        test('StreamedLog', async () => {
            const logSpy = jest.spyOn(LoggerActorRedirect.prototype, '_console_log').mockImplementation(() => {});

            const streamedLog = await client.run('redirect-run-id').getStreamedLog();

            await streamedLog.start()
            await streamedLog.stop()
            let logger_prefix = c.cyan('redirect-actor-name runId:redirect-run-id -> ');
            expect(logSpy.mock.calls).toEqual(MOCKED_ACTOR_LOGS_PROCESSED.map(item => [logger_prefix + item]));
            logSpy.mockRestore();

        });
    });
});
