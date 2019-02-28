import { expect } from 'chai';
import { gzipSync } from 'zlib';
import sinon from 'sinon';
import * as exponentialBackoff from 'apify-shared/exponential_backoff';
import ApifyClient from '../build';
import { mockRequest, requestExpectCall, requestExpectErrorCall, restoreRequest } from './_helper';
import * as utils from '../build/utils';
import { getDatasetItems, parseDatasetItemsResponse, BASE_PATH } from '../build/datasets';
import ApifyClientError, { NOT_FOUND_STATUS_CODE } from '../src/apify_error';

const BASE_URL = 'http://example.com/something';
const OPTIONS = { baseUrl: BASE_URL };

describe('Dataset', () => {
    before(mockRequest);
    after(restoreRequest);

    describe('indentification', () => {
        it('should work with datasetId in default params', () => {
            const datasetId = 'some-id-2';

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${datasetId}`,
                qs: {},
            }, {
                data: {
                    id: datasetId,
                },
            });

            const apifyClient = new ApifyClient(Object.assign({}, OPTIONS, { datasetId }));

            return apifyClient
                .datasets
                .getDataset()
                .then((dataset) => {
                    expect(dataset.id).to.be.eql(datasetId);
                });
        });

        it('should work with datasetId in method call params', () => {
            const datasetId = 'some-id-3';

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${datasetId}`,
                qs: {},
            }, {
                data: {
                    id: datasetId,
                },
            });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .datasets
                .getDataset({ datasetId })
                .then((dataset) => {
                    expect(dataset.id).to.be.eql(datasetId);
                });
        });

        it('should work with token and datasetName', () => {
            const datasetId = 'some-id-4';
            const datasetOptions = {
                token: 'sometoken',
                datasetName: 'somename',
            };

            requestExpectCall({
                json: true,
                method: 'POST',
                url: `${BASE_URL}${BASE_PATH}`,
                qs: { name: datasetOptions.datasetName, token: datasetOptions.token },
            }, {
                data: {
                    id: datasetId,
                },
            });

            const apifyClient = new ApifyClient(Object.assign({}, OPTIONS, { datasetId }));

            return apifyClient
                .datasets
                .getOrCreateDataset(datasetOptions)
                .then(dataset => expect(dataset.id).to.be.eql(datasetId));
        });
    });

    describe('REST method', () => {
        it('listDatasets() works', () => {
            const datasetId = 'some-id';
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
                items: ['store1', 'store2'],
            };

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}`,
                qs: queryString,
            }, {
                data: expected,
            });

            const apifyClient = new ApifyClient(Object.assign({}, OPTIONS, { datasetId }));

            return apifyClient
                .datasets
                .listDatasets(callOptions)
                .then(response => expect(response).to.be.eql(expected));
        });

        it('getDataset() works', () => {
            const datasetId = 'some-id';
            const expected = { _id: 'some-id', aaa: 'bbb' };

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${datasetId}`,
                qs: {},
            }, { data: expected });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .datasets
                .getDataset({ datasetId })
                .then(given => expect(given).to.be.eql(expected));
        });

        it('getDataset() returns null on 404 status code (RECORD_NOT_FOUND)', () => {
            const datasetId = 'some-id';

            requestExpectErrorCall({
                json: true,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${datasetId}`,
                qs: {},
            }, false, 404);

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .datasets
                .getDataset({ datasetId })
                .then(given => expect(given).to.be.eql(null));
        });

        it('deleteDataset() works', () => {
            const datasetId = 'some-id';
            const token = 'my-token';

            requestExpectCall({
                json: true,
                method: 'DELETE',
                url: `${BASE_URL}${BASE_PATH}/${datasetId}`,
                qs: { token },
            });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .datasets
                .deleteDataset({ datasetId, token });
        });

        it('getItems() works', () => {
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

            requestExpectCall({
                json: false,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${datasetId}/items`,
                gzip: true,
                qs: {},
                resolveWithFullResponse: true,
                encoding: null,
            }, JSON.stringify(expected.items), { headers });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .datasets
                .getItems({ datasetId })
                .then(given => expect(given).to.be.eql(expected));
        });

        describe('getDatasetItems()', () => {
            const message = 'CUSTOM ERROR';
            it('getDatasetItems() should return null for 404', async () => {
                const requestPromise = () => {
                    throw new ApifyClientError('NOTFOUND', 'Not found', { statusCode: NOT_FOUND_STATUS_CODE });
                };

                const data = await getDatasetItems(requestPromise);
                expect(data).to.eql(null);
            });

            it('parseDatasetItemsResponse() should rethrow errors', async () => {
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
                    parseDatasetItemsResponse(response, false);
                } catch (e) {
                    error = e;
                }
                expect(error instanceof Error).to.be.eql(true);
                expect(error.message).to.be.eql(message);
                utils.parseBody.restore();
            });

            it('parseDatasetItemsResponse() should throw RetryableError if  Unexpected end of JSON input', async () => {
                const response = {
                    headers: {
                        'content-type': 'application/json',
                    },
                    body: {

                    },
                };
                const stub = sinon.stub(utils, 'parseBody');
                stub.callsFake(() => {
                    throw new Error('Unexpected end of JSON input');
                });
                let error;
                try {
                    parseDatasetItemsResponse(response, false);
                } catch (e) {
                    error = e;
                }
                expect(error instanceof exponentialBackoff.RetryableError).to.be.eql(true);
                expect(error.error.message).to.be.eql('Unexpected end of JSON input');
                utils.parseBody.restore();
            });
        });

        it('getItems should retry with exponentialBackoff', async () => {
            const datasetId = 'some-id';
            let run = false;
            const stub = sinon.stub(utils, 'parseBody');
            const stubRetryWithExpBackoff = sinon.stub(exponentialBackoff, 'retryWithExpBackoff');
            stub.callsFake(() => {
                throw new exponentialBackoff.RetryableError(new Error(message));
            });
            stubRetryWithExpBackoff.callsFake(() => {
                run = true;
            });
            const apifyClient = new ApifyClient(OPTIONS);
            await apifyClient.datasets.getItems({ datasetId, limit: 1, offset: 1 });
            expect(run).to.be.eql(true);
            utils.parseBody.restore();
            exponentialBackoff.retryWithExpBackoff.restore();
        });

        it('getItems() limit and offset work', () => {
            const datasetId = 'some-id';
            const expected = {
                total: 1,
                offset: 1,
                count: 1,
                limit: 1,
                items: [{ test: 'value' }],
            };
            const headers = {
                'content-type': 'application/json; chartset=utf-8',
                'x-apify-pagination-total': '1',
                'x-apify-pagination-offset': '1',
                'x-apify-pagination-count': '1',
                'x-apify-pagination-limit': '1',
            };

            requestExpectCall({
                json: false,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${datasetId}/items`,
                gzip: true,
                qs: { limit: 1, offset: 1 },
                resolveWithFullResponse: true,
                encoding: null,
            }, JSON.stringify(expected.items), { headers });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .datasets
                .getItems({ datasetId, limit: 1, offset: 1 })
                .then(given => expect(given).to.be.eql(expected));
        });

        it('getItems() parses JSON', () => {
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

            requestExpectCall({
                json: false,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${datasetId}/items`,
                gzip: true,
                qs: {},
                resolveWithFullResponse: true,
                encoding: null,
            }, body, { headers });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .datasets
                .getItems({ datasetId })
                .then((given) => {
                    expect(given).to.be.eql(expected);
                });
        });

        it('getItems() doesn\'t parse application/json when disableBodyParser = true', () => {
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

            requestExpectCall({
                json: false,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${datasetId}/items`,
                gzip: true,
                qs: {},
                resolveWithFullResponse: true,
                encoding: null,
            }, body, { headers });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .datasets
                .getItems({ datasetId, disableBodyParser: true })
                .then((given) => {
                    expect(given).to.be.eql(expected);
                });
        });

        it('putItems() works with object', () => {
            const datasetId = 'some-id';
            const contentType = 'application/json; charset=utf-8';
            const data = { someData: 'someValue' };
            const token = 'my-token';

            requestExpectCall({
                body: gzipSync(JSON.stringify(data)),
                headers: {
                    'Content-Type': contentType,
                    'Content-Encoding': 'gzip',
                },
                json: false,
                method: 'POST',
                url: `${BASE_URL}${BASE_PATH}/${datasetId}/items`,
                qs: { token },
            });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .datasets
                .putItems({ datasetId, data, token });
        });
        it('putItems() works with array', () => {
            const datasetId = 'some-id';
            const contentType = 'application/json; charset=utf-8';
            const data = [{ someData: 'someValue' }, { someData: 'someValue' }];
            const token = 'my-token';

            requestExpectCall({
                body: gzipSync(JSON.stringify(data)),
                headers: {
                    'Content-Type': contentType,
                    'Content-Encoding': 'gzip',
                },
                json: false,
                method: 'POST',
                url: `${BASE_URL}${BASE_PATH}/${datasetId}/items`,
                qs: { token },
            });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .datasets
                .putItems({ datasetId, data, token });
        });
        it('putItems() works with string', () => {
            const datasetId = 'some-id';
            const contentType = 'application/json; charset=utf-8';
            const data = JSON.stringify([{ someData: 'someValue' }, { someData: 'someValue' }]);
            const token = 'my-token';

            requestExpectCall({
                body: gzipSync(data),
                headers: {
                    'Content-Type': contentType,
                    'Content-Encoding': 'gzip',
                },
                json: false,
                method: 'POST',
                url: `${BASE_URL}${BASE_PATH}/${datasetId}/items`,
                qs: { token },
            });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .datasets
                .putItems({ datasetId, data, token });
        });
    });
});
