import { expect } from 'chai';
import ApifyClient from '../build';
import { BASE_PATH, REQUEST_ENDPOINTS_EXP_BACKOFF_MAX_REPEATS } from '../build/request_queues';
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
                qs: {},
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
                qs: {},
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
                qs: {},
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
                qs: {},
            }, false, 404);

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .requestQueues
                .getQueue({ queueId })
                .then(given => expect(given).to.be.eql(null));
        });

        it('deleteQueue() works', () => {
            const queueId = 'some-id';
            const token = 'my-token';

            requestExpectCall({
                json: true,
                method: 'DELETE',
                url: `${BASE_URL}${BASE_PATH}/${queueId}`,
                qs: { token },
            });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .requestQueues
                .deleteQueue({ queueId, token });
        });

        it('addRequest() works without forefront param', () => {
            const queueId = 'some-id';
            const request = { url: 'http://example.com' };
            const response = { foo: 'bar' };
            const token = 'my-token';

            requestExpectCall({
                json: true,
                method: 'POST',
                url: `${BASE_URL}${BASE_PATH}/${queueId}/requests`,
                body: request,
                qs: { forefront: false, token },
                expBackOffMaxRepeats: REQUEST_ENDPOINTS_EXP_BACKOFF_MAX_REPEATS,
            }, { data: response });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .requestQueues
                .addRequest({ queueId, request, token })
                .then(data => expect(data).to.be.eql(response));
        });

        it('addRequest() works with forefront param', () => {
            const queueId = 'some-id';
            const request = { url: 'http://example.com' };
            const response = { foo: 'bar' };
            const token = 'my-token';

            requestExpectCall({
                json: true,
                method: 'POST',
                url: `${BASE_URL}${BASE_PATH}/${queueId}/requests`,
                body: request,
                qs: { forefront: true, token },
                expBackOffMaxRepeats: REQUEST_ENDPOINTS_EXP_BACKOFF_MAX_REPEATS,
            }, { data: response });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .requestQueues
                .addRequest({ queueId, request, forefront: true, token })
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
                qs: {},
                expBackOffMaxRepeats: REQUEST_ENDPOINTS_EXP_BACKOFF_MAX_REPEATS,
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
            const token = 'my-token';

            requestExpectCall({
                json: true,
                method: 'DELETE',
                url: `${BASE_URL}${BASE_PATH}/${queueId}/requests/${requestId}`,
                qs: { token },
                expBackOffMaxRepeats: REQUEST_ENDPOINTS_EXP_BACKOFF_MAX_REPEATS,
            });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .requestQueues
                .deleteRequest({ queueId, requestId, token });
        });

        it('updateRequest() works with requestId param', () => {
            const queueId = 'some-id';
            const requestId = 'xxx';
            const request = { url: 'http://example.com' };
            const response = { foo: 'bar' };
            const token = 'my-token';

            requestExpectCall({
                json: true,
                method: 'PUT',
                url: `${BASE_URL}${BASE_PATH}/${queueId}/requests/${requestId}`,
                body: request,
                qs: { forefront: false, token },
                expBackOffMaxRepeats: REQUEST_ENDPOINTS_EXP_BACKOFF_MAX_REPEATS,
            }, { data: response });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .requestQueues
                .updateRequest({ queueId, requestId, request, token })
                .then(data => expect(data).to.be.eql(response));
        });

        it('updateRequest() works without requestId param', () => {
            const queueId = 'some-id';
            const requestId = 'xxx';
            const request = { url: 'http://example.com', id: requestId };
            const response = { foo: 'bar' };
            const token = 'my-token';

            requestExpectCall({
                json: true,
                method: 'PUT',
                url: `${BASE_URL}${BASE_PATH}/${queueId}/requests/${requestId}`,
                body: request,
                qs: { forefront: true, token },
                expBackOffMaxRepeats: REQUEST_ENDPOINTS_EXP_BACKOFF_MAX_REPEATS,
            }, { data: response });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .requestQueues
                .updateRequest({ queueId, request, forefront: true, token })
                .then(data => expect(data).to.be.eql(response));
        });

        it('getHead() works', () => {
            const queueId = 'some-id';
            const response = { foo: 'bar' };

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${queueId}/head`,
                qs: { limit: 5 },
                expBackOffMaxRepeats: REQUEST_ENDPOINTS_EXP_BACKOFF_MAX_REPEATS,
            }, { data: response });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .requestQueues
                .getHead({ queueId, limit: 5 })
                .then(data => expect(data).to.be.eql(response));
        });
    });
});
