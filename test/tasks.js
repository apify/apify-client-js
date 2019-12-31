import { expect } from 'chai';
import ApifyClient from '../build';
import { stringifyWebhooksToBase64 } from '../build/utils';

import mockServer from './mock_server/server';

const DEFAULT_QUERY = {
    token: 'default-token',
};

function validateRequest(query = {}, params = {}, body = {}, headers = {}) {
    const request = mockServer.getLastRequest();
    const expectedQuery = getExpectedQuery(query);
    expect(request.query).to.be.eql(expectedQuery);
    expect(request.params).to.be.eql(params);
    expect(request.body).to.be.eql(body);
    expect(request.headers).to.include(headers);
}

function getExpectedQuery(callQuery = {}) {
    const query = optsToQuery(callQuery);
    return {
        ...DEFAULT_QUERY,
        ...query,
    };
}

function optsToQuery(params) {
    return Object
        .entries(params)
        .filter(([k, v]) => v !== false) // eslint-disable-line no-unused-vars
        .map(([k, v]) => {
            if (v === true) v = '1';
            else if (typeof v === 'number') v = v.toString();
            return [k, v];
        })
        .reduce((newObj, [k, v]) => {
            newObj[k] = v;
            return newObj;
        }, {});
}

describe('Task methods', () => {
    let baseUrl = null;
    before(async () => {
        const server = await mockServer.start(3333);
        baseUrl = `http://localhost:${server.address().port}`;
    });
    after(() => mockServer.close());

    let client = null;
    beforeEach(() => {
        client = new ApifyClient({
            baseUrl,
            expBackoffMaxRepeats: 0,
            expBackoffMillis: 1,
            ...DEFAULT_QUERY,
        });
    });
    afterEach(() => {
        client = null;
    });

    it('listTasks() works', async () => {
        const opts = {
            limit: 5,
            offset: 3,
            desc: true,
        };

        const res = await client.tasks.listTasks(opts);
        expect(res.id).to.be.eql('list-tasks');
        validateRequest(opts);
    });

    it('listTasks() works without pagination', async () => {
        const opts = {};

        const res = await client.tasks.listTasks(opts);
        expect(res.id).to.be.eql('list-tasks');
        validateRequest(opts);
    });

    it('createTask() works', async () => {
        const task = { foo: 'bar' };

        const res = await client.tasks.createTask({ task });
        expect(res.id).to.be.eql('create-task');
        validateRequest({}, {}, task);
    });

    it('updateTask() works with both taskId parameter and taskId in task object', async () => {
        const taskId = 'some-user/some-id';
        const task = { id: taskId, foo: 'bar' };

        const res = await client.tasks.updateTask({ taskId, task });
        expect(res.id).to.be.eql('update-task');
        validateRequest({}, { taskId: 'some-user~some-id' }, { foo: 'bar' });
    });

    it('updateTask() works with taskId in task object', async () => {
        const taskId = 'some-user/some-id';
        const task = { id: taskId, foo: 'bar' };

        const res = await client.tasks.updateTask({ task });
        expect(res.id).to.be.eql('update-task');
        validateRequest({}, { taskId: 'some-user~some-id' }, { foo: 'bar' });
    });

    it('updateTask() works with taskId parameter', async () => {
        const taskId = 'some-user/some-id';
        const task = { foo: 'bar' };

        const res = await client.tasks.updateTask({ taskId, task });
        expect(res.id).to.be.eql('update-task');
        validateRequest({}, { taskId: 'some-user~some-id' }, { foo: 'bar' });
    });

    xit('updateTask() works with taskId as part task.id parameter', () => {
        // TODO: I think that this is duplicate of:  "updateTask() works with taskId in task object"
        const task = { id: 'some-id', foo: 'bar' };
        const token = 'some-token';

        requestExpectCall({
            json: true,
            method: 'PUT',
            url: `${BASE_URL}${BASE_PATH}/${task.id}`,
            qs: { token },
            body: { foo: 'bar' },
        }, {
            data: task,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .tasks
            .updateTask({ task, token })
            .then(response => expect(response).to.be.eql(task));
    });

    it('deleteTask() works', async () => {
        const taskId = '204';

        const res = await client.tasks.deleteTask({ taskId });
        expect(res).to.be.eql('');
        validateRequest({}, { taskId });
    });

    it('getTask() works', async () => {
        const taskId = 'some-id';

        const res = await client.tasks.getTask({ taskId });
        expect(res.id).to.be.eql('get-task');
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

    it('getTask() returns null on 404 status code (RECORD_NOT_FOUND)', async () => {
        const taskId = '404';

        const res = await client.tasks.getTask({ taskId });
        expect(res).to.be.eql(null);
        validateRequest({}, { taskId });
    });

    it('listRuns() works', async () => {
        const taskId = 'task-id';

        const query = {
            limit: 5,
            offset: 3,
            desc: true,
        };

        const res = await client.tasks.listRuns({ taskId, ...query });
        expect(res.id).to.be.eql('list-runs');
        validateRequest(query, { taskId });
    });

    it('listRuns() works without pagination params', async () => {
        const taskId = 'task-id';

        const query = {};
        const res = await client.tasks.listRuns({ taskId, ...query });
        expect(res.id).to.be.eql('list-runs');
        validateRequest(query, { taskId });
    });

    it('runTask() works', async () => {
        const taskId = 'some-id';
        const query = {
            waitForFinish: 100,
        };

        const res = await client.tasks.runTask({ taskId, ...query });
        expect(res.id).to.be.eql('run-task');
        validateRequest(query, { taskId });
    });

    it('runTask() works with input and options overrides', async () => {
        const taskId = 'some-id';
        const input = { foo: 'bar' };

        const query = {
            waitForFinish: 100,
            memory: 512,
        };

        const res = await client.tasks.runTask({ taskId, input, ...query });
        expect(res.id).to.be.eql('run-task');
        validateRequest(query, { taskId }, input);
    });

    xit('runTask() works with deprecated input body and contentType params', async () => {
        const taskId = 'some-id';
        const body = JSON.stringify({ foo: 'bar' });

        const query = {
            waitForFinish: 100,
            memory: 512,
            contentType: 'application/json; charset=utf-8',
        };

        const res = await client.tasks.runTask({ taskId, body, ...query });
        expect(res.id).to.be.eql('run-task');
        validateRequest(query, { taskId }, body);
    });

    xit('runTask() works with webhooks', () => {
        const taskId = 'some-id';
        const token = 'some-token';
        const run = { foo: 'bar' };
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

        requestExpectCall({
            method: 'POST',
            url: `${BASE_URL}${BASE_PATH}/${taskId}/runs`,
            qs: { token, webhooks: stringifyWebhooksToBase64(webhooks) },
        }, JSON.stringify({ data: run }));

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .tasks
            .runTask({ taskId, token, webhooks })
            .then(response => expect(response).to.be.eql(run));
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

    it('listWebhooks() works', async () => {
        const taskId = 'some-task-id';
        const query = {
            limit: 5,
            offset: 3,
            desc: true,
        };


        const res = await client.tasks.listWebhooks({ taskId, ...query });
        expect(res.id).to.be.eql('list-webhooks');
        validateRequest(query, { taskId });
    });

    it('getInput() works', async () => {
        const taskId = 'some-task-id';
        const query = {};

        const res = await client.tasks.getInput({ taskId, ...query });
        expect(res.id).to.be.eql('get-input');
        validateRequest(query, { taskId });
    });

    it('updateInput() works', async () => {
        const taskId = 'some-task-id';
        const input = { foo: 'bar' };

        const query = {};

        const res = await client.tasks.updateInput({ taskId, input, ...query });
        expect(res.id).to.be.eql('get-input');
        validateRequest(query, { taskId }, input);
    });
});
