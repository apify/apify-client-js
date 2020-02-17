import { expect } from 'chai';
import ApifyClient from '../build';
import { BASE_PATH, REQUEST_ENDPOINTS_EXP_BACKOFF_MAX_REPEATS } from '../build/request_queues';
import mockServer from './mock_server/server';
import { cleanUpBrowser, getInjectedPage } from './_helper';

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
        .filter(([k, v]) => {
            if (typeof v === 'boolean') {
                return true;
            }

            return v !== false;
        }) // eslint-disable-line no-unused-vars
        .map(([k, v]) => {
            if (typeof v === 'number') v = v.toString();
            else if (typeof v === 'boolean') v = v.toString();
            return [k, v];
        })
        .reduce((newObj, [k, v]) => {
            newObj[k] = v;
            return newObj;
        }, {});
}

describe('RequestQueues methods', () => {
    let baseUrl = null;
    let page;
    before(async () => {
        const server = await mockServer.start(3333);
        baseUrl = `http://localhost:${server.address().port}`;
    });
    after(() => mockServer.close());

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

    describe('indentification', () => {
        xit('should work with queueId in default params', () => {
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

        it('should work with queueId in method call params', async () => {
            const queueId = 'someId';

            const res = await client.requestQueues.getQueue({ queueId });
            expect(res.id).to.be.eql('get-queue');
            validateRequest({}, { queueId });

            const browserRes = await page.evaluate(options => client.requestQueues.getQueue(options), { queueId });
            expect(browserRes).to.eql(res);
            validateRequest({}, { queueId });
        });

        it('should work with token and queueName', async () => {
            const queueOptions = {
                token: 'sometoken',
                queueName: 'somename',
            };

            const res = await client.requestQueues.getOrCreateQueue(queueOptions);
            expect(res.id).to.be.eql('get-or-create-request-queue');
            validateRequest({ name: queueOptions.queueName, token: queueOptions.token }, { });

            const browserRes = await page.evaluate(options => client.requestQueues.getOrCreateQueue(options), queueOptions);
            expect(browserRes).to.eql(res);
            validateRequest({ name: queueOptions.queueName, token: queueOptions.token }, { });
        });
    });

    describe('REST method', () => {
        it('listQueues() works', async () => {
            const callOptions = {
                limit: 5,
                offset: 3,
                desc: true,
                unnamed: true,
            };

            const queryString = {
                limit: 5,
                offset: 3,
                desc: 1,
                unnamed: 1,
            };

            const res = await client.requestQueues.listQueues(callOptions);
            expect(res.id).to.be.eql('list-queues');
            validateRequest(queryString, {});

            const browserRes = await page.evaluate(options => client.requestQueues.listQueues(options), callOptions);
            expect(browserRes).to.eql(res);
            validateRequest(queryString, {});
        });

        it('getQueue() works', async () => {
            const queueId = 'some-id';

            const res = await client.requestQueues.getQueue({ queueId });
            expect(res.id).to.be.eql('get-queue');
            validateRequest({}, { queueId });

            const browserRes = await page.evaluate(options => client.requestQueues.getQueue(options), { queueId });
            expect(browserRes).to.eql(res);
            validateRequest({}, { queueId });
        });

        it('getQueue() returns null on 404 status code (RECORD_NOT_FOUND)', async () => {
            const queueId = '404';


            const res = await client.requestQueues.getQueue({ queueId });
            expect(res).to.be.eql(null);
            validateRequest({}, { queueId });

            const browserRes = await page.evaluate(options => client.requestQueues.getQueue(options), { queueId });
            expect(browserRes).to.eql(res);
            validateRequest({}, { queueId });
        });

        it('deleteQueue() works', async () => {
            const queueId = '204';

            const res = await client.requestQueues.deleteQueue({ queueId });
            expect(res).to.be.eql('');
            validateRequest({}, { queueId });

            const browserRes = await page.evaluate(options => client.requestQueues.deleteQueue(options), { queueId });
            expect(browserRes).to.eql(res);
            validateRequest({}, { queueId });
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

        it('updateQueue() works', () => {
            const queueId = 'some-id';
            const token = 'my-token';
            const queue = { id: queueId, name: 'my-name' };

            requestExpectCall({
                json: true,
                method: 'PUT',
                url: `${BASE_URL}${BASE_PATH}/${queueId}`,
                qs: { token },
                body: _.omit(queue, 'id'),
            });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .requestQueues
                .updateQueue({ queueId, queue, token });
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
        it('addRequest() works without forefront param', async () => {
            const queueId = 'some-id';
            const request = { url: 'http://example.com' };

            const endpointOptions = {
                request,
                clientKey: 'my-client-id',
            };

            const res = await client.requestQueues.addRequest({ queueId, ...endpointOptions });
            expect(res.id).to.be.eql('add-request');
            validateRequest({ forefront: false, clientKey: endpointOptions.clientKey }, { queueId }, request);

            const browserRes = await page.evaluate(options => client.requestQueues.addRequest(options), { queueId, ...endpointOptions  });
            expect(browserRes).to.eql(res);
            validateRequest({ forefront: false, clientKey: endpointOptions.clientKey }, { queueId }, request);
        });

        it('addRequest() works with forefront param', async () => {
            const queueId = 'some-id';
            const request = { url: 'http://example.com' };

            const endpointOptions = {
                request,
                clientKey: 'my-client-id',
                forefront: true,
            };

            const res = await client.requestQueues.addRequest({ queueId, ...endpointOptions });
            expect(res.id).to.be.eql('add-request');
            validateRequest({ forefront: true, clientKey: endpointOptions.clientKey }, { queueId }, request);

            const browserRes = await page.evaluate(options => client.requestQueues.addRequest(options), { queueId, ...endpointOptions  });
            expect(browserRes).to.eql(res);
            validateRequest({ forefront: true, clientKey: endpointOptions.clientKey }, { queueId }, request);
        });

        it('getRequest() works', async () => {
            const queueId = 'some-id';
            const requestId = 'xxx';

            const res = await client.requestQueues.getRequest({ queueId, requestId });
            expect(res.id).to.be.eql('get-request');
            validateRequest({}, { queueId, requestId });

            const browserRes = await page.evaluate(options => client.requestQueues.getRequest(options), { queueId, requestId });
            expect(browserRes).to.eql(res);
            validateRequest({}, { queueId, requestId });
        });

        it('deleteRequest() works', async () => {
            const requestId = 'xxx';
            const queueId = '204';

            const res = await client.requestQueues.deleteRequest({ queueId, requestId });
            expect(res).to.be.eql('');
            validateRequest({}, { queueId, requestId });

            const browserRes = await page.evaluate(options => client.requestQueues.deleteRequest(options), { queueId, requestId });
            expect(browserRes).to.eql(res);
            validateRequest({}, { queueId, requestId });
        });

        it('updateRequest() works with requestId param', async () => {
            const queueId = 'some-id';
            const requestId = 'xxx';
            const request = { url: 'http://example.com' };

            const res = await client.requestQueues.updateRequest({ queueId, requestId, request });
            expect(res.id).to.be.eql('update-request');
            validateRequest({ forefront: false }, { queueId, requestId }, request);

            const browserRes = await page.evaluate(options => client.requestQueues.updateRequest(options), { queueId, requestId, request });
            expect(browserRes).to.eql(res);
            validateRequest({ forefront: false }, { queueId, requestId }, request);
        });

        it('updateRequest() works without requestId param', async () => {
            const queueId = 'some-id';
            const requestId = 'xxx';
            const request = { url: 'http://example.com', id: requestId };

            const res = await client.requestQueues.updateRequest({ queueId, request });
            expect(res.id).to.be.eql('update-request');
            validateRequest({ forefront: false }, { queueId, requestId }, request);

            const browserRes = await page.evaluate(options => client.requestQueues.updateRequest(options), { queueId, request });
            expect(browserRes).to.eql(res);
            validateRequest({ forefront: false }, { queueId, requestId }, request);
        });

        it('getHead() works', async () => {
            const queueId = 'some-id';
            const qs = { limit: 5, clientKey: 'some-id' };

            const res = await client.requestQueues.getHead({ queueId, ...qs });
            expect(res.id).to.be.eql('get-head');
            validateRequest(qs, { queueId });

            const browserRes = await page.evaluate(options => client.requestQueues.getHead(options), { queueId, ...qs });
            expect(browserRes).to.eql(res);
            validateRequest(qs, { queueId });
        });
    });
});
