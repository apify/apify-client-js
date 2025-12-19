import { ApifyClient } from 'apify-client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest';

import { stringifyWebhooksToBase64 } from '../src/utils';
import { Browser, DEFAULT_OPTIONS,validateRequest } from './_helper';
import { mockServer } from './mock_server/server';
import { Page } from 'puppeteer';
import { AddressInfo } from 'net';
import { WEBHOOK_EVENT_TYPES } from '@apify/consts';

describe('Task methods', () => {
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

    describe('tasks()', () => {
        test('list() works', async () => {
            const opts = {
                limit: 5,
                offset: 3,
                desc: true,
            };

            const res = await client.tasks().list(opts);
            validateRequest({ query: opts, path: '/v2/actor-tasks/' });

            const browserRes = await page.evaluate((options) => client.tasks().list(options), opts);
            expect(browserRes).toEqual(res);
            validateRequest({ query: opts });
        });

        test('create() works', async () => {
            const task = { actId: 'some-act-id', name: 'my-task' };

            const res = await client.tasks().create(task);
            validateRequest({ query: {}, params: {}, body: task, path: '/v2/actor-tasks/' });

            const browserRes = await page.evaluate((t) => client.tasks().create(t), task);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: {}, body: task });
        });
    });

    describe('task(id)', () => {
        test('update() works', async () => {
            const taskId = 'some-user/some-id';
            const task = { input: { foo: 'bar' } };

            const res = await client.task(taskId).update(task);
            validateRequest({ query: {}, params: { taskId: 'some-user~some-id' }, body: task, path: '/v2/actor-tasks/some-user~some-id' });

            const browserRes = await page.evaluate((id, t) => client.task(id).update(t), taskId, task);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { taskId: 'some-user~some-id' }, body: task });
        });

        test('delete() works', async () => {
            const taskId = '204';

            const res = await client.task(taskId).delete();
            expect(res).toBeUndefined();
            validateRequest({ query: {}, params: { taskId } });

            const browserRes = await page.evaluate((id) => client.task(id).delete(), taskId);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { taskId } });
        });

        test('get() works', async () => {
            const taskId = 'some-id';

            const res = await client.task(taskId).get();
            validateRequest({ query: {}, params: { taskId }, path: '/v2/actor-tasks/some-id' });

            const browserRes = await page.evaluate((id) => client.task(id).get(), taskId);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { taskId } });
        });

        test('get() returns undefined on 404 status code (RECORD_NOT_FOUND)', async () => {
            const taskId = '404';

            const res = await client.task(taskId).get();
            expect(res).toBeUndefined();
            validateRequest({ query: {}, params: { taskId } });

            const browserRes = await page.evaluate((id) => client.task(id).get(), taskId);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { taskId } });
        });

        test('runs().list() works', async () => {
            const taskId = 'task-id';

            const query = {
                limit: 5,
                offset: 3,
                desc: true,
            };

            const res = await client.task(taskId).runs().list(query);
            validateRequest({ query: query, params: { taskId }, path: '/v2/actor-tasks/task-id/runs' });

            const browserRes = await page.evaluate((id, q) => client.task(id).runs().list(q), taskId, query);
            expect(browserRes).toEqual(res);
            validateRequest({ query: query, params: { taskId } });
        });

        test('start() works', async () => {
            const taskId = 'some-id';

            const res = await client.task(taskId).start();
            expect(res.id).toEqual('run-task');
            validateRequest({ query: {}, params: { taskId } });

            const browserRes = await page.evaluate((id) => client.task(id).start(), taskId);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { taskId } });
        });

        test('start() with query parameters works', async () => {
            const taskId = 'some-id';
            const query = {
                waitForFinish: 100,
                memory: 512,
            };

            const res = await client.task(taskId).start(undefined, query);
            expect(res.id).toEqual('run-task');
            validateRequest({ query: query, params: { taskId } });

            const browserRes = await page.evaluate((id, q) => client.task(id).start(undefined, q), taskId, query);
            expect(browserRes).toEqual(res);
            validateRequest({ query: query, params: { taskId } });
        });

        test('start() works with input and options overrides', async () => {
            const taskId = 'some-id';
            const input = { foo: 'bar' };

            const query = {
                waitForFinish: 100,
                memory: 512,
            };

            const res = await client.task(taskId).start(input, query);
            expect(res.id).toEqual('run-task');
            validateRequest({ query: query, params: { taskId }, body: input });

            const browserRes = await page.evaluate(
                (id, i, opts) => client.task(id).start(i, opts),
                taskId,
                input,
                query,
            );
            expect(browserRes).toEqual(res);
            validateRequest({ query: query, params: { taskId }, body: input });
        });

        test('start() works with functions in input', async () => {
            const taskId = 'some-id';
            const input = {
                foo: 'bar',
                fn: async (a: number, b: number) => a + b,
            };

            const expectedRequestProps = {
                query: {},
                params: { taskId },
                body: { foo: 'bar', fn: input.fn.toString() },
                headers: { 'content-type': 'application/json' },
            };

            const res = await client.task(taskId).start(input);
            expect(res.id).toEqual('run-task');
            validateRequest(expectedRequestProps);

            const browserRes = await page.evaluate((id) => {
                return client.task(id).start({
                    foo: 'bar',
                    fn: async (a: number, b: number) => a + b,
                });
            }, taskId);
            expect(browserRes).toEqual(res);
            validateRequest(expectedRequestProps);
        });

        test('start() works with webhooks', async () => {
            const taskId = 'some-id';
            const webhooks = [
                {
                    eventTypes: [WEBHOOK_EVENT_TYPES.ACTOR_RUN_CREATED],
                    requestUrl: 'https://example.com/run-created',
                },
                {
                    eventTypes: [WEBHOOK_EVENT_TYPES.ACTOR_RUN_SUCCEEDED],
                    requestUrl: 'https://example.com/run-succeeded',
                },
            ];

            const query = { webhooks: stringifyWebhooksToBase64(webhooks) };
            const res = await client.task(taskId).start(undefined, { webhooks });
            validateRequest({ query: query, params: { taskId }, path: '/v2/actor-tasks/some-id/runs' });

            const browserRes = await page.evaluate((id, opts) => client.task(id).start(undefined, opts), taskId, {
                webhooks,
            });
            expect(browserRes).toEqual(res);
            validateRequest({ query: query, params: { taskId } });
        });

        test('start() works with maxItems', async () => {
            const taskId = 'some-id';
            const res = await client.task(taskId).start(undefined, { maxItems: 100 });
            expect(res.id).toEqual('run-task');
            validateRequest({ query: { maxItems: 100 }, params: { taskId } });

            const browserRes = await page.evaluate((id, opts) => client.task(id).start(undefined, opts), taskId, {
                maxItems: 100,
            });
            expect(browserRes).toEqual(res);
            validateRequest({ query: { maxItems: 100 }, params: { taskId } });
        });

        test('call() works', async () => {
            const taskId = 'some-task-id';
            const input = { some: 'body' };
            const timeout = 120;
            const memory = 256;
            const build = '1.2.0';
            const actId = 'started-actor-id';
            const runId = 'started-run-id';
            const data = { id: runId, actId, status: 'SUCCEEDED' };
            const body = { data };
            const waitSecs = 1;

            const query = {
                timeout,
                memory,
                build,
            };

            mockServer.setResponse({ body });
            const res = await client.task(taskId).call(input, {
                memory,
                timeout,
                build,
                waitSecs,
            });
            expect(res).toEqual(data);

            expect(res).toEqual(data);
            validateRequest({ query: { waitForFinish: waitSecs }, params: { runId } });
            validateRequest({ query: query, params: { taskId }, body: { some: 'body' } });

            const callBrowserRes = await page.evaluate((id, i, opts) => client.task(id).call(i, opts), taskId, input, {
                memory,
                timeout,
                build,
                waitSecs,
            });
            expect(callBrowserRes).toEqual(res);
            validateRequest({ query: { waitForFinish: waitSecs }, params: { runId } });
            validateRequest({
                query: {
                    timeout,
                    memory,
                    build,
                },
                params: { taskId },
                body: { some: 'body' },
            });
        });

        test('call() works with maxItems', async () => {
            const taskId = 'some-task-id';
            const actId = 'started-actor-id';
            const runId = 'started-run-id';
            const data = { id: runId, actId, status: 'SUCCEEDED' };
            const body = { data };
            const waitSecs = 1;
            const maxItems = 100;

            const query = { maxItems };

            mockServer.setResponse({ body });
            const res = await client.task(taskId).call(undefined, {
                waitSecs,
                maxItems,
            });
            expect(res).toEqual(data);

            expect(res).toEqual(data);
            validateRequest({ query: { waitForFinish: waitSecs }, params: { runId } });
            validateRequest({ query: query, params: { taskId } });

            const callBrowserRes = await page.evaluate(
                (id, i, opts) => client.task(id).call(i, opts),
                taskId,
                undefined,
                {
                    waitSecs,
                    maxItems,
                },
            );
            expect(callBrowserRes).toEqual(res);
            validateRequest({ query: { waitForFinish: waitSecs }, params: { runId } });
            validateRequest({ query: { maxItems }, params: { taskId } });
        });

        test('webhooks().list() works', async () => {
            const taskId = 'some-task-id';
            const query = {
                limit: 5,
                offset: 3,
                desc: true,
            };

            const res = await client.task(taskId).webhooks().list(query);
            validateRequest({ query: query, params: { taskId }, path: '/v2/actor-tasks/some-task-id/webhooks' });

            const browserRes = await page.evaluate((id, opts) => client.task(id).webhooks().list(opts), taskId, query);
            expect(browserRes).toEqual(res);
            validateRequest({ query: query, params: { taskId } });
        });

        test('getInput() works', async () => {
            const taskId = 'some-task-id';

            const res = await client.task(taskId).getInput();
            validateRequest({ query: {}, params: { taskId }, path: '/v2/actor-tasks/some-task-id/input' });

            const browserRes = await page.evaluate((id) => client.task(id).getInput(), taskId);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { taskId } });
        });

        test('updateInput() works', async () => {
            const taskId = 'some-task-id';
            const input = { foo: 'bar' };

            const res = await client.task(taskId).updateInput(input);
            validateRequest({ query: {}, params: { taskId }, body: input, path: '/v2/actor-tasks/some-task-id/input' });

            const browserRes = await page.evaluate((id, i) => client.task(id).updateInput(i), taskId, input);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { taskId }, body: input });
        });
    });
});
