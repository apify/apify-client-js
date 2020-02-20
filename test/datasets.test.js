import sinon from 'sinon';
import * as utils from '../build/utils';
import { parseDatasetItemsResponse, RETRIES, BACKOFF_MILLIS } from '../build/datasets';

import ApifyClient from '../build';
import mockServer from './mock_server/server';
import { cleanUpBrowser, getInjectedPage, validateRequest, DEFAULT_QUERY } from './_helper';

describe('Dataset methods', () => {
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
        test.skip('should work with datasetId in default params', async () => {
            const datasetId = 'some-id-2';
            const options = {
                baseUrl,
                expBackoffMaxRepeats: 0,
                expBackoffMillis: 1,
                datasetId,
            };
            const newClient = new ApifyClient(options);

            const res = await newClient.datasets.getDataset();
            expect(res.id).toEqual('create-actor');
            validateRequest({}, {});
        });

        test('should work with datasetId in method call params', async () => {
            const datasetId = 'some-id-3';


            const res = await client.datasets.getDataset({ datasetId });
            expect(res.id).toEqual('get-dataset');
            validateRequest({ }, { datasetId });

            const browserRes = await page.evaluate(options => client.datasets.getDataset(options), { datasetId });
            expect(browserRes).toEqual(res);
            validateRequest({}, { datasetId });
        });

        test('should work with token and datasetName', async () => {
            const query = {
                datasetName: 'some-id-2',
                token: 'token',
            };

            const res = await client.datasets.getOrCreateDataset(query);
            expect(res.id).toEqual('get-or-create-dataset');
            validateRequest({ token: query.token, name: query.datasetName }, {});

            const browserRes = await page.evaluate(options => client.datasets.getOrCreateDataset(options), query);
            expect(browserRes).toEqual(res);
            validateRequest({ token: query.token, name: query.datasetName }, {});
        });
    });

    describe('REST method', () => {
        test('listDatasets() works', async () => {
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

            const res = await client.datasets.listDatasets(callOptions);
            expect(res.id).toEqual('list-datasets');
            validateRequest(queryString);

            const browserRes = await page.evaluate(options => client.datasets.listDatasets(options), callOptions);
            expect(browserRes).toEqual(res);
            validateRequest(queryString);
        });

        test('getDataset() works', async () => {
            const datasetId = 'some-id';

            const res = await client.datasets.getDataset({ datasetId });
            expect(res.id).toEqual('get-dataset');
            validateRequest({}, { datasetId });

            const browserRes = await page.evaluate(options => client.datasets.getDataset(options), { datasetId });
            expect(browserRes).toEqual(res);
            validateRequest({}, { datasetId });
        });

        test(
            'getDataset() returns null on 404 status code (RECORD_NOT_FOUND)',
            async () => {
                const datasetId = '404';

                const res = await client.datasets.getDataset({ datasetId });
                expect(res).toEqual(null);
                validateRequest({}, { datasetId });

                const browserRes = await page.evaluate(options => client.datasets.getDataset(options), { datasetId });
                expect(browserRes).toEqual(res);
                validateRequest({}, { datasetId });
            },
        );

        test('deleteDataset() works', async () => {
            const datasetId = '204';
            const res = await client.datasets.deleteDataset({ datasetId });
            expect(res).toEqual('');
            validateRequest({}, { datasetId });

            const browserRes = await page.evaluate(options => client.datasets.deleteDataset(options), { datasetId });
            expect(browserRes).toEqual(res);
            validateRequest({}, { datasetId });
        });

        test('updateDataset() works', async () => {
            const datasetId = 'some-id';
            const dataset = { id: datasetId, name: 'my-name' };

            const res = await client.datasets.updateDataset({ datasetId, dataset });
            expect(res.id).toEqual('update-dataset');
            validateRequest({}, { datasetId }, { name: dataset.name });

            const browserRes = await page.evaluate(opts => client.datasets.updateDataset(opts), { datasetId, dataset });
            expect(browserRes).toEqual(res);
            validateRequest({}, { datasetId }, { name: dataset.name });
        });

        test('getItems() works', async () => {
            const datasetId = 'some-id';
            const expected = {
                total: 0,
                offset: 0,
                count: 0,
                limit: 100000,
                items: [],
            };
            const headers = {
                'content-type': 'application/json; chartset=utf-8',
                'x-apify-pagination-total': '0',
                'x-apify-pagination-offset': '0',
                'x-apify-pagination-count': '0',
                'x-apify-pagination-limit': '100000',
            };
            mockServer.setResponse({ body: {}, headers });


            const res = await client.datasets.getItems({ datasetId });
            expect(res.toString()).toEqual(expected.toString());
            validateRequest({}, { datasetId }, {});

            const browserRes = await page.evaluate(options => client.datasets.getItems(options), { datasetId });
            expect(browserRes).toEqual(res);
            validateRequest({}, { datasetId }, {});
        });

        test('getItems() works with bom=false', async () => {
            const datasetId = 'some-id';
            const expected = {
                total: 0,
                offset: 0,
                count: 0,
                limit: 100000,
                items: [],
            };
            const headers = {
                'content-type': 'application/json; chartset=utf-8',
                'x-apify-pagination-total': '0',
                'x-apify-pagination-offset': '0',
                'x-apify-pagination-count': '0',
                'x-apify-pagination-limit': '100000',
            };
            mockServer.setResponse({ body: {}, headers });
            const qs = { bom: 0, format: 'csv', delimiter: ';', fields: 'a,b', omit: 'c,d' };

            const options = {
                datasetId,
                bom: false,
                fields: ['a', 'b'],
                omit: ['c', 'd'],
                format: 'csv',
                delimiter: ';',
            };


            const res = await client.datasets.getItems(options);
            expect(res.toString()).toEqual(expected.toString());
            validateRequest(qs, { datasetId }, {});

            const browserRes = await page.evaluate(opts => client.datasets.getItems(opts), { datasetId });
            expect(browserRes).toEqual(res);
            validateRequest({}, { datasetId }, {});
        });

        describe('getDatasetItems()', () => {
            const message = 'CUSTOM ERROR';

            test('parseDatasetItemsResponse() should rethrow errors', async () => {
                const response = {
                    headers: {
                        'content-type': 'application/json',
                    },
                    body: {

                    },
                };
                const stub = sinon.stub(utils, 'parseBody');
                stub.callsFake(() => {
                    throw new Error(message);
                });
                let error;
                try {
                    parseDatasetItemsResponse(response, false, (e) => { throw e; });
                } catch (e) {
                    error = e;
                }
                expect(error instanceof Error).toEqual(true);
                expect(error.message).toEqual(message);
                utils.parseBody.restore();
            });
        });

        test('getItems should retry with exponentialBackoff', async () => {
            const datasetId = 'some-id';
            const originalRetry = utils.retryWithExpBackoff;
            const stub = sinon.stub(utils, 'retryWithExpBackoff');
            let firstCall;
            stub.callsFake((func, opts) => {
                if (!firstCall) firstCall = { func, opts };
                return originalRetry;
            });
            await client.datasets.getItems({ datasetId, limit: 1, offset: 1 });
            expect(typeof firstCall.func).toEqual('function');
            expect(firstCall.opts.retry).toEqual(RETRIES);
            expect(firstCall.opts.minTimeout).toEqual(BACKOFF_MILLIS);
            stub.restore();
        });

        test('getItems() limit and offset work', async () => {
            const datasetId = 'some-id';
            const body = [{ test: 'value' }];
            const expected = {
                total: 1,
                offset: 1,
                count: 1,
                limit: 1,
                items: body,
            };
            const headers = {
                'content-type': 'application/json; chartset=utf-8',
                'x-apify-pagination-total': '1',
                'x-apify-pagination-offset': '1',
                'x-apify-pagination-count': '1',
                'x-apify-pagination-limit': '1',
            };
            const qs = { limit: 1, offset: 1 };
            mockServer.setResponse({ body, headers });

            const res = await client.datasets.getItems({ datasetId, limit: 1, offset: 1 });
            expect(res.toString()).toEqual(expected.toString());
            validateRequest(qs, { datasetId });

            const browserRes = await page.evaluate(options => client.datasets.getItems(options), { datasetId, limit: 1, offset: 1 });
            expect(browserRes).toEqual(res);
            validateRequest(qs, { datasetId });
        });

        test('getItems() parses JSON', async () => {
            const datasetId = 'some-id';
            const body = JSON.stringify([{ a: 'foo', b: ['bar1', 'bar2'] }]);
            const contentType = 'application/json';
            const expected = {
                total: 1,
                offset: 0,
                count: 1,
                limit: 100000,
                items: JSON.parse(body),
            };
            const headers = {
                'content-type': contentType,
                'x-apify-pagination-total': '1',
                'x-apify-pagination-offset': '0',
                'x-apify-pagination-count': '1',
                'x-apify-pagination-limit': '100000',
            };
            mockServer.setResponse({ body: expected.items, headers });

            const res = await client.datasets.getItems({ datasetId });
            expect(res.toString()).toEqual(expected.toString());
            validateRequest({}, { datasetId });

            const browserRes = await page.evaluate(options => client.datasets.getItems(options), { datasetId });
            expect(browserRes).toEqual(res);
            validateRequest({}, { datasetId });
        });

        test(
            'getItems() doesn\'t parse application/json when disableBodyParser = true',
            async () => {
                const datasetId = 'some-id';
                const body = JSON.stringify({ a: 'foo', b: ['bar1', 'bar2'] });
                const contentType = 'application/json';
                const expected = {
                    total: 1,
                    offset: 0,
                    count: 1,
                    limit: 100000,
                    items: body,
                };
                const headers = {
                    'content-type': contentType,
                    'x-apify-pagination-total': '1',
                    'x-apify-pagination-offset': '0',
                    'x-apify-pagination-count': '1',
                    'x-apify-pagination-limit': '100000',
                };
                mockServer.setResponse({ body: expected.items, headers });

                const res = await client.datasets.getItems({ datasetId });
                expect(res.toString()).toEqual(expected.toString());
                validateRequest({}, { datasetId });

                const browserRes = await page.evaluate(options => client.datasets.getItems(options), { datasetId });
                expect(browserRes).toEqual(res);
                validateRequest({}, { datasetId });
            },
        );

        test('putItems() works with object', async () => {
            const datasetId = '201';
            const contentType = 'application/json; charset=utf-8';
            const data = { someData: 'someValue' };
            const headers = {
                'content-type': contentType,
                'content-encoding': 'gzip',
            };

            const res = await client.datasets.putItems({ datasetId, data });
            expect(res.toString()).toEqual('{}');
            validateRequest({}, { datasetId }, data, headers);

            const browserRes = await page.evaluate(options => client.datasets.putItems(options), { datasetId, data });
            expect(browserRes).toEqual(res);
            validateRequest({}, { datasetId }, data);
        });

        test('putItems() works with array', async () => {
            const datasetId = '201';
            const contentType = 'application/json; charset=utf-8';
            const data = [{ someData: 'someValue' }, { someData: 'someValue' }];
            const headers = {
                'content-type': contentType,
                'content-encoding': 'gzip',
            };

            const res = await client.datasets.putItems({ datasetId, data });
            expect(res.toString()).toEqual('{}');
            validateRequest({}, { datasetId }, data, headers);

            const browserRes = await page.evaluate(options => client.datasets.putItems(options), { datasetId, data });
            expect(browserRes).toEqual(res);
            validateRequest({}, { datasetId }, data);
        });

        test('putItems() works with string', async () => {
            const datasetId = '201';
            const contentType = 'application/json; charset=utf-8';
            const data = JSON.stringify([{ someData: 'someValue' }, { someData: 'someValue' }]);
            const headers = {
                'content-type': contentType,
                'content-encoding': 'gzip',
            };

            const res = await client.datasets.putItems({ datasetId, data });
            expect(res.toString()).toEqual('{}');
            validateRequest({}, { datasetId }, JSON.parse(data), headers);

            const browserRes = await page.evaluate(options => client.datasets.putItems(options), { datasetId, data });
            expect(browserRes).toEqual(res);
            validateRequest({}, { datasetId }, JSON.parse(data));
        });
    });
});
