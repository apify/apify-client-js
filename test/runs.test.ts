import type { AddressInfo } from 'node:net';
import { setTimeout as setTimeoutNode } from 'node:timers/promises';

import c from 'ansi-colors';
import { ApifyClient } from 'apify-client';
import type { Page } from 'puppeteer';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

import { Browser, DEFAULT_OPTIONS, validateRequest } from './_helper';
import { mockServer } from './mock_server/server';
import { MOCKED_ACTOR_LOGS_PROCESSED } from './mock_server/test_utils';

describe('Run methods', () => {
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

    describe('runs()', () => {
        test('list() works single status', async () => {
            const query = {
                limit: 5,
                offset: 3,
                desc: true,
                status: 'SUCCEEDED',
            } as const;

            const res = await client.runs().list(query);
            validateRequest({ query, path: '/v2/actor-runs/' });

            const browserRes = await page.evaluate((opts) => client.runs().list(opts), query);
            expect(browserRes).toEqual(res);
            validateRequest({ query });
        });

        test('list() works multiple statuses', async () => {
            const query = {
                limit: 5,
                offset: 3,
                desc: true,
                status: ['SUCCEEDED' as const, 'FAILED' as const],
            };

            const expectedQuery = {
                ...query,
                status: 'SUCCEEDED,FAILED', // This is what should be sent to the API
            };

            const res = await client.runs().list(query);
            validateRequest({ query: expectedQuery, path: '/v2/actor-runs/' });

            const browserRes = await page.evaluate((opts) => client.runs().list(opts), query);
            expect(browserRes).toEqual(res);
            validateRequest({ query: expectedQuery, path: '/v2/actor-runs/' });
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
            validateRequest({ query: expectedQuery, path: '/v2/actor-runs/' });

            const browserRes = await page.evaluate((opts) => client.runs().list(opts), query);
            expect(browserRes).toEqual(res);
            validateRequest({ query: expectedQuery });
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
            validateRequest({ query: expectedQuery, path: '/v2/actor-runs/' });

            const browserRes = await page.evaluate((opts) => client.runs().list(opts), query);
            expect(browserRes).toEqual(res);
            validateRequest({ query: expectedQuery, path: '/v2/actor-runs/' });
        });
    });

    describe('run()', () => {
        test('get() works', async () => {
            const runId = 'some-run-id';

            const res = await client.run(runId).get();
            expect(res?.id).toEqual('get-run');
            validateRequest({ query: {}, params: { runId } });

            const browserRes = await page.evaluate((rId) => client.run(rId).get(), runId);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { runId } });
        });

        test('get() returns undefined on 404 status code (RECORD_NOT_FOUND)', async () => {
            const runId = '404';

            const res = await client.run(runId).get();
            expect(res).toBeUndefined();
            validateRequest({ query: {}, params: { runId } });

            const browserRes = await page.evaluate((rId) => client.run(rId).get(), runId);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { runId } });
        });

        test('abort() works', async () => {
            const runId = 'some-run-id';

            const res = await client.run(runId).abort();
            expect(res.id).toEqual('abort-run');
            validateRequest({ query: {}, params: { runId } });

            const browserRes = await page.evaluate((rId) => client.run(rId).abort(), runId);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { runId } });
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
            validateRequest({ query: options, params: { runId } });

            const browserRes = await page.evaluate((rId, opts) => client.run(rId).resurrect(opts), runId, options);
            expect(browserRes).toEqual(res);
            validateRequest({ query: options, params: { runId } });
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
            validateRequest({
                path: `/v2/actor-runs/${runId}/metamorph`,
                query: actualQuery,
                params: { runId },
                body: { some: 'body' },
                additionalHeaders: { 'content-type': contentType },
            });

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
            validateRequest({
                query: actualQuery,
                params: { runId },
                body: { some: 'body' },
                additionalHeaders: { 'content-type': contentType },
            });
        });

        test('metamorph() works with pre-stringified JSON input', async () => {
            const runId = 'some-run-id';
            const targetActorId = 'some-target-id';
            const contentType = 'application/json; charset=utf-8';
            const input = JSON.stringify({ foo: 'bar' });

            const expectedRequest = {
                query: { targetActorId },
                params: { runId },
                body: { foo: 'bar' },
                additionalHeaders: { 'content-type': contentType },
            };

            const res = await client.run(runId).metamorph(targetActorId, input, { contentType });
            expect(res.id).toEqual('metamorph-run');
            validateRequest(expectedRequest);

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
            validateRequest(expectedRequest);
        });

        test('metamorph() works with functions in input', async () => {
            const runId = 'some-run-id';
            const targetActorId = 'some-target-id';
            const input = {
                foo: 'bar',
                fn: async (a: number, b: number) => a + b,
            };

            const expectedRequest = {
                query: { targetActorId },
                params: { runId },
                body: { foo: 'bar', fn: input.fn.toString() },
                additionalHeaders: { 'content-type': 'application/json' },
            };

            const res = await client.run(runId).metamorph(targetActorId, input);
            expect(res.id).toEqual('metamorph-run');
            validateRequest(expectedRequest);

            const browserRes = await page.evaluate(
                (rId, tId) => {
                    return client.run(rId).metamorph(tId, {
                        foo: 'bar',
                        fn: async (a: number, b: number) => a + b,
                    });
                },
                runId,
                targetActorId,
            );
            expect(browserRes).toEqual(res);
            validateRequest(expectedRequest);
        });

        test('reboot() works', async () => {
            const runId = 'some-run-id';

            const res = await client.run(runId).reboot();
            expect(res.id).toEqual('reboot-run');
            validateRequest({ query: {}, params: { runId } });

            const browserRes = await page.evaluate((rId) => client.run(rId).reboot(), runId);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { runId } });
        });

        test('waitForFinish() works', async () => {
            const runId = 'some-run-id';
            const waitSecs = 0.1;
            const data = { status: 'SUCCEEDED' };
            const body = { data };

            setTimeout(() => mockServer.setResponse({ body }), (waitSecs * 1000) / 2);
            const res = await client.run(runId).waitForFinish({ waitSecs });
            expect(res).toEqual(data);
            validateRequest({ query: { waitForFinish: 0 }, params: { runId } });

            const browserRes = await page.evaluate(
                (rId, ws) => client.run(rId).waitForFinish({ waitSecs: ws }),
                runId,
                waitSecs,
            );
            expect(browserRes).toEqual(res);
            validateRequest({ query: { waitForFinish: 0 }, params: { runId } });
        });

        test('waitForFinish() resolves immediately with waitSecs: 0', async () => {
            const runId = 'some-run-id';
            const waitSecs = 0;
            const data = { status: 'SUCCEEDED' };
            const body = { data };

            setTimeout(() => mockServer.setResponse({ body }), 10);
            const res = await client.run(runId).waitForFinish({ waitSecs });
            expect(res).toEqual(data);
            validateRequest({ query: { waitForFinish: 0 }, params: { runId } });

            const browserRes = await page.evaluate(
                (rId, ws) => client.run(rId).waitForFinish({ waitSecs: ws }),
                runId,
                waitSecs,
            );
            expect(browserRes).toEqual(res);
            validateRequest({ query: { waitForFinish: 0 }, params: { runId } });
        });

        test('dataset().get() works', async () => {
            const runId = 'some-run-id';

            const res = await client.run(runId).dataset().get();
            expect(res?.id).toEqual('run-dataset');

            validateRequest({ query: {}, params: { runId } });

            const browserRes = await page.evaluate((rId) => client.run(rId).dataset().get(), runId);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { runId } });
        });

        test('keyValueStore().get() works', async () => {
            const runId = 'some-run-id';

            const res = await client.run(runId).keyValueStore().get();
            expect(res?.id).toEqual('run-keyValueStore');

            validateRequest({ query: {}, params: { runId } });

            const browserRes = await page.evaluate((rId) => client.run(rId).keyValueStore().get(), runId);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { runId } });
        });

        test('requestQueue().get() works', async () => {
            const runId = 'some-run-id';

            const res = await client.run(runId).requestQueue().get();
            expect(res?.id).toEqual('run-requestQueue');

            validateRequest({ query: {}, params: { runId } });

            const browserRes = await page.evaluate((rId) => client.run(rId).requestQueue().get(), runId);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { runId } });
        });

        test('log().get() works', async () => {
            const runId = 'some-run-id';

            const res = await client.run(runId).log().get();
            expect(res).toEqual('run-log');

            validateRequest({ query: {}, params: { runId } });

            const browserRes = await page.evaluate((rId) => client.run(rId).log().get(), runId);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { runId } });
        });

        test('charge() works', async () => {
            const runId = 'some-run-id';

            const res = await client.run(runId).charge({ eventName: 'some-event' });
            expect(res.status).toEqual(200);

            await expect(client.run(runId).charge(undefined as any)).rejects.toThrow(
                'Expected argument to be of type `object` but received type `undefined`\n' +
                    'Cannot convert undefined or null to object in object',
            );
        });
    });
});

describe('Redirect run logs', () => {
    let baseUrl: string;

    beforeAll(async () => {
        // Ensure that the tests that use characters like á are correctly decoded in console.
        process.stdout.setDefaultEncoding('utf8');
        const server = await mockServer.start();
        baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
    });

    afterAll(async () => {
        await Promise.all([mockServer.close()]);
    });

    let client: ApifyClient;
    beforeEach(async () => {
        client = new ApifyClient({
            baseUrl,
            maxRetries: 0,
            ...DEFAULT_OPTIONS,
        });
    });
    afterEach(async () => {
        client = null as unknown as ApifyClient;
    });

    const testCases = [
        { fromStart: true, expected: MOCKED_ACTOR_LOGS_PROCESSED },
        { fromStart: false, expected: MOCKED_ACTOR_LOGS_PROCESSED.slice(1) },
    ];

    describe('run.getStreamedLog', () => {
        test.each(testCases)('getStreamedLog fromStart:$fromStart', async ({ fromStart, expected }) => {
            const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            // Set fake time in constructor to skip the first redirected log entry// fromStart=True should redirect all logs
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2025-05-13T07:24:12.686Z'));
            const streamedLog = await client.run('redirect-run-id').getStreamedLog({ fromStart });
            vi.useRealTimers();

            streamedLog?.start();
            // Wait some time to accumulate logs
            await setTimeoutNode(1000);
            await streamedLog?.stop();

            const loggerPrefix = c.cyan('redirect-actor-name runId:redirect-run-id -> ');
            expect(logSpy.mock.calls).toEqual(expected.map((item) => [loggerPrefix + item]));
            logSpy.mockRestore();
        });
    });
});
