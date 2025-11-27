const { Browser, validateRequest, DEFAULT_OPTIONS } = require('./_helper');
const { ApifyClient } = require('apify-client');
const { mockServer } = require('./mock_server/server');

describe('Dataset methods', () => {
    let baseUrl;
    const browser = new Browser();

    beforeAll(async () => {
        const server = await mockServer.start();
        await browser.start();
        baseUrl = `http://localhost:${server.address().port}`;
    });

    afterAll(async () => {
        await Promise.all([mockServer.close(), browser.cleanUpBrowser()]);
    });

    let client;
    let page;
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
        client = null;
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
            expect(res.id).toEqual('list-datasets');
            validateRequest(opts);

            const browserRes = await page.evaluate((options) => client.datasets().list(options), opts);
            expect(browserRes).toEqual(res);
            validateRequest(opts);
        });

        test('getOrCreate() works without name', async () => {
            const res = await client.datasets().getOrCreate();
            expect(res.id).toEqual('get-or-create-dataset');
            validateRequest();

            const browserRes = await page.evaluate((n) => client.datasets().getOrCreate(n));
            expect(browserRes).toEqual(res);
            validateRequest();
        });

        test('getOrCreate() works with name', async () => {
            const name = 'some-id-2';

            const res = await client.datasets().getOrCreate(name);
            expect(res.id).toEqual('get-or-create-dataset');
            validateRequest({ name });

            const browserRes = await page.evaluate((n) => client.datasets().getOrCreate(n), name);
            expect(browserRes).toEqual(res);
            validateRequest({ name });
        });
    });

    describe('dataset(id)', () => {
        test('get() works', async () => {
            const datasetId = 'some-id';

            const res = await client.dataset(datasetId).get();
            expect(res.id).toEqual('get-dataset');
            validateRequest({}, { datasetId });

            const browserRes = await page.evaluate((id) => client.dataset(id).get(), datasetId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { datasetId });
        });

        test('get() returns undefined on 404 status code (RECORD_NOT_FOUND)', async () => {
            const datasetId = '404';

            const res = await client.dataset(datasetId).get();
            expect(res).toBeUndefined();
            validateRequest({}, { datasetId });

            const browserRes = await page.evaluate((id) => client.dataset(id).get(), datasetId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { datasetId });
        });

        test('delete() works', async () => {
            const datasetId = '204';
            const res = await client.dataset(datasetId).delete();
            expect(res).toBeUndefined();
            validateRequest({}, { datasetId });

            const browserRes = await page.evaluate((id) => client.dataset(id).delete(), datasetId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { datasetId });
        });

        test('update() works', async () => {
            const datasetId = 'some-id';
            const dataset = { name: 'my-name' };

            const res = await client.dataset(datasetId).update(dataset);
            expect(res.id).toEqual('update-dataset');
            validateRequest({}, { datasetId }, dataset);

            const browserRes = await page.evaluate((id, opts) => client.dataset(id).update(opts), datasetId, dataset);
            expect(browserRes).toEqual(res);
            validateRequest({}, { datasetId }, dataset);
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
            validateRequest(query, { datasetId });

            const browserRes = await page.evaluate((id, opts) => client.dataset(id).listItems(opts), datasetId, query);
            expect(browserRes).toEqual(res);
            validateRequest(query, { datasetId });
        });

        test('downloadItems() works with bom=false', async () => {
            const datasetId = 'some-id';
            const body = 'abc';
            const headers = {
                'content-type': 'application/csv; charset=utf-8',
            };
            mockServer.setResponse({ body, headers });
            const qs = { bom: 0, format: 'csv', delimiter: ';', fields: 'a,b', omit: 'c,d' };

            const format = 'csv';
            const options = {
                bom: false,
                fields: ['a', 'b'],
                omit: ['c', 'd'],
                delimiter: ';',
            };

            const res = await client.dataset(datasetId).downloadItems(format, options);
            const resString = res.toString();
            expect(resString).toEqual(body);
            validateRequest(qs, { datasetId });

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
            validateRequest(qs, { datasetId });
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
            validateRequest(qs, { datasetId });

            const browserRes = await page.evaluate((id, opts) => client.dataset(id).listItems(opts), datasetId, qs);
            expect(browserRes).toEqual(res);
            validateRequest(qs, { datasetId });
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
            validateRequest(qs, { datasetId });

            await page.evaluate((id, opts) => client.dataset(id).listItems(opts), datasetId, qs);
            validateRequest(qs, { datasetId });
        });

        test("downloadItems() doesn't parse application/json", async () => {
            const datasetId = 'some-id';
            const body = JSON.stringify({ a: 'foo', b: ['bar1', 'bar2'] });
            const format = 'json';
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
            validateRequest({ format, ...options }, { datasetId });

            const browserRes = await page.evaluate(
                async (id, f, opts) => {
                    /* eslint-disable no-shadow */
                    const res = await client.dataset(id).downloadItems(f, opts);
                    const decoder = new TextDecoder();
                    return decoder.decode(res);
                },
                datasetId,
                format,
                options,
            );
            expect(browserRes).toEqual(resString);
            validateRequest({ format, ...options }, { datasetId });
        });

        test('downloadItems() correctly passes signature', async () => {
            const datasetId = 'some-id';
            const body = JSON.stringify({ a: 'foo', b: ['bar1', 'bar2'] });
            const format = 'json';
            const options = {
                bom: true,
                signature: 'some-signature',
            };
            const headers = {
                contentType: 'application/json; charset=utf-8',
            };

            mockServer.setResponse({ body, headers });

            await client.dataset(datasetId).downloadItems(format, options);
            validateRequest({ format, ...options }, { datasetId });

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
            validateRequest({ format, ...options }, { datasetId });
        });

        test('pushItems() works with object', async () => {
            const datasetId = '201';
            const data = { someData: 'someValue' };

            const res = await client.dataset(datasetId).pushItems(data);
            expect(res).toBeUndefined();
            validateRequest({}, { datasetId }, data);

            const browserRes = await page.evaluate((id, items) => client.dataset(id).pushItems(items), datasetId, data);
            expect(browserRes).toEqual(res);
            validateRequest({}, { datasetId }, data);
        });

        test('pushItems() works with array', async () => {
            const datasetId = '201';
            const data = [{ someData: 'someValue' }, { someData: 'someValue' }];

            const res = await client.dataset(datasetId).pushItems(data);
            expect(res).toBeUndefined();
            validateRequest({}, { datasetId }, data);

            const browserRes = await page.evaluate((id, items) => client.dataset(id).pushItems(items), datasetId, data);
            expect(browserRes).toEqual(res);
            validateRequest({}, { datasetId }, data);
        });

        test('pushItems() works with string', async () => {
            const datasetId = '201';
            const data = JSON.stringify([{ someData: 'someValue' }, { someData: 'someValue' }]);

            const res = await client.dataset(datasetId).pushItems(data);
            expect(res).toBeUndefined();
            validateRequest({}, { datasetId }, JSON.parse(data));

            const browserRes = await page.evaluate(
                (id, options) => client.dataset(id).pushItems(options),
                datasetId,
                data,
            );
            expect(browserRes).toEqual(res);
            validateRequest({}, { datasetId }, JSON.parse(data));
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
            validateRequest({}, { datasetId }, data, expectedHeaders);
        });

        test('statistics() works', async () => {
            const datasetId = 'some-id';

            const res = await client.dataset(datasetId).getStatistics();
            expect(res.id).toEqual('get-statistics');
            validateRequest({}, { datasetId });

            const browserRes = await page.evaluate((id) => client.dataset(id).getStatistics(), datasetId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { datasetId });
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

describe('actor.store.list as async iterable', () => {
    // Test using store().list() as an async iterable
    const client = new ApifyClient();
    const maxItemsPerPage = 1000;

    const range = (start, end, step = 1) => {
        // Inclusive range, ordered based on start and end values
        return Array.from(
            {
                length: Math.abs(end - start) + 1,
            },
            (_, i) => start + Math.sign(end - start) * step * i,
        );
    };

    const testCases = [
        {
            testName: 'No offset, no limit',
            userDefinedOptions: {},
            expectedItems: range(0, 2499),
        },
        {
            testName: 'No offset, user limit',
            userDefinedOptions: { limit: 1100 },
            expectedItems: range(0, 1099),
        },
        {
            testName: 'User offset, no limit',
            userDefinedOptions: { offset: 1000 },
            expectedItems: range(1000, 2499),
        },
        {
            testName: 'User offset, user limit',
            userDefinedOptions: { offset: 1000, limit: 1100 },
            expectedItems: range(1000, 2099),
        },
        {
            testName: 'User offset, user limit, descending',
            userDefinedOptions: { offset: 1000, limit: 1100, desc: true },
            expectedItems: range(1500, 401),
        },
        {
            testName: 'User offset, user limit, descending, unnamed included',
            userDefinedOptions: { offset: 50, limit: 1100, desc: true, unnamed: true },
            expectedItems: range(2550, 1451),
        },
        {
            testName: 'User out of range offset, no limit',
            userDefinedOptions: { offset: 3000 },
            expectedItems: [],
        },
        {
            testName: 'User no offset, out of range limit',
            userDefinedOptions: { limit: 3000 },
            expectedItems: range(0, 2499),
        },
        {
            testName: 'User no offset, out of range limit',
            userDefinedOptions: { limit: 3000 },
            expectedItems: range(0, 2499),
        },
    ];

    test.each(testCases)('$testName', async ({ userDefinedOptions, expectedItems }) => {
        const mockedPlatformLogic = async (request) => {
            // Simulated platform logic for pagination.
            // There are 2500 named items in the collection and additional 100 unnamed items.
            // Items are simple number for easy verification 0..2499 -> named, 2500..2599 -> unnamed

            const namedItems = 2500; // represent named items
            const unnamedItems = 100; // additional unnamed items

            const totalItems = request.params.unnamed ? namedItems + unnamedItems : namedItems;

            const offset = request.params.offset ? request.params.offset : 0;
            const limit = request.params.limit ? request.params.limit : 0;
            const desc = request.params.desc ? request.params.desc : false;

            const items = range(desc ? totalItems : 0, desc ? 0 : totalItems);

            if (offset < 0 || limit < 0) {
                throw new Error('Offset and limit must be non-negative');
            }

            const lowerIndex = Math.min(offset, totalItems);
            const upperIndex = Math.min(offset + (limit || totalItems), totalItems);
            const returnedItemsCount = Math.min(upperIndex - lowerIndex, maxItemsPerPage);

            return {
                data: {
                    data: {
                        total: namedItems,
                        count: returnedItemsCount,
                        offset,
                        limit: returnedItemsCount,
                        desc: false,
                        items: items.slice(lowerIndex, Math.min(upperIndex, lowerIndex + maxItemsPerPage)),
                    },
                },
            };
        };

        const datasetsClient = client.datasets();

        const mockedClient = jest.spyOn(datasetsClient.httpClient, 'call').mockImplementation(mockedPlatformLogic);

        try {
            const totalItems = [];
            for await (const page of datasetsClient.list(userDefinedOptions)) {
                totalItems.push(page);
            }
            expect(totalItems).toEqual(expectedItems);
            expect(mockedClient).toHaveBeenCalledTimes(Math.max(Math.ceil(expectedItems.length / maxItemsPerPage), 1));
        } finally {
            mockedClient.mockRestore();
        }
    });
});
