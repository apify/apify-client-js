import type { AddressInfo } from 'node:net';

import { ApifyClient, DownloadItemsFormat } from 'apify-client';
import type { Page } from 'puppeteer';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, test } from 'vitest';

import { Browser, DEFAULT_OPTIONS, validateRequest } from './_helper';
import { mockServer } from './mock_server/server';

describe('Dataset methods', () => {
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
        // Navigate to localhost address to ensure secure context e.g. for Web Crypto API
        page = await browser.getInjectedPage(baseUrl, DEFAULT_OPTIONS, baseUrl);
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

    describe('datasets()', () => {
        test('list() works', async () => {
            const opts = {
                limit: 5,
                offset: 3,
                desc: true,
                unnamed: true,
            };

            const res = await client.datasets().list(opts);
            validateRequest({ query: opts, path: '/v2/datasets/' });

            const browserRes = await page.evaluate((options) => client.datasets().list(options), opts);
            expect(browserRes).toEqual(res);
            validateRequest({ query: opts });
        });

        test('getOrCreate() works without name', async () => {
            const res = await client.datasets().getOrCreate();
            validateRequest({ path: '/v2/datasets/' });

            const browserRes = await page.evaluate((n) => client.datasets().getOrCreate(n), undefined);
            expect(browserRes).toEqual(res);
            validateRequest({});
        });

        test('getOrCreate() works with name', async () => {
            const name = 'some-id-2';

            const res = await client.datasets().getOrCreate(name);
            expect(res.id).toEqual('get-or-create-dataset');
            validateRequest({ query: { name }, path: '/v2/datasets/' });

            const browserRes = await page.evaluate((n) => client.datasets().getOrCreate(n), name);
            expect(browserRes).toEqual(res);
            validateRequest({ query: { name }, path: '/v2/datasets/' });
        });
    });

    describe('dataset(id)', () => {
        test('get() works', async () => {
            const datasetId = 'some-id';

            const res = await client.dataset(datasetId).get();
            validateRequest({
                query: {},
                params: { datasetId },
                path: `/v2/datasets/${encodeURIComponent(datasetId)}`,
            });

            const browserRes = await page.evaluate((id) => client.dataset(id).get(), datasetId);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { datasetId } });
        });

        test('get() returns undefined on 404 status code (RECORD_NOT_FOUND)', async () => {
            const datasetId = '404';

            const res = await client.dataset(datasetId).get();
            expect(res).toBeUndefined();
            validateRequest({ query: {}, params: { datasetId } });

            const browserRes = await page.evaluate((id) => client.dataset(id).get(), datasetId);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { datasetId } });
        });

        test('delete() works', async () => {
            const datasetId = '204';
            const res = await client.dataset(datasetId).delete();
            expect(res).toBeUndefined();
            validateRequest({ query: {}, params: { datasetId } });

            const browserRes = await page.evaluate((id) => client.dataset(id).delete(), datasetId);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { datasetId } });
        });

        test('update() works', async () => {
            const datasetId = 'some-id';
            const dataset = { name: 'my-name' };

            const res = await client.dataset(datasetId).update(dataset);
            expect(res.id).toEqual('update-dataset');
            validateRequest({ query: {}, params: { datasetId }, body: dataset });

            const browserRes = await page.evaluate((id, opts) => client.dataset(id).update(opts), datasetId, dataset);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { datasetId }, body: dataset });
        });

        test('listItems() works', async () => {
            const datasetId = 'some-id';
            const expected = {
                total: 0,
                offset: 0,
                count: 0,
                limit: 100000,
                desc: false,
                items: [],
            };
            const query = {
                fields: ['one', 'two'],
                omit: ['x'],
                desc: true,
            };
            const responseHeaders = {
                'content-type': 'application/json; chartset=utf-8',
                'x-apify-pagination-total': '0',
                'x-apify-pagination-offset': '0',
                'x-apify-pagination-count': '1', // wrong on purpose to check that it's not used
                'x-apify-pagination-limit': '100000',
                // TODO: https://github.com/apify/apify-core/issues/3503
                'x-apify-pagination-desc': false,
            };
            mockServer.setResponse({ body: [], headers: responseHeaders });

            const res = await client.dataset(datasetId).listItems(query);
            expect(res).toEqual(expected);
            validateRequest({ query, params: { datasetId } });

            const browserRes = await page.evaluate((id, opts) => client.dataset(id).listItems(opts), datasetId, query);
            expect(browserRes).toEqual(res);
            validateRequest({ query, params: { datasetId } });
        });

        test('downloadItems() works with bom=false', async () => {
            const datasetId = 'some-id';
            const body = 'abc';
            const headers = {
                'content-type': 'application/csv; charset=utf-8',
            };
            mockServer.setResponse({ body, headers });
            const qs = { bom: 0, format: 'csv', delimiter: ';', fields: 'a,b', omit: 'c,d' };

            const format = DownloadItemsFormat.CSV;
            const options = {
                bom: false,
                fields: ['a', 'b'],
                omit: ['c', 'd'],
                delimiter: ';',
            };

            const res = await client.dataset(datasetId).downloadItems(format, options);
            const resString = res.toString();
            expect(resString).toEqual(body);
            validateRequest({ query: qs, params: { datasetId } });

            const browserRes = await page.evaluate(
                async (dId, f, opts) => {
                    const response = await client.dataset(dId).downloadItems(f, opts);
                    const decoder = new TextDecoder();
                    return decoder.decode(response);
                },
                datasetId,
                format,
                options,
            );
            expect(browserRes).toEqual(resString);
            validateRequest({ query: qs, params: { datasetId } });
        });

        test('listItems() limit and offset work', async () => {
            const datasetId = 'some-id';
            const body = [{ test: 'value' }];
            const expected = {
                total: 1,
                offset: 1,
                count: 1,
                limit: 1,
                desc: false,
                items: body,
            };
            const headers = {
                'content-type': 'application/json; chartset=utf-8',
                'x-apify-pagination-total': '1',
                'x-apify-pagination-offset': '1',
                'x-apify-pagination-count': '0',
                'x-apify-pagination-limit': '1',
                // TODO: https://github.com/apify/apify-core/issues/3503
                'x-apify-pagination-desc': false,
            };
            const qs = { limit: 1, offset: 1 };
            mockServer.setResponse({ body, headers });

            const res = await client.dataset(datasetId).listItems(qs);
            expect(res).toEqual(expected);
            validateRequest({ query: qs, params: { datasetId } });

            const browserRes = await page.evaluate((id, opts) => client.dataset(id).listItems(opts), datasetId, qs);
            expect(browserRes).toEqual(res);
            validateRequest({ query: qs, params: { datasetId } });
        });

        test('listItems() correctly passes signature', async () => {
            const datasetId = 'some-id';
            const body = [{ test: 'value' }];
            const headers = {
                'content-type': 'application/json; chartset=utf-8',
                'x-apify-pagination-total': '1',
                'x-apify-pagination-offset': '1',
                'x-apify-pagination-count': '0',
                'x-apify-pagination-limit': '1',
                // TODO: https://github.com/apify/apify-core/issues/3503
                'x-apify-pagination-desc': false,
            };
            const qs = { limit: 1, offset: 1, signature: 'some-signature' };
            mockServer.setResponse({ body, headers });

            await client.dataset(datasetId).listItems(qs);
            validateRequest({ query: qs, params: { datasetId } });

            await page.evaluate((id, opts) => client.dataset(id).listItems(opts), datasetId, qs);
            validateRequest({ query: qs, params: { datasetId } });
        });

        test("downloadItems() doesn't parse application/json", async () => {
            const datasetId = 'some-id';
            const body = JSON.stringify({ a: 'foo', b: ['bar1', 'bar2'] });
            const format = DownloadItemsFormat.JSON;
            const options = {
                bom: true,
            };
            const headers = {
                contentType: 'application/json; charset=utf-8',
            };

            mockServer.setResponse({ body, headers });

            const res = await client.dataset(datasetId).downloadItems(format, options);
            expect(res).toBeInstanceOf(Buffer);
            const resString = res.toString('utf-8');
            expect(resString).toBe(body);
            validateRequest({ query: { format, ...options }, params: { datasetId } });

            const browserRes = await page.evaluate(
                async (id, f, opts) => {
                    const res = await client.dataset(id).downloadItems(f, opts);
                    const decoder = new TextDecoder();
                    return decoder.decode(res);
                },
                datasetId,
                format,
                options,
            );
            expect(browserRes).toEqual(resString);
            validateRequest({ query: { format, ...options }, params: { datasetId } });
        });

        test('downloadItems() correctly passes signature', async () => {
            const datasetId = 'some-id';
            const body = JSON.stringify({ a: 'foo', b: ['bar1', 'bar2'] });
            const format = DownloadItemsFormat.JSON;
            const options = {
                bom: true,
                signature: 'some-signature',
            };
            const headers = {
                contentType: 'application/json; charset=utf-8',
            };

            mockServer.setResponse({ body, headers });

            await client.dataset(datasetId).downloadItems(format, options);
            validateRequest({ query: { format, ...options }, params: { datasetId } });

            await page.evaluate(
                async (id, f, opts) => {
                    const res = await client.dataset(id).downloadItems(f, opts);
                    const decoder = new TextDecoder();
                    return decoder.decode(res);
                },
                datasetId,
                format,
                options,
            );
            validateRequest({ query: { format, ...options }, params: { datasetId } });
        });

        test('pushItems() works with object', async () => {
            const datasetId = '201';
            const data = { someData: 'someValue' };

            const res = await client.dataset(datasetId).pushItems(data);
            expect(res).toBeUndefined();
            validateRequest({ query: {}, params: { datasetId }, body: data });

            const browserRes = await page.evaluate((id, items) => client.dataset(id).pushItems(items), datasetId, data);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { datasetId }, body: data });
        });

        test('pushItems() works with array', async () => {
            const datasetId = '201';
            const data = [{ someData: 'someValue' }, { someData: 'someValue' }];

            const res = await client.dataset(datasetId).pushItems(data);
            expect(res).toBeUndefined();
            validateRequest({ query: {}, params: { datasetId }, body: data });

            const browserRes = await page.evaluate((id, items) => client.dataset(id).pushItems(items), datasetId, data);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { datasetId }, body: data });
        });

        test('pushItems() works with string', async () => {
            const datasetId = '201';
            const data = JSON.stringify([{ someData: 'someValue' }, { someData: 'someValue' }]);

            const res = await client.dataset(datasetId).pushItems(data);
            expect(res).toBeUndefined();
            validateRequest({ params: { datasetId }, body: JSON.parse(data) });

            const browserRes = await page.evaluate(
                (id, options) => client.dataset(id).pushItems(options),
                datasetId,
                data,
            );
            expect(browserRes).toEqual(res);
            validateRequest({ params: { datasetId }, body: JSON.parse(data) });
        });

        test('pushItems() compresses large request in Node.js', async () => {
            const datasetId = '201';
            const chunk = { someData: 'someValue' };
            const data = Array(200).fill(chunk);

            const expectedHeaders = {
                'content-type': 'application/json; charset=utf-8',
                'content-encoding': 'gzip',
            };

            const res = await client.dataset(datasetId).pushItems(data);
            expect(res).toBeUndefined();
            validateRequest({ params: { datasetId }, body: data, additionalHeaders: expectedHeaders });
        });

        test('statistics() works', async () => {
            const datasetId = 'some-id';

            const res = await client.dataset(datasetId).getStatistics();
            validateRequest({
                query: {},
                params: { datasetId },
                path: `/v2/datasets/${encodeURIComponent(datasetId)}/statistics`,
            });

            const browserRes = await page.evaluate((id) => client.dataset(id).getStatistics(), datasetId);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { datasetId } });
        });

        describe('createItemsPublicUrl()', () => {
            it.each([
                ['https://custom.public.url/', 'custom.public.url'],
                [undefined, 'api.apify.com'],
            ])('respects publicBaseUrl client option (%s)', async (publicBaseUrl, expectedHostname) => {
                const datasetId = 'dataset-id';
                client = new ApifyClient({
                    baseUrl,
                    publicBaseUrl,
                    ...DEFAULT_OPTIONS,
                });

                const res = await client.dataset(datasetId).createItemsPublicUrl();

                const url = new URL(res);
                expect(url.hostname).toBe(expectedHostname);
                expect(url.pathname).toBe(`/v2/datasets/${datasetId}/items`);
            });

            it('should include a signature in the URL when the caller has permission to access the signing secret key', async () => {
                const datasetId = 'id-with-secret-key';
                const res = await client.dataset(datasetId).createItemsPublicUrl();

                const url = new URL(res);
                expect(url.searchParams.get('signature')).toBeDefined();
                expect(url.pathname).toBe(`/v2/datasets/${datasetId}/items`);

                const browserRes = await page.evaluate((id) => client.dataset(id).createItemsPublicUrl(), datasetId);
                expect(browserRes).toEqual(res);
            });

            it('should not include a signature in the URL when the caller lacks permission to access the signing secret key', async () => {
                const datasetId = 'some-id';
                const res = await client.dataset(datasetId).createItemsPublicUrl();

                const url = new URL(res);
                expect(url.searchParams.get('signature')).toBeNull();
                expect(url.pathname).toBe(`/v2/datasets/${datasetId}/items`);

                const browserRes = await page.evaluate((id) => client.dataset(id).createItemsPublicUrl(), datasetId);
                expect(browserRes).toEqual(res);
            });

            it('includes provided options (e.g., limit and prefix) as query parameters', async () => {
                const datasetId = 'id-with-secret-key';
                const res = await client.dataset(datasetId).createItemsPublicUrl({ desc: true, limit: 10, offset: 5 });
                const itemsPublicUrl = new URL(res);

                expect(itemsPublicUrl.searchParams.get('desc')).toBe('true');
                expect(itemsPublicUrl.searchParams.get('limit')).toBe('10');
                expect(itemsPublicUrl.searchParams.get('offset')).toBe('5');
                expect(itemsPublicUrl.searchParams.get('signature')).toBeDefined();
                expect(itemsPublicUrl.pathname).toBe(`/v2/datasets/${datasetId}/items`);
            });
        });
    });
});
