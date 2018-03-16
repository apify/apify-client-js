import { expect } from 'chai';
import ApifyClient from '../build';
import { BASE_PATH } from '../build/request_queues';
import { mockRequest, requestExpectCall, requestExpectErrorCall, restoreRequest } from './_helper';

const BASE_URL = 'http://example.com/something';
const OPTIONS = { baseUrl: BASE_URL };

describe('Request queue', () => {
    before(mockRequest);
    after(restoreRequest);

    describe('indentification', () => {
        it('should work with queueId in default params', () => {
            const queueId = 'some-id-2';

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${queueId}`,
            }, {
                data: {
                    id: queueId,
                },
            });

            const apifyClient = new ApifyClient(Object.assign({}, OPTIONS, { queueId }));

            return apifyClient
                .requestQueues
                .getQueue()
                .then((queue) => {
                    expect(queue.id).to.be.eql(queueId);
                });
        });

        it('should work with queueId in method call params', () => {
            const queueId = 'some-id-3';

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${queueId}`,
            }, {
                data: {
                    id: queueId,
                },
            });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .requestQueues
                .getQueue({ queueId })
                .then((queue) => {
                    expect(queue.id).to.be.eql(queueId);
                });
        });

        it('should work with token and queueName', () => {
            const queueId = 'some-id-4';
            const queueOptions = {
                token: 'sometoken',
                queueName: 'somename',
            };

            requestExpectCall({
                json: true,
                method: 'POST',
                url: `${BASE_URL}${BASE_PATH}`,
                qs: { name: queueOptions.queueName, token: queueOptions.token },
            }, {
                data: {
                    id: queueId,
                },
            });

            const apifyClient = new ApifyClient(Object.assign({}, OPTIONS, { queueId }));

            return apifyClient
                .requestQueues
                .getOrCreateQueue(queueOptions)
                .then(queue => expect(queue.id).to.be.eql(queueId));
        });
    });

    describe('REST method', () => {
        it('listQueues() works', () => {
            const queueId = 'some-id';
            const callOptions = {
                token: 'sometoken',
                limit: 5,
                offset: 3,
                desc: true,
                unnamed: true,
            };

            const queryString = {
                token: 'sometoken',
                limit: 5,
                offset: 3,
                desc: 1,
                unnamed: 1,
            };

            const expected = {
                limit: 5,
                offset: 3,
                desc: true,
                count: 5,
                total: 10,
                unnamed: true,
                items: ['queue1', 'queue2'],
            };

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}`,
                qs: queryString,
            }, {
                data: expected,
            });

            const apifyClient = new ApifyClient(Object.assign({}, OPTIONS, { queueId }));

            return apifyClient
                .requestQueues
                .listQueues(callOptions)
                .then(response => expect(response).to.be.eql(expected));
        });

        it('getQueue() works', () => {
            const queueId = 'some-id';
            const expected = { _id: 'some-id', aaa: 'bbb' };

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${queueId}`,
            }, { data: expected });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .requestQueues
                .getQueue({ queueId })
                .then(given => expect(given).to.be.eql(expected));
        });

        it('getQueue() returns null on 404 status code (RECORD_NOT_FOUND)', () => {
            const queueId = 'some-id';

            requestExpectErrorCall({
                json: true,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${queueId}`,
            }, false, 404);

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .requestQueues
                .getQueue({ queueId })
                .then(given => expect(given).to.be.eql(null));
        });

        it('deleteQueue() works', () => {
            const queueId = 'some-id';

            requestExpectCall({
                json: true,
                method: 'DELETE',
                url: `${BASE_URL}${BASE_PATH}/${queueId}`,
            });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .requestQueues
                .deleteQueue({ queueId });
        });

        it('addRequest() works without putInFront param', () => {
            const queueId = 'some-id';
            const request = { url: 'http://example.com' };
            const response = { foo: 'bar' };

            requestExpectCall({
                json: true,
                method: 'POST',
                url: `${BASE_URL}${BASE_PATH}/${queueId}/requests`,
                body: request,
                qs: { putInFront: false },
            }, { data: response });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .requestQueues
                .addRequest({ queueId, request })
                .then(data => expect(data).to.be.eql(response));
        });

        it('addRequest() works with putInFront param', () => {
            const queueId = 'some-id';
            const request = { url: 'http://example.com' };
            const response = { foo: 'bar' };

            requestExpectCall({
                json: true,
                method: 'POST',
                url: `${BASE_URL}${BASE_PATH}/${queueId}/requests`,
                body: request,
                qs: { putInFront: true },
            }, { data: response });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .requestQueues
                .addRequest({ queueId, request, putInFront: true })
                .then(data => expect(data).to.be.eql(response));
        });

        it('getRequest() works', () => {
            const queueId = 'some-id';
            const requestId = 'xxx';
            const response = { foo: 'bar' };

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${queueId}/requests/${requestId}`,
            }, { data: response });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .requestQueues
                .getRequest({ queueId, requestId })
                .then(data => expect(data).to.be.eql(response));
        });

        it('deleteRequest() works', () => {
            const queueId = 'some-id';
            const requestId = 'xxx';

            requestExpectCall({
                json: true,
                method: 'DELETE',
                url: `${BASE_URL}${BASE_PATH}/${queueId}/requests/${requestId}`,
            });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .requestQueues
                .deleteRequest({ queueId, requestId });
        });

        it('updateRequest() works with requestId param', () => {
            const queueId = 'some-id';
            const requestId = 'xxx';
            const request = { url: 'http://example.com' };
            const response = { foo: 'bar' };

            requestExpectCall({
                json: true,
                method: 'PUT',
                url: `${BASE_URL}${BASE_PATH}/${queueId}/requests/${requestId}`,
                body: request,
                qs: { putInFront: false },
            }, { data: response });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .requestQueues
                .updateRequest({ queueId, requestId, request })
                .then(data => expect(data).to.be.eql(response));
        });

        it('updateRequest() works without requestId param', () => {
            const queueId = 'some-id';
            const requestId = 'xxx';
            const request = { url: 'http://example.com', id: requestId };
            const response = { foo: 'bar' };

            requestExpectCall({
                json: true,
                method: 'PUT',
                url: `${BASE_URL}${BASE_PATH}/${queueId}/requests/${requestId}`,
                body: request,
                qs: { putInFront: true },
            }, { data: response });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .requestQueues
                .updateRequest({ queueId, request, putInFront: true })
                .then(data => expect(data).to.be.eql(response));
        });

        it('queryQueueHead() works', () => {
            const queueId = 'some-id';
            const response = { foo: 'bar' };

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${queueId}/head`,
                qs: { limit: 5 },
            }, { data: response });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .requestQueues
                .queryQueueHead({ queueId, limit: 5 })
                .then(data => expect(data).to.be.eql(response));
        });
    });
});
