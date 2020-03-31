import ApifyClient from '../build';
import { stringifyWebhooksToBase64 } from '../build/utils';

import mockServer from './mock_server/server';
import { cleanUpBrowser, getInjectedPage, validateRequest, DEFAULT_QUERY } from './_helper';

describe('Task methods', () => {
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

    test('listTasks() works', async () => {
        const opts = {
            limit: 5,
            offset: 3,
            desc: true,
        };

        const res = await client.tasks.listTasks(opts);
        expect(res.id).toEqual('list-tasks');
        validateRequest(opts);

        const browserRes = await page.evaluate(options => client.tasks.listTasks(options), opts);
        expect(browserRes).toEqual(res);
        validateRequest(opts);
    });

    test('listTasks() works without pagination', async () => {
        const opts = {};

        const res = await client.tasks.listTasks(opts);
        expect(res.id).toEqual('list-tasks');
        validateRequest(opts);

        const browserRes = await page.evaluate(options => client.tasks.listTasks(options), opts);
        expect(browserRes).toEqual(res);
        validateRequest(opts);
    });

    test('createTask() works', async () => {
        const task = { foo: 'bar' };

        const res = await client.tasks.createTask({ task });
        expect(res.id).toEqual('create-task');
        validateRequest({}, {}, task);

        const browserRes = await page.evaluate(options => client.tasks.createTask(options), { task });
        expect(browserRes).toEqual(res);
        validateRequest({}, {}, task);
    });

    test(
        'updateTask() works with both taskId parameter and taskId in task object',
        async () => {
            const taskId = 'some-user/some-id';
            const task = { id: taskId, foo: 'bar' };

            const res = await client.tasks.updateTask({ taskId, task });
            expect(res.id).toEqual('update-task');
            validateRequest({}, { taskId: 'some-user~some-id' }, { foo: 'bar' });

            const browserRes = await page.evaluate(options => client.tasks.updateTask(options), { taskId, task });
            expect(browserRes).toEqual(res);
            validateRequest({}, { taskId: 'some-user~some-id' }, { foo: 'bar' });
        },
    );

    test('updateTask() works with taskId in task object', async () => {
        const taskId = 'some-user/some-id';
        const task = { id: taskId, foo: 'bar' };

        const res = await client.tasks.updateTask({ task });
        expect(res.id).toEqual('update-task');
        validateRequest({}, { taskId: 'some-user~some-id' }, { foo: 'bar' });

        const browserRes = await page.evaluate(options => client.tasks.updateTask(options), { taskId, task });
        expect(browserRes).toEqual(res);
        validateRequest({}, { taskId: 'some-user~some-id' }, { foo: 'bar' });
    });

    test('updateTask() works with taskId parameter', async () => {
        const taskId = 'some-user/some-id';
        const task = { foo: 'bar' };

        const res = await client.tasks.updateTask({ taskId, task });
        expect(res.id).toEqual('update-task');
        validateRequest({}, { taskId: 'some-user~some-id' }, { foo: 'bar' });

        const browserRes = await page.evaluate(options => client.tasks.updateTask(options), { taskId, task });
        expect(browserRes).toEqual(res);
        validateRequest({}, { taskId: 'some-user~some-id' }, { foo: 'bar' });
    });

    xit('updateTask() works with taskId as part task.id parameter', () => {
        // TODO: I think that this is duplicate of:  "updateTask() works with taskId in task object"
    });

    test('deleteTask() works', async () => {
        const taskId = '204';

        const res = await client.tasks.deleteTask({ taskId });
        expect(res).toEqual('');
        validateRequest({}, { taskId });

        const browserRes = await page.evaluate(options => client.tasks.deleteTask(options), { taskId });
        expect(browserRes).toEqual(res);
        validateRequest({}, { taskId });
    });

    test('getTask() works', async () => {
        const taskId = 'some-id';

        const res = await client.tasks.getTask({ taskId });
        expect(res.id).toEqual('get-task');
        validateRequest({}, { taskId });

        const browserRes = await page.evaluate(options => client.tasks.getTask(options), { taskId });
        expect(browserRes).toEqual(res);
        validateRequest({}, { taskId });
    });

    /*
    NOTE: not allowed currently.

    it('getTask() works without token', () => {
        const taskId = 'some-id';
        const task = { id: taskId, foo: 'bar' };

        requestExpectCall({
            json: true,
            method: 'GET',
            url: `${BASE_URL}${BASE_PATH}/${taskId}`,
            qs: {},
        }, {
            data: task,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .tasks
            .getTask({ taskId })
            .then(response => expect(response).to.be.eql(task));
    });
    */

    test(
        'getTask() returns null on 404 status code (RECORD_NOT_FOUND)',
        async () => {
            const taskId = '404';

            const res = await client.tasks.getTask({ taskId });
            expect(res).toEqual(null);
            validateRequest({}, { taskId });

            const browserRes = await page.evaluate(options => client.tasks.getTask(options), { taskId });
            expect(browserRes).toEqual(res);
            validateRequest({}, { taskId });
        },
    );

    test('listRuns() works', async () => {
        const taskId = 'task-id';

        const query = {
            limit: 5,
            offset: 3,
            desc: true,
        };

        const res = await client.tasks.listRuns({ taskId, ...query });
        expect(res.id).toEqual('list-runs');
        validateRequest(query, { taskId });

        const browserRes = await page.evaluate(options => client.tasks.listRuns(options), { taskId, ...query });
        expect(browserRes).toEqual(res);
        validateRequest(query, { taskId });
    });

    test('listRuns() works without pagination params', async () => {
        const taskId = 'task-id';

        const query = {};
        const res = await client.tasks.listRuns({ taskId, ...query });
        expect(res.id).toEqual('list-runs');
        validateRequest(query, { taskId });

        const browserRes = await page.evaluate(options => client.tasks.listRuns(options), { taskId, ...query });
        expect(browserRes).toEqual(res);
        validateRequest(query, { taskId });
    });

    test('runTask() works', async () => {
        const taskId = 'some-id';
        const query = {
            waitForFinish: 100,
        };

        const res = await client.tasks.runTask({ taskId, ...query });
        expect(res.id).toEqual('run-task');
        validateRequest(query, { taskId });

        const browserRes = await page.evaluate(options => client.tasks.runTask(options), { taskId, ...query });
        expect(browserRes).toEqual(res);
        validateRequest(query, { taskId });
    });

    test('runTask() works with input and options overrides', async () => {
        const taskId = 'some-id';
        const input = { foo: 'bar' };

        const query = {
            waitForFinish: 100,
            memory: 512,
        };

        const res = await client.tasks.runTask({ taskId, input, ...query });
        expect(res.id).toEqual('run-task');
        validateRequest(query, { taskId }, input);

        const browserRes = await page.evaluate(options => client.tasks.runTask(options), { taskId, input, ...query });
        expect(browserRes).toEqual(res);
        validateRequest(query, { taskId }, input);
    });

    test('runTask() works with webhooks', async () => {
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
        const res = await client.tasks.runTask({ taskId, webhooks });
        expect(res.id).toEqual('run-task');
        validateRequest(query, { taskId });

        // const browserRes = await page.evaluate(options => client.tasks.runTask(options), { taskId, input, ...query });
        //  expect(browserRes).to.eql(res);
        // validateRequest(query, { taskId }, input);
    });

    /*
    NOTE: not allowed currently.

    it('runTask() works without token', () => {
        const taskId = 'some-id';
        const run = { foo: 'bar' };
        const apiResponse = JSON.stringify({ data: run });

        requestExpectCall({
            method: 'POST',
            url: `${BASE_URL}${BASE_PATH}/${taskId}/runs`,
            qs: {},
        }, apiResponse);

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .tasks
            .runTask({ taskId })
            .then(response => expect(response).to.be.eql(run));
    });
    */

    test('listWebhooks() works', async () => {
        const taskId = 'some-task-id';
        const query = {
            limit: 5,
            offset: 3,
            desc: true,
        };


        const res = await client.tasks.listWebhooks({ taskId, ...query });
        expect(res.id).toEqual('list-webhooks');
        validateRequest(query, { taskId });

        const browserRes = await page.evaluate(options => client.tasks.listWebhooks(options), { taskId, ...query });
        expect(browserRes).toEqual(res);
        validateRequest(query, { taskId });
    });

    test('getInput() works', async () => {
        const taskId = 'some-task-id';
        const query = {};

        const res = await client.tasks.getInput({ taskId, ...query });
        expect(res.data.id).toEqual('get-input');
        validateRequest(query, { taskId });

        const browserRes = await page.evaluate(options => client.tasks.getInput(options), { taskId, ...query });
        expect(browserRes).toEqual(res);
        validateRequest(query, { taskId });
    });

    test('updateInput() works', async () => {
        const taskId = 'some-task-id';
        const input = { foo: 'bar' };

        const query = {};

        const res = await client.tasks.updateInput({ taskId, input, ...query });
        expect(res.data.id).toEqual('update-input');
        validateRequest(query, { taskId }, input);

        const browserRes = await page.evaluate(options => client.tasks.updateInput(options), { taskId, input, ...query });
        expect(browserRes).toEqual(res);
        validateRequest(query, { taskId }, input);
    });
});
