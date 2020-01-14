import { expect } from 'chai';
import { gzipSync } from 'zlib';
import sinon from 'sinon';
import * as exponentialBackoff from 'apify-shared/exponential_backoff';
import * as utils from '../build/utils';
import { getDatasetItems, parseDatasetItemsResponse, RETRIES, BACKOFF_MILLIS } from '../build/datasets';
import ApifyClientError, { NOT_FOUND_STATUS_CODE } from '../src/apify_error';
import ApifyClient from '../build';
import mockServer from './mock_server/server';

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
        .filter(([k, v]) => v !== false) // eslint-disable-line no-unused-vars
        .map(([k, v]) => {
            if (v === true) v = '1';
            else if (typeof v === 'number') v = v.toString();
            return [k, v];
        })
        .reduce((newObj, [k, v]) => {
            newObj[k] = v;
            return newObj;
        }, {});
}

describe('Dataset methods', () => {
    let baseUrl = null;

    before(async () => {
        const server = await mockServer.start(3333);
        baseUrl = `http://localhost:${server.address().port}`;
    });

    after(() => mockServer.close());

    let client = null;
    beforeEach(() => {
        client = new ApifyClient({
            baseUrl,
            expBackoffMaxRepeats: 0,
            expBackoffMillis: 1,
            ...DEFAULT_QUERY,
        });
    });

    afterEach(() => {
        client = null;
    });

    describe('indentification', () => {
        xit('should work with datasetId in default params', async () => {
            const datasetId = 'some-id-2';
            const options = {
                baseUrl,
                expBackoffMaxRepeats: 0,
                expBackoffMillis: 1,
                datasetId,
            };
            console.log(options);
            const newClient = new ApifyClient(options);

            const res = await newClient.datasets.getDataset();
            expect(res.id).to.be.eql('create-actor');
            validateRequest({}, {});
        });

        it('should work with datasetId in method call params', async () => {
            const datasetId = 'some-id-3';


            const res = await client.datasets.getDataset({ datasetId });
            expect(res.id).to.be.eql('get-dataset');
            validateRequest({ }, { datasetId });
        });

        it('should work with token and datasetName', async () => {
            const query = {
                datasetName: 'some-id-2',
                token: 'token',
            };

            const res = await client.datasets.getOrCreateDataset(query);
            expect(res.id).to.be.eql('get-or-create-dataset');
            validateRequest({ token: query.token, name: query.datasetName }, {});
        });
    });

    describe('REST method', () => {
        it('listDatasets() works', async () => {
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
            expect(res.id).to.be.eql('list-datasets');
            validateRequest(queryString);
        });

        it('getDataset() works', async () => {
            const datasetId = 'some-id';

            const res = await client.datasets.getDataset({ datasetId });
            expect(res.id).to.be.eql('get-dataset');
            validateRequest({}, { datasetId });
        });

        it('getDataset() returns null on 404 status code (RECORD_NOT_FOUND)', async () => {
            const datasetId = '404';

            const res = await client.datasets.getDataset({ datasetId });
            expect(res).to.be.eql(null);
            validateRequest({}, { datasetId });
        });

        it('deleteDataset() works', async () => {
            const datasetId = '204';
            const res = await client.datasets.deleteDataset({ datasetId });
            expect(res).to.be.eql('');
            validateRequest({}, { datasetId });
        });

        it('getItems() works', async () => {
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
            expect(res.toString()).to.be.eql(expected.toString());
            validateRequest({}, { datasetId }, {});
        });

        it('getItems() works with bom=false', async () => {
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
            expect(res.toString()).to.be.eql(expected.toString());
            validateRequest(qs, { datasetId }, {});
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
                    JSON.parse('{"foo":');
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
            const originalRetry = utils.retryWithExpBackoff;
            const stub = sinon.stub(utils, 'retryWithExpBackoff');
            stub.callsFake((func, opts) => {
                console.log(func, opts)
                expect(typeof func).to.be.eql('function');
                expect(opts.retry).to.be.eql(RETRIES);
                expect(opts.minTimeout).to.be.eql(BACKOFF_MILLIS);
                return originalRetry(func, opts);
            });
            await client.datasets.getItems({ datasetId, limit: 1, offset: 1 });
            stub.restore();
        });

        it('getItems() limit and offset work', async () => {
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
            expect(res.toString()).to.be.eql(expected.toString());
            validateRequest(qs, { datasetId });
        });

        it('getItems() parses JSON', async () => {
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
            expect(res.toString()).to.be.eql(expected.toString());
            validateRequest({}, { datasetId });
        });

        it('getItems() doesn\'t parse application/json when disableBodyParser = true', async () => {
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
            console.dir(res);
            expect(res.toString()).to.be.eql(expected.toString());
            validateRequest({}, { datasetId });
        });

        it('putItems() works with object', async () => {
            const datasetId = '201';
            const contentType = 'application/json; charset=utf-8';
            const data = { someData: 'someValue' };
            const headers = {
                'content-type': contentType,
                'content-encoding': 'gzip',
            };

            const res = await client.datasets.putItems({ datasetId, data });
            expect(res.toString()).to.be.eql('{}');
            validateRequest({}, { datasetId }, data, headers);
        });

        it('putItems() works with array', async () => {
            const datasetId = '201';
            const contentType = 'application/json; charset=utf-8';
            const data = [{ someData: 'someValue' }, { someData: 'someValue' }];
            const headers = {
                'content-type': contentType,
                'content-encoding': 'gzip',
            };

            const res = await client.datasets.putItems({ datasetId, data });
            expect(res.toString()).to.be.eql('{}');
            validateRequest({}, { datasetId }, data, headers);
        });

        it('putItems() works with string', async () => {
            const datasetId = '201';
            const contentType = 'application/json; charset=utf-8';
            const data = JSON.stringify([{ someData: 'someValue' }, { someData: 'someValue' }]);
            const headers = {
                'content-type': contentType,
                'content-encoding': 'gzip',
            };

            const res = await client.datasets.putItems({ datasetId, data });
            expect(res.toString()).to.be.eql('{}');
            validateRequest({}, { datasetId }, JSON.parse(data), headers);
        });
    });
});
