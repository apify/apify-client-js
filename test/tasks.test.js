const ApifyClient = require('../src');
const { stringifyWebhooksToBase64 } = require('../src/utils');
const mockServer = require('./mock_server/server');
const { Browser, validateRequest, DEFAULT_QUERY } = require('./_helper');

describe('Task methods', () => {
    let baseUrl;
    const browser = new Browser();

    beforeAll(async () => {
        const server = await mockServer.start();
        await browser.start();
        baseUrl = `http://localhost:${server.address().port}/v2`;
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
            const query = {
                waitForFinish: 100,
            };

            const res = await client.task(taskId).start(query);
            expect(res.id).toEqual('run-task');
            validateRequest(query, { taskId });

            const browserRes = await page.evaluate((id, q) => client.task(id).start(q), taskId, query);
            expect(browserRes).toEqual(res);
            validateRequest(query, { taskId });
        });

        test('start() works with input and options overrides', async () => {
            const taskId = 'some-id';
            const input = { foo: 'bar' };

            const query = {
                waitForFinish: 100,
                memory: 512,
            };

            const res = await client.task(taskId).start({ input, ...query });
            expect(res.id).toEqual('run-task');
            validateRequest(query, { taskId }, input);

            const browserRes = await page.evaluate((id, opts) => client.task(id).start(opts), taskId, { input, ...query });
            expect(browserRes).toEqual(res);
            validateRequest(query, { taskId }, input);
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
            const res = await client.task(taskId).start({ webhooks });
            expect(res.id).toEqual('run-task');
            validateRequest(query, { taskId });

            const browserRes = await page.evaluate((id, opts) => client.task(id).start(opts), taskId, { webhooks });
            expect(browserRes).toEqual(res);
            validateRequest(query, { taskId });
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