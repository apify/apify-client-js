import type { AddressInfo } from 'node:net';

import { ApifyClient } from 'apify-client';
import type { Page } from 'puppeteer';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest';

import { Browser, DEFAULT_OPTIONS, validateRequest } from './_helper';
import { mockServer } from './mock_server/server';

describe('Schedule methods', () => {
    let baseUrl: string;
    const browser = new Browser();

    beforeAll(async () => {
        const server = await mockServer.start();
        await browser.start();
        baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
    });

    afterAll(async () => {
        await Promise.all([mockServer.close(), browser.cleanUpBrowser()]);
    });

    let client: ApifyClient;
    let page: Page;
    beforeEach(async () => {
        page = await browser.getInjectedPage(baseUrl, DEFAULT_OPTIONS);
        client = new ApifyClient({
            baseUrl,
            maxRetries: 0,
            ...DEFAULT_OPTIONS,
        });
    });
    afterEach(async () => {
        client = null as unknown as ApifyClient;
        page.close().catch(() => {});
    });

    describe('schedules()', () => {
        test('create() works', async () => {
            const schedule = { name: 'my-schedule', cronExpression: '0 0 * * *' };

            const res = await client.schedules().create(schedule);
            validateRequest({ query: {}, params: {}, body: schedule, path: '/v2/schedules/' });

            const browserRes = await page.evaluate((options) => client.schedules().create(options), schedule);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: {}, body: schedule });
        });

        test('list() works', async () => {
            const opts = {
                limit: 5,
                offset: 3,
                desc: true,
            };

            const res = await client.schedules().list(opts);
            validateRequest({ query: opts, path: '/v2/schedules/' });

            const browserRes = await page.evaluate((options) => client.schedules().list(options), opts);
            expect(browserRes).toEqual(res);
            validateRequest({ query: opts });
        });
    });

    describe('schedule(id)', () => {
        test('get() works', async () => {
            const scheduleId = 'schedule_id';

            const res = await client.schedule(scheduleId).get();
            validateRequest({
                query: {},
                params: { scheduleId },
                path: `/v2/schedules/${encodeURIComponent(scheduleId)}`,
            });

            const browserRes = await page.evaluate((id) => client.schedule(id).get(), scheduleId);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { scheduleId } });
        });

        test('get() 404', async () => {
            const scheduleId = '404';

            const res = await client.schedule(scheduleId).get();
            expect(res).toBeUndefined();
            validateRequest({ query: {}, params: { scheduleId } });

            const browserRes = await page.evaluate((id) => client.schedule(id).get(), scheduleId);
            expect(browserRes).toBeUndefined();
            validateRequest({ query: {}, params: { scheduleId } });
        });

        test('update() works', async () => {
            const scheduleId = 'schedule_id';
            const schedule = { title: 'my new schedule', cronExpression: '0 0 * * *' };

            const res = await client.schedule(scheduleId).update(schedule);
            validateRequest({
                query: {},
                params: { scheduleId },
                body: schedule,
                path: `/v2/schedules/${encodeURIComponent(scheduleId)}`,
            });

            const browserRes = await page.evaluate((id, s) => client.schedule(id).update(s), scheduleId, schedule);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { scheduleId }, body: schedule });
        });

        test('delete() works', async () => {
            const scheduleId = '204';

            const res = await client.schedule(scheduleId).delete();
            expect(res).toBeUndefined();
            validateRequest({ query: {}, params: { scheduleId } });

            const browserRes = await page.evaluate((id) => client.schedule(id).delete(), scheduleId);
            expect(browserRes).toBeUndefined();
            validateRequest({ query: {}, params: { scheduleId } });
        });
        test('getLog() works', async () => {
            const scheduleId = 'schedule_id';

            const res = await client.schedule(scheduleId).getLog();
            validateRequest({
                query: {},
                params: { scheduleId },
                path: `/v2/schedules/${encodeURIComponent(scheduleId)}/log`,
            });

            const browserRes = await page.evaluate((id) => client.schedule(id).getLog(), scheduleId);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { scheduleId } });
        });
    });
});
