const ApifyClient = require('../src');
const mockServer = require('./mock_server/server');
const { cleanUpBrowser, getInjectedPage } = require('./_helper');

const DEFAULT_QUERY = {
    token: 'default-token',
};

function validateRequest(query = {}, params = {}, body = {}, headers = {}) {
    const request = mockServer.getLastRequest();
    const expectedQuery = getExpectedQuery(query);
    expect(request.query).toEqual(expectedQuery);
    expect(request.params).toEqual(params);
    expect(request.body).toEqual(body);
    Object.entries(headers).forEach(([key, value]) => {
        expect(request.headers).toHaveProperty(key, value);
    });
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
        .filter(([k, v]) => { // eslint-disable-line
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

    describe('indentification', () => {
        test.skip('should work with queueId in default params', () => {
            // TODO: Do we want to support it?
        });

        test('should work with queueId in method call params', async () => {
            const queueId = 'someId';

            const res = await client.requestQueues.getQueue({ queueId });
            expect(res.id).toEqual('get-queue');
            validateRequest({}, { queueId });

            const browserRes = await page.evaluate(options => client.requestQueues.getQueue(options), { queueId });
            expect(browserRes).toEqual(res);
            validateRequest({}, { queueId });
        });

        test('should work with token and queueName', async () => {
            const queueOptions = {
                token: 'sometoken',
                queueName: 'somename',
            };

            const res = await client.requestQueues.getOrCreateQueue(queueOptions);
            expect(res.id).toEqual('get-or-create-request-queue');
            validateRequest({ name: queueOptions.queueName, token: queueOptions.token }, { });

            const browserRes = await page.evaluate(options => client.requestQueues.getOrCreateQueue(options), queueOptions);
            expect(browserRes).toEqual(res);
            validateRequest({ name: queueOptions.queueName, token: queueOptions.token }, { });
        });
    });

    describe('REST method', () => {
        test('listQueues() works', async () => {
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
            expect(res.id).toEqual('list-queues');
            validateRequest(queryString, {});

            const browserRes = await page.evaluate(options => client.requestQueues.listQueues(options), callOptions);
            expect(browserRes).toEqual(res);
            validateRequest(queryString, {});
        });

        test('getQueue() works', async () => {
            const queueId = 'some-id';

            const res = await client.requestQueues.getQueue({ queueId });
            expect(res.id).toEqual('get-queue');
            validateRequest({}, { queueId });

            const browserRes = await page.evaluate(options => client.requestQueues.getQueue(options), { queueId });
            expect(browserRes).toEqual(res);
            validateRequest({}, { queueId });
        });

        test(
            'getQueue() returns null on 404 status code (RECORD_NOT_FOUND)',
            async () => {
                const queueId = '404';


                const res = await client.requestQueues.getQueue({ queueId });
                expect(res).toEqual(null);
                validateRequest({}, { queueId });

                const browserRes = await page.evaluate(options => client.requestQueues.getQueue(options), { queueId });
                expect(browserRes).toEqual(res);
                validateRequest({}, { queueId });
            },
        );

        test('deleteQueue() works', async () => {
            const queueId = '204';

            const res = await client.requestQueues.deleteQueue({ queueId });
            expect(res).toEqual('');
            validateRequest({}, { queueId });

            const browserRes = await page.evaluate(options => client.requestQueues.deleteQueue(options), { queueId });
            expect(browserRes).toEqual(res);
            validateRequest({}, { queueId });
        });

        test('updateQueue() works', async () => {
            const queueId = 'some-id';
            const queue = { id: queueId, name: 'my-name' };

            const res = await client.requestQueues.updateQueue({ queueId, queue });
            expect(res.id).toEqual('update-queue');
            validateRequest({}, { queueId }, { name: queue.name });

            const browserRes = await page.evaluate(opts => client.requestQueues.updateQueue(opts), { queueId, queue });
            expect(browserRes).toEqual(res);
            validateRequest({}, { queueId }, { name: queue.name });
        });


        test('addRequest() works without forefront param', async () => {
            const queueId = 'some-id';
            const request = { url: 'http://example.com' };

            const endpointOptions = {
                request,
                clientKey: 'my-client-id',
            };

            const res = await client.requestQueues.addRequest({ queueId, ...endpointOptions });
            expect(res.id).toEqual('add-request');
            validateRequest({ forefront: false, clientKey: endpointOptions.clientKey }, { queueId }, request);

            const browserRes = await page.evaluate(options => client.requestQueues.addRequest(options), { queueId, ...endpointOptions });
            expect(browserRes).toEqual(res);
            validateRequest({ forefront: false, clientKey: endpointOptions.clientKey }, { queueId }, request);
        });

        test('addRequest() works with forefront param', async () => {
            const queueId = 'some-id';
            const request = { url: 'http://example.com' };

            const endpointOptions = {
                request,
                clientKey: 'my-client-id',
                forefront: true,
            };

            const res = await client.requestQueues.addRequest({ queueId, ...endpointOptions });
            expect(res.id).toEqual('add-request');
            validateRequest({ forefront: true, clientKey: endpointOptions.clientKey }, { queueId }, request);

            const browserRes = await page.evaluate(options => client.requestQueues.addRequest(options), { queueId, ...endpointOptions });
            expect(browserRes).toEqual(res);
            validateRequest({ forefront: true, clientKey: endpointOptions.clientKey }, { queueId }, request);
        });

        test('getRequest() works', async () => {
            const queueId = 'some-id';
            const requestId = 'xxx';

            const res = await client.requestQueues.getRequest({ queueId, requestId });
            expect(res.id).toEqual('get-request');
            validateRequest({}, { queueId, requestId });

            const browserRes = await page.evaluate(options => client.requestQueues.getRequest(options), { queueId, requestId });
            expect(browserRes).toEqual(res);
            validateRequest({}, { queueId, requestId });
        });

        test('deleteRequest() works', async () => {
            const requestId = 'xxx';
            const queueId = '204';

            const res = await client.requestQueues.deleteRequest({ queueId, requestId });
            expect(res).toEqual('');
            validateRequest({}, { queueId, requestId });

            const browserRes = await page.evaluate(options => client.requestQueues.deleteRequest(options), { queueId, requestId });
            expect(browserRes).toEqual(res);
            validateRequest({}, { queueId, requestId });
        });

        test('updateRequest() works with requestId param', async () => {
            const queueId = 'some-id';
            const requestId = 'xxx';
            const request = { url: 'http://example.com' };

            const res = await client.requestQueues.updateRequest({ queueId, requestId, request });
            expect(res.id).toEqual('update-request');
            validateRequest({ forefront: false }, { queueId, requestId }, request);

            const browserRes = await page.evaluate(options => client.requestQueues.updateRequest(options), { queueId, requestId, request });
            expect(browserRes).toEqual(res);
            validateRequest({ forefront: false }, { queueId, requestId }, request);
        });

        test('updateRequest() works without requestId param', async () => {
            const queueId = 'some-id';
            const requestId = 'xxx';
            const request = { url: 'http://example.com', id: requestId };

            const res = await client.requestQueues.updateRequest({ queueId, request });
            expect(res.id).toEqual('update-request');
            validateRequest({ forefront: false }, { queueId, requestId }, request);

            const browserRes = await page.evaluate(options => client.requestQueues.updateRequest(options), { queueId, request });
            expect(browserRes).toEqual(res);
            validateRequest({ forefront: false }, { queueId, requestId }, request);
        });

        test('getHead() works', async () => {
            const queueId = 'some-id';
            const qs = { limit: 5, clientKey: 'some-id' };

            const res = await client.requestQueues.getHead({ queueId, ...qs });
            expect(res.id).toEqual('get-head');
            validateRequest(qs, { queueId });

            const browserRes = await page.evaluate(options => client.requestQueues.getHead(options), { queueId, ...qs });
            expect(browserRes).toEqual(res);
            validateRequest(qs, { queueId });
        });
    });
});
