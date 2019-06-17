import _ from 'underscore';
import { expect } from 'chai';
import ApifyClient from '../build';
import { BASE_PATH } from '../build/tasks';
import { mockRequest, requestExpectCall, requestExpectErrorCall, restoreRequest } from './_helper';
import { stringifyWebhooksToBase64 } from '../build/utils';

const BASE_URL = 'http://example.com/something';
const OPTIONS = { baseUrl: BASE_URL };

describe('Tasks method', () => {
    before(mockRequest);
    after(restoreRequest);

    it('listTasks() works', () => {
        const callOptions = {
            token: 'sometoken',
            limit: 5,
            offset: 3,
            desc: true,
        };

        const queryString = {
            token: 'sometoken',
            limit: 5,
            offset: 3,
            desc: 1,
        };

        const expected = {
            limit: 5,
            offset: 3,
            count: 5,
            total: 10,
            desc: true,
            items: ['task1', 'task2'],
        };

        requestExpectCall({
            json: true,
            method: 'GET',
            url: `${BASE_URL}${BASE_PATH}`,
            qs: queryString,
        }, {
            data: expected,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .tasks
            .listTasks(callOptions)
            .then(response => expect(response).to.be.eql(expected));
    });

    it('listTasks() works without pagination', () => {
        const callOptions = {
            token: 'sometoken',
        };

        const queryString = {
            token: 'sometoken',
        };

        const expected = {
            limit: 1000,
            offset: 0,
            count: 2,
            total: 2,
            desc: false,
            items: ['task1', 'task2'],
        };

        requestExpectCall({
            json: true,
            method: 'GET',
            url: `${BASE_URL}${BASE_PATH}`,
            qs: queryString,
        }, {
            data: expected,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .tasks
            .listTasks(callOptions)
            .then(response => expect(response).to.be.eql(expected));
    });

    it('createTask() works', () => {
        const task = { foo: 'bar' };
        const token = 'some-token';

        requestExpectCall({
            json: true,
            method: 'POST',
            url: `${BASE_URL}${BASE_PATH}`,
            qs: { token },
            body: task,
        }, {
            data: task,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .tasks
            .createTask({ task, token })
            .then(response => expect(response).to.be.eql(task));
    });

    it('updateTask() works with both taskId parameter and taskId in task object', () => {
        const taskId = 'some-user/some-id';
        const task = { id: taskId, foo: 'bar' };
        const token = 'some-token';

        requestExpectCall({
            json: true,
            method: 'PUT',
            url: `${BASE_URL}${BASE_PATH}/some-user~some-id`,
            qs: { token },
            body: _.omit(task, 'id'),
        }, {
            data: task,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .tasks
            .updateTask({ taskId, task, token })
            .then(response => expect(response).to.be.eql(task));
    });

    it('updateTask() works with taskId in task object', () => {
        const taskId = 'some-id';
        const task = { id: taskId, foo: 'bar' };
        const token = 'some-token';

        requestExpectCall({
            json: true,
            method: 'PUT',
            url: `${BASE_URL}${BASE_PATH}/${taskId}`,
            qs: { token },
            body: _.omit(task, 'id'),
        }, {
            data: task,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .tasks
            .updateTask({ task, token })
            .then(response => expect(response).to.be.eql(task));
    });

    it('updateTask() works with taskId parameter', () => {
        const taskId = 'some-id';
        const task = { foo: 'bar' };
        const token = 'some-token';

        requestExpectCall({
            json: true,
            method: 'PUT',
            url: `${BASE_URL}${BASE_PATH}/${taskId}`,
            qs: { token },
            body: task,
        }, {
            data: task,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .tasks
            .updateTask({ taskId, task, token })
            .then(response => expect(response).to.be.eql(task));
    });

    it('updateTask() works with taskId as part task.id parameter', () => {
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

    it('getTask() works', () => {
        const taskId = 'some-id';
        const task = { id: taskId, foo: 'bar' };
        const token = 'some-token';

        requestExpectCall({
            json: true,
            method: 'GET',
            url: `${BASE_URL}${BASE_PATH}/${taskId}`,
            qs: { token },
        }, {
            data: task,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .tasks
            .getTask({ taskId, token })
            .then(response => expect(response).to.be.eql(task));
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

    it('getTask() returns null on 404 status code (RECORD_NOT_FOUND)', () => {
        const taskId = 'some-id';
        const token = 'some-token';

        requestExpectErrorCall({
            json: true,
            method: 'GET',
            url: `${BASE_URL}${BASE_PATH}/${taskId}`,
            qs: { token },
        }, false, 404);

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .tasks
            .getTask({ taskId, token })
            .then(given => expect(given).to.be.eql(null));
    });

    it('deleteTask() works', () => {
        const taskId = 'some-id';
        const token = 'some-token';

        requestExpectCall({
            json: true,
            method: 'DELETE',
            url: `${BASE_URL}${BASE_PATH}/${taskId}`,
            qs: { token },
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .tasks
            .deleteTask({ taskId, token });
    });

    it('listRuns() works', () => {
        const taskId = 'some-id';

        const callOptions = {
            token: 'sometoken',
            limit: 5,
            offset: 3,
            desc: true,
        };

        const queryString = {
            token: 'sometoken',
            limit: 5,
            offset: 3,
            desc: 1,
        };

        const expected = {
            limit: 5,
            offset: 3,
            desc: true,
            count: 5,
            total: 10,
            items: ['run1', 'run2'],
        };

        requestExpectCall({
            json: true,
            method: 'GET',
            url: `${BASE_URL}${BASE_PATH}/${taskId}/runs`,
            qs: queryString,
        }, {
            data: expected,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .tasks
            .listRuns(Object.assign({}, callOptions, { taskId }))
            .then(response => expect(response).to.be.eql(expected));
    });

    it('listRuns() works without pagination params', () => {
        const taskId = 'some-id';

        const callOptions = {
            token: 'sometoken',
        };

        const queryString = {
            token: 'sometoken',
        };

        const expected = {
            limit: 1000,
            offset: 0,
            desc: false,
            count: 2,
            total: 2,
            items: ['run1', 'run2'],
        };

        requestExpectCall({
            json: true,
            method: 'GET',
            url: `${BASE_URL}${BASE_PATH}/${taskId}/runs`,
            qs: queryString,
        }, {
            data: expected,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .tasks
            .listRuns(Object.assign({}, callOptions, { taskId }))
            .then(response => expect(response).to.be.eql(expected));
    });

    it('runTask() works', () => {
        const taskId = 'some-id';
        const token = 'some-token';
        const run = { foo: 'bar' };
        const apiResponse = JSON.stringify({ data: run });

        const waitForFinish = 120;

        requestExpectCall({
            method: 'POST',
            url: `${BASE_URL}${BASE_PATH}/${taskId}/runs`,
            qs: { token, waitForFinish },
        }, apiResponse);

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .tasks
            .runTask({ taskId, token, waitForFinish })
            .then(response => expect(response).to.be.eql(run));
    });

    it('runTask() works with input and options overrides', () => {
        const taskId = 'some-id';
        const token = 'some-token';
        const run = { foo: 'bar' };
        const apiResponse = { data: run };
        const memory = 512;
        const input = { foo: 'bar' };

        const waitForFinish = 120;

        requestExpectCall({
            method: 'POST',
            url: `${BASE_URL}${BASE_PATH}/${taskId}/runs`,
            json: true,
            qs: { token, waitForFinish, memory },
            body: input,
        }, apiResponse);

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .tasks
            .runTask({ taskId, token, waitForFinish, memory, input })
            .then(response => expect(response).to.be.eql(run));
    });

    it('runTask() works with deprecated input body and contentType params', () => {
        const taskId = 'some-id';
        const token = 'some-token';
        const run = { foo: 'bar' };
        const apiResponse = JSON.stringify({ data: run });
        const contentType = 'application/json; charset=utf-8';
        const body = '{ "foo": "bar" }';

        const waitForFinish = 120;

        requestExpectCall({
            method: 'POST',
            url: `${BASE_URL}${BASE_PATH}/${taskId}/runs`,
            headers: { 'Content-Type': contentType },
            qs: { token, waitForFinish },
            body,
        }, apiResponse);

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .tasks
            .runTask({ taskId, token, waitForFinish, body, contentType })
            .then(response => expect(response).to.be.eql(run));
    });

    it('runTask() works with webhooks', () => {
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

    it('listWebhooks() works', () => {
        const taskId = 'some-id';
        const token = 'some-token';

        const expected = {
            limit: 5,
            offset: 3,
            desc: true,
            count: 5,
            total: 10,
            items: ['webhook1', 'webhook2'],
        };

        requestExpectCall({
            json: true,
            method: 'GET',
            url: `${BASE_URL}${BASE_PATH}/${taskId}/webhooks`,
            qs: { token },
        }, {
            data: expected,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .tasks
            .listWebhooks({ taskId, token })
            .then(response => expect(response).to.be.eql(expected));
    });

    it('getInput() works', () => {
        const taskId = 'some-id';
        const input = { foo: 'bar' };
        const token = 'some-token';

        requestExpectCall({
            json: true,
            method: 'GET',
            url: `${BASE_URL}${BASE_PATH}/${taskId}/input`,
            qs: { token },
        }, {
            data: input,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .tasks
            .getInput({ taskId, token })
            .then(response => expect(response).to.be.eql(input));
    });

    it('updateInput() works', () => {
        const taskId = 'some-id';
        const input = { foo: 'bar' };
        const returnedInput = { foo: 'bar', hotel: 'restaurant' };
        const token = 'some-token';

        requestExpectCall({
            json: true,
            method: 'POST',
            url: `${BASE_URL}${BASE_PATH}/${taskId}/input`,
            qs: { token },
            body: input,
        }, {
            data: returnedInput,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .tasks
            .updateInput({ taskId, token, input })
            .then(response => expect(response).to.be.eql(returnedInput));
    });
});
