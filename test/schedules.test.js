const ApifyClient = require('../src');
const mockServer = require('./mock_server/server');
const { Browser, validateRequest, DEFAULT_QUERY } = require('./_helper');

describe('Schedule methods', () => {
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

    describe('schedules()', () => {
        test('create() works', async () => {
            const schedule = { foo: 'bar' };

            const res = await client.schedules().create(schedule);
            expect(res.id).toEqual('create-schedule');
            validateRequest({}, {}, schedule);

            const browserRes = await page.evaluate((options) => client.schedules().create(options), schedule);
            expect(browserRes).toEqual(res);
            validateRequest({}, {}, schedule);
        });

        test('list() works', async () => {
            const opts = {
                limit: 5,
                offset: 3,
                desc: true,
            };

            const res = await client.schedules().list(opts);
            expect(res.id).toEqual('list-schedules');
            validateRequest(opts);

            const browserRes = await page.evaluate((options) => client.schedules().list(options), opts);
            expect(browserRes).toEqual(res);
            validateRequest(opts);
        });
    });

    describe('schedule(id)', () => {
        test('get() works', async () => {
            const scheduleId = 'schedule_id';

            const res = await client.schedule(scheduleId).get();
            expect(res.id).toEqual('get-schedule');
            validateRequest({}, { scheduleId });

            const browserRes = await page.evaluate((id) => client.schedule(id).get(), scheduleId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { scheduleId });
        });

        test('get() 404', async () => {
            const scheduleId = '404';

            const res = await client.schedule(scheduleId).get();
            expect(res).toBeUndefined();
            validateRequest({}, { scheduleId });

            const browserRes = await page.evaluate((id) => client.schedule(id).get(), scheduleId);
            expect(browserRes).toBeUndefined();
            validateRequest({}, { scheduleId });
        });

        test('update() works', async () => {
            const scheduleId = 'schedule_id';
            const schedule = {
                foo: 'bar',
                updated: 'value',
            };

            const res = await client.schedule(scheduleId).update(schedule);
            expect(res.id).toEqual('update-schedule');
            validateRequest({}, { scheduleId }, schedule);

            const browserRes = await page.evaluate((id, s) => client.schedule(id).update(s), scheduleId, schedule);
            expect(browserRes).toEqual(res);
            validateRequest({}, { scheduleId }, schedule);
        });

        test('delete() works', async () => {
            const scheduleId = '204';

            const res = await client.schedule(scheduleId).delete();
            expect(res).toBeUndefined();
            validateRequest({}, { scheduleId });

            const browserRes = await page.evaluate((id) => client.schedule(id).delete(), scheduleId);
            expect(browserRes).toBeUndefined();
            validateRequest({}, { scheduleId });
        });
        test('getLog() works', async () => {
            const scheduleId = 'schedule_id';

            const res = await client.schedule(scheduleId).getLog();
            expect(res.id).toEqual('get-log');
            validateRequest({}, { scheduleId });

            const browserRes = await page.evaluate((id) => client.schedule(id).getLog(), scheduleId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { scheduleId });
        });
    });
});
