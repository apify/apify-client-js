const { ApifyClient } = require('../src');
const mockServer = require('./mock_server/server');
const { Browser, validateRequest, DEFAULT_OPTIONS } = require('./_helper');

describe('Request Queue methods', () => {
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

    describe('requestQueues()', () => {
        test('list() works', async () => {
            const opts = {
                limit: 5,
                offset: 3,
                desc: true,
                unnamed: true,
            };

            const res = await client.requestQueues().list(opts);
            expect(res.id).toEqual('list-queues');
            validateRequest(opts);

            const browserRes = await page.evaluate((options) => client.requestQueues().list(options), opts);
            expect(browserRes).toEqual(res);
            validateRequest(opts);
        });

        test('getOrCreate() works without name', async () => {
            const res = await client.requestQueues().getOrCreate();
            expect(res.id).toEqual('get-or-create-queue');
            validateRequest();

            const browserRes = await page.evaluate((n) => client.requestQueues().getOrCreate(n));
            expect(browserRes).toEqual(res);
            validateRequest();
        });

        test('getOrCreate() works with name', async () => {
            const name = 'some-id-2';

            const res = await client.requestQueues().getOrCreate(name);
            expect(res.id).toEqual('get-or-create-queue');
            validateRequest({ name });

            const browserRes = await page.evaluate((n) => client.requestQueues().getOrCreate(n), name);
            expect(browserRes).toEqual(res);
            validateRequest({ name });
        });
    });

    describe('requestQueue(id)', () => {
        test('get() works', async () => {
            const queueId = 'some-id';

            const res = await client.requestQueue(queueId).get();
            expect(res.id).toEqual('get-queue');
            validateRequest({}, { queueId });

            const browserRes = await page.evaluate((id) => client.requestQueue(id).get(), queueId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { queueId });
        });

        test('get() returns undefined on 404 status code (RECORD_NOT_FOUND)', async () => {
            const queueId = '404';

            const res = await client.requestQueue(queueId).get();
            expect(res).toBeUndefined();
            validateRequest({}, { queueId });

            const browserRes = await page.evaluate((id) => client.requestQueue(id).get(), queueId);
            expect(browserRes).toBeUndefined();
            validateRequest({}, { queueId });
        });

        test('delete() works', async () => {
            const queueId = '204';

            const res = await client.requestQueue(queueId).delete();
            expect(res).toBeUndefined();
            validateRequest({}, { queueId });

            const browserRes = await page.evaluate((id) => client.requestQueue(id).delete(), queueId);
            expect(browserRes).toBeUndefined();
        });

        test('update() works', async () => {
            const queueId = 'some-id';
            const queue = { name: 'my-name' };

            const res = await client.requestQueue(queueId).update(queue);
            expect(res.id).toEqual('update-queue');
            validateRequest({}, { queueId }, { name: queue.name });

            const browserRes = await page.evaluate((id, opts) => client.requestQueue(id).update(opts), queueId, queue);
            expect(browserRes).toEqual(res);
            validateRequest({}, { queueId }, { name: queue.name });
        });

        test('addRequest() works without forefront param', async () => {
            const queueId = 'some-id';
            const request = { url: 'http://example.com' };

            const res = await client.requestQueue(queueId).addRequest(request);
            expect(res.id).toEqual('add-request');
            validateRequest({}, { queueId }, request);

            const browserRes = await page.evaluate((id, r) => client.requestQueue(id).addRequest(r), queueId, request);
            expect(browserRes).toEqual(res);
            validateRequest({}, { queueId }, request);
        });

        test('addRequest() respects over-ridden timeout', async () => {
            const queueId = 'some-id';
            const request = { url: 'http://example.com' };
            let errorMessage;
            try {
                await client.requestQueue(queueId, { timeoutSecs: 0.001 }).addRequest(request);
            } catch (e) {
                errorMessage = e.toString();
            }
            expect(errorMessage).toEqual('Error: timeout of 1ms exceeded');
        });

        test('addRequest() works with forefront param', async () => {
            const queueId = 'some-id';
            const request = { url: 'http://example.com' };
            const forefront = true;

            const res = await client.requestQueue(queueId).addRequest(request, { forefront });
            expect(res.id).toEqual('add-request');
            validateRequest({ forefront }, { queueId }, request);

            const browserRes = await page.evaluate((qId, r) => {
                return client.requestQueue(qId).addRequest(r, { forefront: true });
            }, queueId, request);
            expect(browserRes).toEqual(res);
            validateRequest({ forefront }, { queueId }, request);
        });

        test('getRequest() works', async () => {
            const queueId = 'some-id';
            const requestId = 'xxx';

            const res = await client.requestQueue(queueId).getRequest(requestId);
            expect(res.id).toEqual('get-request');
            validateRequest({}, { queueId, requestId });

            const browserRes = await page.evaluate((qId, rId) => client.requestQueue(qId).getRequest(rId), queueId, requestId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { queueId, requestId });
        });

        test('getRequest() respects over-ridden timeout', async () => {
            const queueId = 'some-id';
            const requestId = 'xxx';
            let errorMessage;
            try {
                await client.requestQueue(queueId, { timeoutSecs: 0.001 }).getRequest(requestId);
            } catch (e) {
                errorMessage = e.toString();
            }
            expect(errorMessage).toEqual('Error: timeout of 1ms exceeded');
        });

        test('deleteRequest() works', async () => {
            const requestId = 'xxx';
            const queueId = '204';

            const res = await client.requestQueue(queueId).deleteRequest(requestId);
            expect(res).toBeUndefined();
            validateRequest({}, { queueId, requestId });

            const browserRes = await page.evaluate((qId, rId) => client.requestQueue(qId).deleteRequest(rId), queueId, requestId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { queueId, requestId });
        });

        test('deleteRequest() respects over-ridden timeout', async () => {
            const requestId = 'xxx';
            const queueId = '204';
            let errorMessage;
            try {
                await client.requestQueue(queueId, { timeoutSecs: 0.001 }).deleteRequest(requestId);
            } catch (e) {
                errorMessage = e.toString();
            }
            expect(errorMessage).toEqual('Error: timeout of 1ms exceeded');
        });

        test('updateRequest() works with forefront', async () => {
            const queueId = 'some-id';
            const requestId = 'xxx';
            const request = { id: requestId, url: 'http://example.com' };
            const forefront = true;

            const res = await client.requestQueue(queueId).updateRequest(request, { forefront });
            expect(res.id).toEqual('update-request');
            validateRequest({ forefront }, { queueId, requestId }, request);

            const browserRes = await page.evaluate((id, r) => {
                return client.requestQueue(id).updateRequest(r, { forefront: true });
            }, queueId, request);
            expect(browserRes).toEqual(res);
            validateRequest({ forefront }, { queueId, requestId }, request);
        });

        test('updateRequest() works without forefront', async () => {
            const queueId = 'some-id';
            const requestId = 'xxx';
            const request = { id: requestId, url: 'http://example.com' };

            const res = await client.requestQueue(queueId).updateRequest(request);
            expect(res.id).toEqual('update-request');
            validateRequest({}, { queueId, requestId }, request);

            const browserRes = await page.evaluate((id, r) => {
                return client.requestQueue(id).updateRequest(r);
            }, queueId, request);
            expect(browserRes).toEqual(res);
            validateRequest({}, { queueId, requestId }, request);
        });

        test('updateRequest() respects over-ridden timeout', async () => {
            const queueId = 'some-id';
            const requestId = 'xxx';
            const request = { id: requestId, url: 'http://example.com' };
            let errorMessage;
            try {
                await client.requestQueue(queueId, { timeoutSecs: 0.001 }).updateRequest(request);
            } catch (e) {
                errorMessage = e.toString();
            }
            expect(errorMessage).toEqual('Error: timeout of 1ms exceeded');
        });

        test('listHead() works', async () => {
            const queueId = 'some-id';
            const options = { limit: 5 };

            const res = await client.requestQueue(queueId).listHead(options);
            expect(res.id).toEqual('get-head');
            validateRequest(options, { queueId });

            const browserRes = await page.evaluate((id, opts) => client.requestQueue(id).listHead(opts), queueId, options);
            expect(browserRes).toEqual(res);
            validateRequest(options, { queueId });
        });

        test('listHead() respects over-ridden timeout', async () => {
            const queueId = 'some-id';
            const options = { limit: 5 };
            let errorMessage;
            try {
                await client.requestQueue(queueId, { timeoutSecs: 0.001 }).listHead(options);
            } catch (e) {
                errorMessage = e.toString();
            }
            expect(errorMessage).toEqual('Error: timeout of 1ms exceeded');
        });

        test.each([
            'addRequest',
            'updateRequest',
            'deleteRequest',
        ])('clientKey param propagates to %s()', async (method) => {
            const queueId = 'some-id';
            const requestId = 'xxx';
            const request = { id: requestId, url: 'http://example.com' };
            const clientKey = 'my-client-key';

            const param = method.startsWith('delete') ? request.id : request;
            if (method.startsWith('add')) delete request.id;

            const queue = client.requestQueue(queueId, { clientKey });
            const res = await queue[method](param);
            validateRequest({ clientKey }, false, false);

            const browserRes = await page.evaluate((id, k, p, m) => {
                const rq = client.requestQueue(id, { clientKey: k });
                return rq[m](p);
            }, queueId, clientKey, param, method);
            expect(browserRes).toEqual(res);
            validateRequest({ clientKey }, false, false);
        });

        test('batchAddRequests() works', async () => {
            const queueId = 'some-id';
            const requestsLength = 1000;
            const requests = new Array(requestsLength).fill(0).map((_, i) => ({ url: `http://example.com/${i}` }));

            await client.requestQueue(queueId).batchAddRequests(requests);
            const firedRequests = mockServer.getLastRequests(requestsLength / 25);
            const processedRequestUrls = [];
            firedRequests.map((req) => {
                expect(req.url).toEqual(`/${queueId}/requests/batch`);
                req.body.forEach(({ url }) => {
                    processedRequestUrls.push(url);
                });
            });
            expect(processedRequestUrls.length).toEqual(requestsLength);
            expect(processedRequestUrls).toEqual(
                expect.arrayContaining(requests.map((req) => req.url)),
            );
        });

        test('_batchAddRequests() works', async () => {
            const queueId = 'some-id';
            const options = { forefront: true };
            const requests = new Array(10).fill(0).map((_, i) => ({ url: `http://example.com/${i}` }));

            const res = await client.requestQueue(queueId).batchAddRequests(requests, options);
            validateRequest(options, { queueId }, requests);

            const browserRes = await page.evaluate((id, req, opts) => {
                return client.requestQueue(id).batchAddRequests(req, opts);
            }, queueId, requests, options);
            expect(browserRes).toEqual(res);
            validateRequest(options, { queueId }, requests);
        });

        test('batchDeleteRequests() works', async () => {
            const queueId = 'some-id';
            const requests = new Array(10).fill(0).map((_, i) => ({ uniqueKey: `http://example.com/${i}` }));

            const res = await client.requestQueue(queueId).batchDeleteRequests(requests);
            validateRequest(false, { queueId }, requests);

            const browserRes = await page.evaluate((id, req) => {
                return client.requestQueue(id).batchDeleteRequests(req);
            }, queueId, requests);
            expect(browserRes).toEqual(res);
            validateRequest(false, { queueId }, requests);
        });

        test('listAndLockHead() works', async () => {
            const queueId = 'some-id';
            const options = { limit: 5, lockSecs: 10 };

            // Throw if lockSecs is missing or is not a number
            await expect(client.requestQueue(queueId).listAndLockHead({ limit: 10 })).rejects.toThrow();
            await expect(client.requestQueue(queueId).listAndLockHead({ lockSecs: 'bla' })).rejects.toThrow();

            const res = await client.requestQueue(queueId).listAndLockHead(options);
            expect(res.id).toEqual('post-lock-head');
            validateRequest(options, { queueId });

            const browserRes = await page.evaluate((id, opts) => client.requestQueue(id).listAndLockHead(opts), queueId, options);
            expect(browserRes).toEqual(res);
            validateRequest(options, { queueId });
        });

        test('prolongRequestLock() works', async () => {
            const queueId = 'some-id';
            const requestId = '123';
            const options = { forefront: true, lockSecs: 10 };

            const res = await client.requestQueue(queueId).prolongRequestLock(requestId, options);
            expect(res.id).toEqual('put-lock-request');
            validateRequest(options, { queueId, requestId });

            const browserRes = await page.evaluate((qId, rId, opts) => {
                return client.requestQueue(qId).prolongRequestLock(rId, opts);
            }, queueId, requestId, options);
            expect(browserRes).toEqual(res);
            validateRequest(options, { queueId, requestId });
        });

        test('deleteRequestLock() works', async () => {
            const queueId = 'some-id';
            const requestId = '123';

            const res = await client.requestQueue(queueId).deleteRequestLock(requestId);
            expect(res).toBeUndefined();
            validateRequest({}, { queueId, requestId });

            const browserRes = await page.evaluate((qId, rId) => {
                return client.requestQueue(qId).deleteRequestLock(rId);
            }, queueId, requestId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { queueId, requestId });
        });

        test('listRequests() works', async () => {
            const queueId = 'some-id';
            const options = { limit: 5, exclusiveStartId: '123' };

            const res = await client.requestQueue(queueId).listRequests(options);
            expect(res.id).toEqual('list-requests');
            validateRequest(options, { queueId });

            const browserRes = await page.evaluate((id, opts) => client.requestQueue(id).listRequests(opts), queueId, options);
            expect(browserRes).toEqual(res);
            validateRequest(options, { queueId });
        });

        test('paginateRequests() works', async () => {
            const queueId = 'some-id';
            const maxPageLimit = 90;
            const requests = new Array(1000).fill(0).map((_, i) => ({ id: i.toString() }));
            const mockResponse = (items) => {
                mockServer.setResponse({
                    statusCode: 200,
                    body: {
                        data: {
                            items,
                        },
                    },
                });
            };

            const pagination = client.requestQueue(queueId).paginateRequests({ maxPageLimit });
            // Mock API call for the first page
            let expectedItemsInPage = requests.splice(0, maxPageLimit);
            let expectedExclusiveStartId;
            mockResponse(expectedItemsInPage);
            for await (const { items } of pagination) {
                expect(items).toEqual(expectedItemsInPage);
                // Validate the request for the current iteration page
                validateRequest({ exclusiveStartId: expectedExclusiveStartId, limit: maxPageLimit }, { queueId });
                // Prepare expectations and mock request for the next iteration page
                expectedExclusiveStartId = items[items.length - 1].id;
                expectedItemsInPage = requests.splice(0, maxPageLimit);
                mockResponse(expectedItemsInPage);
            }

            const browserRequests = [{ id: 'aaa' }];
            mockResponse(browserRequests);
            const browserRes = await page.evaluate(async (id, mpl) => {
                const pgn = client.requestQueue(id).paginateRequests({ maxPageLimit: mpl });
                // eslint-disable-next-line no-unreachable-loop
                for await (const browserPage of pgn) {
                    return browserPage;
                }
            }, queueId, maxPageLimit);
            expect(browserRes.items).toEqual(browserRequests);
            validateRequest({ limit: maxPageLimit }, { queueId });
        });
    });
});
