import type { AddressInfo } from 'node:net';

import type { Dictionary } from 'apify-client';
import { ApifyClient } from 'apify-client';
import type { Request } from 'express';
import type { Page } from 'puppeteer';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest';

import { Browser, DEFAULT_OPTIONS, validateRequest } from './_helper';
import { mockServer } from './mock_server/server';

describe('Request Queue methods', () => {
    let baseUrl: string;
    const browser = new Browser();

    beforeAll(async () => {
        const server = await mockServer.start();
        await browser.start();
        baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
    });

    afterAll(async () => {
        await Promise.all([mockServer.close(), browser.cleanUpBrowser()]);
    });

    let client: ApifyClient;
    let page: Page;
    beforeEach(async () => {
        page = await browser.getInjectedPage(baseUrl, DEFAULT_OPTIONS);
        client = new ApifyClient({
            baseUrl,
            maxRetries: 0,
            ...DEFAULT_OPTIONS,
        });
    });
    afterEach(async () => {
        client = null as unknown as ApifyClient;
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
            validateRequest({ query: opts, path: '/v2/request-queues/' });

            const browserRes = await page.evaluate((options) => client.requestQueues().list(options), opts);
            expect(browserRes).toEqual(res);
            validateRequest({ query: opts });
        });

        test('getOrCreate() works without name', async () => {
            const res = await client.requestQueues().getOrCreate();
            expect(res.id).toEqual('get-or-create-queue');
            validateRequest({});

            const browserRes = await page.evaluate((n) => client.requestQueues().getOrCreate(n), undefined);
            expect(browserRes).toEqual(res);
            validateRequest({});
        });

        test('getOrCreate() works with name', async () => {
            const name = 'some-id-2';

            const res = await client.requestQueues().getOrCreate(name);
            expect(res.id).toEqual('get-or-create-queue');
            validateRequest({ query: { name } });

            const browserRes = await page.evaluate((n) => client.requestQueues().getOrCreate(n), name);
            expect(browserRes).toEqual(res);
            validateRequest({ query: { name } });
        });
    });

    describe('requestQueue(id)', () => {
        test('get() works', async () => {
            const queueId = 'some-id';

            const res = await client.requestQueue(queueId).get();
            expect(res?.id).toEqual('get-queue');
            validateRequest({ query: {}, params: { queueId } });

            const browserRes = await page.evaluate((id) => client.requestQueue(id).get(), queueId);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { queueId } });
        });

        test('get() returns undefined on 404 status code (RECORD_NOT_FOUND)', async () => {
            const queueId = '404';

            const res = await client.requestQueue(queueId).get();
            expect(res).toBeUndefined();
            validateRequest({ query: {}, params: { queueId } });

            const browserRes = await page.evaluate((id) => client.requestQueue(id).get(), queueId);
            expect(browserRes).toBeUndefined();
            validateRequest({ query: {}, params: { queueId } });
        });

        test('delete() works', async () => {
            const queueId = '204';

            const res = await client.requestQueue(queueId).delete();
            expect(res).toBeUndefined();
            validateRequest({ query: {}, params: { queueId } });

            const browserRes = await page.evaluate((id) => client.requestQueue(id).delete(), queueId);
            expect(browserRes).toBeUndefined();
        });

        test('update() works', async () => {
            const queueId = 'some-id';
            const queue = { name: 'my-name' };

            const res = await client.requestQueue(queueId).update(queue);
            expect(res.id).toEqual('update-queue');
            validateRequest({ query: {}, params: { queueId }, body: { name: queue.name } });

            const browserRes = await page.evaluate((id, opts) => client.requestQueue(id).update(opts), queueId, queue);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { queueId }, body: { name: queue.name } });
        });

        test('addRequest() works without forefront param', async () => {
            const queueId = 'some-id';
            const request = { url: 'http://example.com', uniqueKey: 'my-unique-key' };

            const res = await client.requestQueue(queueId).addRequest(request);
            validateRequest({
                query: {},
                params: { queueId },
                body: request,
                path: `/v2/request-queues/${queueId}/requests`,
            });

            const browserRes = await page.evaluate((id, r) => client.requestQueue(id).addRequest(r), queueId, request);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { queueId }, body: request });
        });

        test('addRequest() respects over-ridden timeout', async () => {
            const queueId = 'some-id';
            const request = { url: 'http://example.com', uniqueKey: 'my-unique-key' };
            let errorMessage;
            try {
                await client.requestQueue(queueId, { timeoutSecs: 0.001 }).addRequest(request);
            } catch (e: any) {
                errorMessage = e.toString();
            }
            expect(errorMessage).toEqual('AxiosError: timeout of 1ms exceeded');
        });

        test('addRequest() works with forefront param', async () => {
            const queueId = 'some-id';
            const request = { url: 'http://example.com', uniqueKey: 'my-unique-key' };
            const forefront = true;

            const res = await client.requestQueue(queueId).addRequest(request, { forefront });
            validateRequest({
                query: { forefront },
                params: { queueId },
                body: request,
                path: `/v2/request-queues/${queueId}/requests`,
            });

            const browserRes = await page.evaluate(
                (qId, r) => {
                    return client.requestQueue(qId).addRequest(r, { forefront: true });
                },
                queueId,
                request,
            );
            expect(browserRes).toEqual(res);
            validateRequest({ query: { forefront }, params: { queueId }, body: request });
        });

        test('unlockRequests() works', async () => {
            const queueId = 'some-id';

            const res = await client.requestQueue(queueId).unlockRequests();
            validateRequest({
                query: {},
                params: { queueId },
                path: `/v2/request-queues/${encodeURIComponent(queueId)}/requests/unlock`,
            });

            const browserRes = await page.evaluate((id) => client.requestQueue(id).unlockRequests(), queueId);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { queueId } });
        });

        test('getRequest() works', async () => {
            const queueId = 'some-id';
            const requestId = 'xxx';

            const res = await client.requestQueue(queueId).getRequest(requestId);
            expect(res?.id).toEqual('get-request');
            validateRequest({ query: {}, params: { queueId, requestId } });

            const browserRes = await page.evaluate(
                (qId, rId) => client.requestQueue(qId).getRequest(rId),
                queueId,
                requestId,
            );
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { queueId, requestId } });
        });

        test('getRequest() respects over-ridden timeout', async () => {
            const queueId = 'some-id';
            const requestId = 'xxx';
            let errorMessage;
            try {
                await client.requestQueue(queueId, { timeoutSecs: 0.001 }).getRequest(requestId);
            } catch (e: any) {
                errorMessage = e.toString();
            }
            expect(errorMessage).toEqual('AxiosError: timeout of 1ms exceeded');
        });

        test('deleteRequest() works', async () => {
            const requestId = 'xxx';
            const queueId = '204';

            const res = await client.requestQueue(queueId).deleteRequest(requestId);
            expect(res).toBeUndefined();
            validateRequest({ query: {}, params: { queueId, requestId } });

            const browserRes = await page.evaluate(
                (qId, rId) => client.requestQueue(qId).deleteRequest(rId),
                queueId,
                requestId,
            );
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { queueId, requestId } });
        });

        test('deleteRequest() respects over-ridden timeout', async () => {
            const requestId = 'xxx';
            const queueId = '204';
            let errorMessage;
            try {
                await client.requestQueue(queueId, { timeoutSecs: 0.001 }).deleteRequest(requestId);
            } catch (e: any) {
                errorMessage = e.toString();
            }
            expect(errorMessage).toEqual('AxiosError: timeout of 1ms exceeded');
        });

        test('updateRequest() works with forefront', async () => {
            const queueId = 'some-id';
            const requestId = 'xxx';
            const request = { id: requestId, url: 'http://example.com', uniqueKey: 'my-unique-key' };
            const forefront = true;

            const res = await client.requestQueue(queueId).updateRequest(request, { forefront });
            validateRequest({
                query: { forefront },
                params: { queueId, requestId },
                body: request,
                path: `/v2/request-queues/${queueId}/requests/${requestId}`,
            });

            const browserRes = await page.evaluate(
                (id, r) => {
                    return client.requestQueue(id).updateRequest(r, { forefront: true });
                },
                queueId,
                request,
            );
            expect(browserRes).toEqual(res);
            validateRequest({ query: { forefront }, params: { queueId, requestId }, body: request });
        });

        test('updateRequest() works without forefront', async () => {
            const queueId = 'some-id';
            const requestId = 'xxx';
            const request = { id: requestId, url: 'http://example.com', uniqueKey: 'my-unique-key' };

            const res = await client.requestQueue(queueId).updateRequest(request);
            validateRequest({
                query: {},
                params: { queueId, requestId },
                body: request,
                path: `/v2/request-queues/${queueId}/requests/${requestId}`,
            });

            const browserRes = await page.evaluate(
                (id, r) => {
                    return client.requestQueue(id).updateRequest(r);
                },
                queueId,
                request,
            );
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { queueId, requestId }, body: request });
        });

        test('updateRequest() respects over-ridden timeout', async () => {
            const queueId = 'some-id';
            const requestId = 'xxx';
            const request = { id: requestId, url: 'http://example.com', uniqueKey: 'my-unique-key' };
            let errorMessage;
            try {
                await client.requestQueue(queueId, { timeoutSecs: 0.001 }).updateRequest(request);
            } catch (e: any) {
                errorMessage = e.toString();
            }
            expect(errorMessage).toEqual('AxiosError: timeout of 1ms exceeded');
        });

        test('listHead() works', async () => {
            const queueId = 'some-id';
            const options = { limit: 5 };

            const res = await client.requestQueue(queueId).listHead(options);
            validateRequest({ query: options, params: { queueId }, path: `/v2/request-queues/${queueId}/head` });

            const browserRes = await page.evaluate(
                (id, opts) => client.requestQueue(id).listHead(opts),
                queueId,
                options,
            );
            expect(browserRes).toEqual(res);
            validateRequest({ query: options, params: { queueId } });
        });

        test('listHead() respects over-ridden timeout', async () => {
            const queueId = 'some-id';
            const options = { limit: 5 };
            let errorMessage;
            try {
                await client.requestQueue(queueId, { timeoutSecs: 0.001 }).listHead(options);
            } catch (e: any) {
                errorMessage = e.toString();
            }
            expect(errorMessage).toEqual('AxiosError: timeout of 1ms exceeded');
        });

        test.each(['addRequest', 'updateRequest', 'deleteRequest'] as const)(
            'clientKey param propagates to %s()',
            async (method) => {
                const queueId = 'some-id';
                const requestId = 'xxx';
                const request: { id?: string; url?: string; uniqueKey?: string } = {
                    id: requestId,
                    url: 'http://example.com',
                    uniqueKey: 'my-unique-key',
                };
                const clientKey = 'my-client-key';

                const param = method.startsWith('delete') ? request.id : request;
                if (method.startsWith('add')) delete request.id;

                const queue = client.requestQueue(queueId, { clientKey });
                const res = await queue[method](param);
                validateRequest({ query: { clientKey }, params: { queueId, requestId } });

                const browserRes = await page.evaluate(
                    (id, k, p, m) => {
                        const rq = client.requestQueue(id, { clientKey: k });
                        return rq[m](p);
                    },
                    queueId,
                    clientKey,
                    param,
                    method,
                );
                expect(browserRes).toEqual(res);
                validateRequest({ query: { clientKey }, params: { queueId } });
            },
        );

        test('batchAddRequests() works', async () => {
            const queueId = 'some-id';
            const requestsLength = 1000;
            const requests = new Array(requestsLength)
                .fill(0)
                .map((_, i) => ({ url: `http://example.com/${i}`, uniqueKey: `key-${i}` }));

            await client.requestQueue(queueId).batchAddRequests(requests);
            const firedRequests = mockServer.getLastRequests(requestsLength / 25);
            const processedRequestUrls: string[] = [];
            firedRequests.forEach((req) => {
                expect(req.url).toEqual(`/${queueId}/requests/batch`);
                req.body.forEach(({ url }: { url: string }) => {
                    processedRequestUrls.push(url);
                });
            });
            expect(processedRequestUrls.length).toEqual(requestsLength);
            expect(processedRequestUrls).toEqual(expect.arrayContaining(requests.map((req) => req.url)));
        });

        test('batchAddRequests() propagates forefront', async () => {
            const queueId = 'some-id';
            const options = { forefront: true };
            const requests = new Array(10)
                .fill(0)
                .map((_, i) => ({ url: `http://example.com/${i}`, uniqueKey: `key-${i}` }));

            const res = await client.requestQueue(queueId).batchAddRequests(requests, options);
            validateRequest({ query: options, params: { queueId }, body: requests });

            const browserRes = await page.evaluate(
                (id, req, opts) => {
                    return client.requestQueue(id).batchAddRequests(req, opts);
                },
                queueId,
                requests,
                options,
            );
            expect(browserRes).toEqual(res);
            validateRequest({ query: options, params: { queueId }, body: requests });
        });

        test('batchDeleteRequests() works', async () => {
            const queueId = 'some-id';
            const requests = new Array(10).fill(0).map((_, i) => ({ uniqueKey: `http://example.com/${i}` }));

            const res = await client.requestQueue(queueId).batchDeleteRequests(requests);
            validateRequest({ params: { queueId }, body: requests });

            const browserRes = await page.evaluate(
                (id, req) => {
                    return client.requestQueue(id).batchDeleteRequests(req);
                },
                queueId,
                requests,
            );
            expect(browserRes).toEqual(res);
            validateRequest({ params: { queueId }, body: requests });
        });

        test('listAndLockHead() works', async () => {
            const queueId = 'some-id';
            const options = { limit: 5, lockSecs: 10 };

            // Throw if lockSecs is missing or is not a number
            await expect(client.requestQueue(queueId).listAndLockHead({ limit: 10 } as any)).rejects.toThrow();
            await expect(client.requestQueue(queueId).listAndLockHead({ lockSecs: 'bla' } as any)).rejects.toThrow();

            const res = await client.requestQueue(queueId).listAndLockHead(options);
            validateRequest({ query: options, params: { queueId }, path: `/v2/request-queues/${queueId}/head/lock` });

            const browserRes = await page.evaluate(
                (id, opts) => client.requestQueue(id).listAndLockHead(opts),
                queueId,
                options,
            );
            expect(browserRes).toEqual(res);
            validateRequest({ query: options, params: { queueId } });
        });

        test('prolongRequestLock() works', async () => {
            const queueId = 'some-id';
            const requestId = '123';
            const options = { forefront: true, lockSecs: 10 };

            const res = await client.requestQueue(queueId).prolongRequestLock(requestId, options);
            validateRequest({
                query: options,
                params: { queueId, requestId },
                path: `/v2/request-queues/${queueId}/requests/${requestId}/lock`,
            });

            const browserRes = await page.evaluate(
                (qId, rId, opts) => {
                    return client.requestQueue(qId).prolongRequestLock(rId, opts);
                },
                queueId,
                requestId,
                options,
            );
            expect(browserRes).toEqual(res);
            validateRequest({ query: options, params: { queueId, requestId } });
        });

        test('deleteRequestLock() works', async () => {
            const queueId = 'some-id';
            const requestId = '123';

            const res = await client.requestQueue(queueId).deleteRequestLock(requestId);
            expect(res).toBeUndefined();
            validateRequest({ query: {}, params: { queueId, requestId } });

            const browserRes = await page.evaluate(
                (qId, rId) => {
                    return client.requestQueue(qId).deleteRequestLock(rId);
                },
                queueId,
                requestId,
            );
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { queueId, requestId } });
        });

        test('listRequests() works', async () => {
            const queueId = 'some-id';
            const options = { limit: 5, exclusiveStartId: '123' };

            const res = await client.requestQueue(queueId).listRequests(options);
            validateRequest({ query: options, params: { queueId }, path: `/v2/request-queues/${queueId}/requests` });

            const browserRes = await page.evaluate(
                (id, opts) => client.requestQueue(id).listRequests(opts),
                queueId,
                options,
            );
            expect(browserRes).toEqual(res);
            validateRequest({ query: options, params: { queueId } });
        });

        test('paginateRequests() works', async () => {
            const queueId = 'some-id';
            const maxPageLimit = 90;
            const requests = new Array(1000).fill(0).map((_, i) => ({ id: i.toString() }));
            const mockResponse = (items: Dictionary<any>[]) => {
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
                validateRequest({
                    query: { exclusiveStartId: expectedExclusiveStartId, limit: maxPageLimit },
                    params: { queueId },
                });
                // Prepare expectations and mock request for the next iteration page
                expectedExclusiveStartId = items[items.length - 1].id;
                expectedItemsInPage = requests.splice(0, maxPageLimit);
                mockResponse(expectedItemsInPage);
            }

            const browserRequests = [{ id: 'aaa' }];
            mockResponse(browserRequests);
            const browserRes = await page.evaluate(
                async (id, mpl) => {
                    const pgn = client.requestQueue(id).paginateRequests({ maxPageLimit: mpl });
                    // eslint-disable-next-line no-unreachable-loop
                    for await (const browserPage of pgn) {
                        return browserPage;
                    }
                    return undefined;
                },
                queueId,
                maxPageLimit,
            );
            expect(browserRes?.items).toEqual(browserRequests);
            validateRequest({ query: { limit: maxPageLimit }, params: { queueId } });
        });

        // NOTE: This test needs to be last otherwise it will break other tests
        test('batchAddRequests() chunks large payload', async () => {
            const queueId = 'some-id';
            const requestsLength = 30;
            const longString = 'a'.repeat(940_000);
            const requests = new Array(requestsLength)
                .fill(0)
                .map((_, i) => ({ url: `http://example.com/${i}`, userData: { longString }, uniqueKey: `key-${i}` }));

            await client.requestQueue(queueId).batchAddRequests(requests);
            // Based on size of one request and limit 9MB as max payload size only 10 requests should be sent in one batch
            const firedRequests = mockServer.getLastRequests(requestsLength / 10);
            const processedRequestUrls: string[] = [];
            firedRequests.forEach((req: Request) => {
                expect(req.url).toEqual(`/${queueId}/requests/batch`);
                req.body.forEach(({ url }: { url: string }) => {
                    processedRequestUrls.push(url);
                });
            });
            expect(processedRequestUrls.length).toEqual(requestsLength);
            expect(processedRequestUrls).toEqual(expect.arrayContaining(requests.map((req) => req.url)));

            // It throws error when single request is too big
            const bigRequest = {
                url: `http://example.com/x`,
                userData: { longString: 'b'.repeat(9_500_000) },
                uniqueKey: 'key-big',
            };
            const requestsWithBigRequest: typeof requests = [...requests, bigRequest];
            await expect(client.requestQueue(queueId).batchAddRequests(requestsWithBigRequest)).rejects.toThrow(
                `RequestQueueClient.batchAddRequests: The size of the request with index: ${requestsWithBigRequest.length - 1}`,
            );
            validateRequest({ query: {}, params: { queueId }, body: false });
        });
    });
});
