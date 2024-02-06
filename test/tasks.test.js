const { Browser, validateRequest, DEFAULT_OPTIONS } = require('./_helper');
const mockServer = require('./mock_server/server');
const { ApifyClient } = require('../src');
const { stringifyWebhooksToBase64 } = require('../src/utils');

describe('Task methods', () => {
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

    describe('tasks()', () => {
        test('list() works', async () => {
            const opts = {
                limit: 5,
                offset: 3,
                desc: true,
            };

            const res = await client.tasks().list(opts);
            expect(res.id).toEqual('list-tasks');
            validateRequest(opts);

            const browserRes = await page.evaluate((options) => client.tasks().list(options), opts);
            expect(browserRes).toEqual(res);
            validateRequest(opts);
        });

        test('create() works', async () => {
            const task = { foo: 'bar' };

            const res = await client.tasks().create(task);
            expect(res.id).toEqual('create-task');
            validateRequest({}, {}, task);

            const browserRes = await page.evaluate((t) => client.tasks().create(t), task);
            expect(browserRes).toEqual(res);
            validateRequest({}, {}, task);
        });
    });

    describe('task(id)', () => {
        test('update() works', async () => {
            const taskId = 'some-user/some-id';
            const task = { foo: 'bar' };

            const res = await client.task(taskId).update(task);
            expect(res.id).toEqual('update-task');
            validateRequest({}, { taskId: 'some-user~some-id' }, task);

            const browserRes = await page.evaluate((id, t) => client.task(id).update(t), taskId, task);
            expect(browserRes).toEqual(res);
            validateRequest({}, { taskId: 'some-user~some-id' }, { foo: 'bar' });
        });

        test('delete() works', async () => {
            const taskId = '204';

            const res = await client.task(taskId).delete();
            expect(res).toBeUndefined();
            validateRequest({}, { taskId });

            const browserRes = await page.evaluate((id) => client.task(id).delete(), taskId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { taskId });
        });

        test('get() works', async () => {
            const taskId = 'some-id';

            const res = await client.task(taskId).get();
            expect(res.id).toEqual('get-task');
            validateRequest({}, { taskId });

            const browserRes = await page.evaluate((id) => client.task(id).get(), taskId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { taskId });
        });

        test('get() returns undefined on 404 status code (RECORD_NOT_FOUND)', async () => {
            const taskId = '404';

            const res = await client.task(taskId).get();
            expect(res).toBeUndefined();
            validateRequest({}, { taskId });

            const browserRes = await page.evaluate((id) => client.task(id).get(), taskId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { taskId });
        });

        test('runs().list() works', async () => {
            const taskId = 'task-id';

            const query = {
                limit: 5,
                offset: 3,
                desc: true,
            };

            const res = await client.task(taskId).runs().list(query);
            expect(res.id).toEqual('list-runs');
            validateRequest(query, { taskId });

            const browserRes = await page.evaluate((id, q) => client.task(id).runs().list(q), taskId, query);
            expect(browserRes).toEqual(res);
            validateRequest(query, { taskId });
        });

        test('start() works', async () => {
            const taskId = 'some-id';

            const res = await client.task(taskId).start();
            expect(res.id).toEqual('run-task');
            validateRequest({}, { taskId });

            const browserRes = await page.evaluate((id) => client.task(id).start(), taskId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { taskId });
        });

        test('start() with query parameters works', async () => {
            const taskId = 'some-id';
            const query = {
                waitForFinish: 100,
                memory: 512,
            };

            const res = await client.task(taskId).start(undefined, query);
            expect(res.id).toEqual('run-task');
            validateRequest(query, { taskId });

            const browserRes = await page.evaluate((id, q) => client.task(id).start(undefined, q), taskId, query);
            expect(browserRes).toEqual(res);
            validateRequest(query, { taskId });
        });

        test.skip('start() works with pre-stringified JSON', async () => {
            const taskId = 'some-id2';
            const input = { foo: 'bar' };
            const body = JSON.stringify(input);

            const query = {
                waitForFinish: 100,
                memory: 512,
            };

            const res = await client.task(taskId).start(body, query);
            expect(res.id).toEqual('run-task');
            validateRequest(query, { taskId }, input);

            const browserRes = await page.evaluate((id, i, opts) => client.task(id).start(i, opts), taskId, input, query);
            expect(browserRes).toEqual(res);
            validateRequest(query, { taskId }, input);
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
            validateRequest(query, { taskId }, input);

            const browserRes = await page.evaluate((id, i, opts) => client.task(id).start(i, opts), taskId, input, query);
            expect(browserRes).toEqual(res);
            validateRequest(query, { taskId }, input);
        });

        test('start() works with functions in input', async () => {
            const taskId = 'some-id';
            const input = {
                foo: 'bar',
                fn: async (a, b) => a + b,
            };

            const expectedRequestProps = [
                {},
                { taskId },
                { foo: 'bar', fn: input.fn.toString() },
                { 'content-type': 'application/json' },
            ];

            const res = await client.task(taskId).start(input);
            expect(res.id).toEqual('run-task');
            validateRequest(...expectedRequestProps);

            const browserRes = await page.evaluate((id) => {
                return client.task(id).start({
                    foo: 'bar',
                    fn: async (a, b) => a + b,
                });
            }, taskId);
            expect(browserRes).toEqual(res);
            validateRequest(...expectedRequestProps);
        });

        test('start() works with webhooks', async () => {
            const taskId = 'some-id';
            const webhooks = [
                {
                    eventTypes: ['ACTOR.RUN.CREATED'],
                    requestUrl: 'https://example.com/run-created',
                },
                {
                    eventTypes: ['ACTOR.RUN.SUCCEEDED'],
                    requestUrl: 'https://example.com/run-succeeded',
                },
            ];

            const query = { webhooks: stringifyWebhooksToBase64(webhooks) };
            const res = await client.task(taskId).start(undefined, { webhooks });
            expect(res.id).toEqual('run-task');
            validateRequest(query, { taskId });

            const browserRes = await page.evaluate((id, opts) => client.task(id).start(undefined, opts), taskId, { webhooks });
            expect(browserRes).toEqual(res);
            validateRequest(query, { taskId });
        });

        test('start() works with maxItems', async () => {
            const taskId = 'some-id';
            const res = await client.task(taskId).start(undefined, { maxItems: 100 });
            expect(res.id).toEqual('run-task');
            validateRequest({ maxItems: 100 }, { taskId });

            const browserRes = await page.evaluate((id, opts) => client.task(id).start(undefined, opts), taskId, { maxItems: 100 });
            expect(browserRes).toEqual(res);
            validateRequest({ maxItems: 100 }, { taskId });
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
            validateRequest({ waitForFinish: waitSecs }, { runId });
            validateRequest(query, { taskId }, { some: 'body' });

            const callBrowserRes = await page.evaluate(
                (id, i, opts) => client.task(id).call(i, opts), taskId, input, {
                    memory,
                    timeout,
                    build,
                    waitSecs,
                },
            );
            expect(callBrowserRes).toEqual(res);
            validateRequest({ waitForFinish: waitSecs }, { runId });
            validateRequest({
                timeout,
                memory,
                build,
            }, { taskId }, { some: 'body' });
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
            validateRequest({ waitForFinish: waitSecs }, { runId });
            validateRequest(query, { taskId });

            const callBrowserRes = await page.evaluate(
                (id, i, opts) => client.task(id).call(i, opts), taskId, undefined, {
                    waitSecs,
                    maxItems,
                },
            );
            expect(callBrowserRes).toEqual(res);
            validateRequest({ waitForFinish: waitSecs }, { runId });
            validateRequest({ maxItems }, { taskId });
        });

        test('webhooks().list() works', async () => {
            const taskId = 'some-task-id';
            const query = {
                limit: 5,
                offset: 3,
                desc: true,
            };

            const res = await client.task(taskId).webhooks().list(query);
            expect(res.id).toEqual('list-webhooks');
            validateRequest(query, { taskId });

            const browserRes = await page.evaluate((id, opts) => client.task(id).webhooks().list(opts), taskId, query);
            expect(browserRes).toEqual(res);
            validateRequest(query, { taskId });
        });

        test('getInput() works', async () => {
            const taskId = 'some-task-id';

            const res = await client.task(taskId).getInput();
            expect(res.data.id).toEqual('get-input');
            validateRequest({}, { taskId });

            const browserRes = await page.evaluate((id) => client.task(id).getInput(), taskId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { taskId });
        });

        test('updateInput() works', async () => {
            const taskId = 'some-task-id';
            const input = { foo: 'bar' };

            const res = await client.task(taskId).updateInput(input);
            expect(res.data.id).toEqual('update-input');
            validateRequest({}, { taskId }, input);

            const browserRes = await page.evaluate((id, i) => client.task(id).updateInput(i), taskId, input);
            expect(browserRes).toEqual(res);
            validateRequest({}, { taskId }, input);
        });
    });
});
