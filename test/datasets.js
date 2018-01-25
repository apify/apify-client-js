import { expect } from 'chai';
import { gzipSync } from 'zlib';
import ApifyClient from '../build';
import { BASE_PATH } from '../build/datasets';
import { mockRequest, requestExpectCall, requestExpectErrorCall, restoreRequest } from './_helper';

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
            }, false, 404);

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .datasets
                .getDataset({ datasetId })
                .then(given => expect(given).to.be.eql(null));
        });

        it('deleteDataset() works', () => {
            const datasetId = 'some-id';

            requestExpectCall({
                json: true,
                method: 'DELETE',
                url: `${BASE_URL}${BASE_PATH}/${datasetId}`,
            });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .datasets
                .deleteDataset({ datasetId });
        });

        it('getItems() works', () => {
            const datasetId = 'some-id';
            const expected = [];

            requestExpectCall({
                json: false,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${datasetId}/items`,
                gzip: true,
                qs: {},
                resolveWithResponse: true,
                encoding: null,
            }, JSON.stringify(expected), { headers: { 'content-type': 'application/json; chartset=utf-8' } });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .datasets
                .getItems({ datasetId })
                .then(given => expect(given).to.be.eql(expected));
        });

        it('getItems() parses JSON', () => {
            const datasetId = 'some-id';
            const body = JSON.stringify([{ a: 'foo', b: ['bar1', 'bar2'] }]);
            const contentType = 'application/json';
            const expected = JSON.parse(body);

            requestExpectCall({
                json: false,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${datasetId}/items`,
                gzip: true,
                qs: {},
                resolveWithResponse: true,
                encoding: null,
            }, body, { headers: { 'content-type': contentType } });

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
            const expected = body;

            requestExpectCall({
                json: false,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${datasetId}/items`,
                gzip: true,
                qs: {},
                resolveWithResponse: true,
                encoding: null,
            }, body, { headers: { 'content-type': contentType } });

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

            requestExpectCall({
                body: gzipSync(JSON.stringify(data)),
                headers: {
                    'Content-Type': contentType,
                    'Content-Encoding': 'gzip',
                },
                json: false,
                method: 'POST',
                url: `${BASE_URL}${BASE_PATH}/${datasetId}/items`,
            });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .datasets
                .putItems({ datasetId, data });
        });
        it('putItems() works with array', () => {
            const datasetId = 'some-id';
            const contentType = 'application/json; charset=utf-8';
            const data = [{ someData: 'someValue' }, { someData: 'someValue' }];

            requestExpectCall({
                body: gzipSync(JSON.stringify(data)),
                headers: {
                    'Content-Type': contentType,
                    'Content-Encoding': 'gzip',
                },
                json: false,
                method: 'POST',
                url: `${BASE_URL}${BASE_PATH}/${datasetId}/items`,
            });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .datasets
                .putItems({ datasetId, data });
        });
    });
});
