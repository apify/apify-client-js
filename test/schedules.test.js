const ApifyClient = require('../src');

const mockServer = require('./mock_server/server');
const { cleanUpBrowser, getInjectedPage, validateRequest, DEFAULT_QUERY } = require('./_helper');

describe('Schedule methods', () => {
    let baseUrl = null;
    let page;
    beforeAll(async () => {
        const server = await mockServer.start();
        baseUrl = `http://localhost:${server.address().port}`;
    });
    afterAll(() => mockServer.close());

    let client = null;
    beforeEach(async () => {
        page = await getInjectedPage(baseUrl, DEFAULT_QUERY);
        client = new ApifyClient({
            baseUrl,
            expBackoffMaxRepeats: 0,
            expBackoffMillis: 1,
            ...DEFAULT_QUERY,
        });
    });
    afterEach(async () => {
        client = null;
        await cleanUpBrowser(page);
    });

    test('createSchedule() works', async () => {
        const schedule = { foo: 'bar' };

        const res = await client.schedules.createSchedule({ schedule });
        expect(res.id).toEqual('create-schedule');
        validateRequest({}, {}, schedule);

        const browserRes = await page.evaluate(options => client.schedules.createSchedule(options), { schedule });
        expect(browserRes).toEqual(res);
        validateRequest({}, {}, schedule);
    });

    test('listSchedules() works', async () => {
        const opts = {
            limit: 5,
            offset: 3,
            desc: true,
        };

        const res = await client.schedules.listSchedules(opts);
        expect(res.id).toEqual('list-schedules');
        validateRequest(opts);

        const browserRes = await page.evaluate(options => client.schedules.listSchedules(options), opts);
        expect(browserRes).toEqual(res);
        validateRequest(opts);
    });

    test('getSchedule() works', async () => {
        const scheduleId = 'schedule_id';

        const res = await client.schedules.getSchedule({ scheduleId });
        expect(res.id).toEqual('get-schedule');
        validateRequest({}, { scheduleId });

        const browserRes = await page.evaluate(options => client.schedules.getSchedule(options), { scheduleId });
        expect(browserRes).toEqual(res);
        validateRequest({}, { scheduleId });
    });

    test('getSchedule() 404', async () => {
        const scheduleId = '404';

        const res = await client.schedules.getSchedule({ scheduleId });
        expect(res).toEqual(null);
        validateRequest({}, { scheduleId });

        const browserRes = await page.evaluate(options => client.schedules.getSchedule(options), { scheduleId });
        expect(browserRes).toEqual(res);
        validateRequest({}, { scheduleId });
    });

    test('updateSchedule() works', async () => {
        const scheduleId = 'schedule_id';
        const schedule = {
            foo: 'bar',
            updated: 'value',
        };

        const res = await client.schedules.updateSchedule({ scheduleId, schedule });
        expect(res.id).toEqual('update-schedule');
        validateRequest({}, { scheduleId }, schedule);

        const browserRes = await page.evaluate(options => client.schedules.updateSchedule(options), { scheduleId, schedule });
        expect(browserRes).toEqual(res);
        validateRequest({}, { scheduleId }, schedule);
    });

    test('deleteSchedule() works', async () => {
        const scheduleId = '204';

        const res = await client.schedules.deleteSchedule({ scheduleId });
        expect(res).toEqual('');
        validateRequest({}, { scheduleId });

        const browserRes = await page.evaluate(options => client.schedules.deleteSchedule(options), { scheduleId });
        expect(browserRes).toEqual(res);
        validateRequest({}, { scheduleId });
    });

    test('getLog() works', async () => {
        const scheduleId = 'schedule_id';

        const res = await client.schedules.getLog({ scheduleId });
        expect(res.id).toEqual('get-log');
        validateRequest({}, { scheduleId });

        const browserRes = await page.evaluate(options => client.schedules.getLog(options), { scheduleId });
        expect(browserRes).toEqual(res);
        validateRequest({}, { scheduleId });
    });
});
