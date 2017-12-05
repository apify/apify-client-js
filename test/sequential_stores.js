import { expect } from 'chai';
import { gzipSync } from 'zlib';
import ApifyClient from '../build';
import { BASE_PATH } from '../build/sequential_stores';
import { mockRequest, requestExpectCall, requestExpectErrorCall, restoreRequest } from './_helper';

const BASE_URL = 'http://example.com/something';
const OPTIONS = { baseUrl: BASE_URL };

describe('Sequential store', () => {
    before(mockRequest);
    after(restoreRequest);

    describe('indentification', () => {
        it('should work with storeId in default params', () => {
            const storeId = 'some-id-2';

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${storeId}`,
            }, {
                data: {
                    id: storeId,
                },
            });

            const apifyClient = new ApifyClient(Object.assign({}, OPTIONS, { storeId }));

            return apifyClient
                .sequentialStores
                .getStore()
                .then((store) => {
                    expect(store.id).to.be.eql(storeId);
                });
        });

        it('should work with storeId in method call params', () => {
            const storeId = 'some-id-3';

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${storeId}`,
            }, {
                data: {
                    id: storeId,
                },
            });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .sequentialStores
                .getStore({ storeId })
                .then((store) => {
                    expect(store.id).to.be.eql(storeId);
                });
        });

        it('should work with token and storeName', () => {
            const storeId = 'some-id-4';
            const storeOptions = {
                token: 'sometoken',
                storeName: 'somename',
            };

            requestExpectCall({
                json: true,
                method: 'POST',
                url: `${BASE_URL}${BASE_PATH}`,
                qs: { name: storeOptions.storeName, token: storeOptions.token },
            }, {
                data: {
                    id: storeId,
                },
            });

            const apifyClient = new ApifyClient(Object.assign({}, OPTIONS, { storeId }));

            return apifyClient
                .sequentialStores
                .getOrCreateStore(storeOptions)
                .then(store => expect(store.id).to.be.eql(storeId));
        });
    });

    describe('REST method', () => {
        it('listStores() works', () => {
            const storeId = 'some-id';
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

            const apifyClient = new ApifyClient(Object.assign({}, OPTIONS, { storeId }));

            return apifyClient
                .sequentialStores
                .listStores(callOptions)
                .then(response => expect(response).to.be.eql(expected));
        });

        it('getStore() works', () => {
            const storeId = 'some-id';
            const expected = { _id: 'some-id', aaa: 'bbb' };

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${storeId}`,
            }, { data: expected });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .sequentialStores
                .getStore({ storeId })
                .then(given => expect(given).to.be.eql(expected));
        });

        it('getStore() returns null on 404 status code (RECORD_NOT_FOUND)', () => {
            const storeId = 'some-id';

            requestExpectErrorCall({
                json: true,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${storeId}`,
            }, false, 404);

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .sequentialStores
                .getStore({ storeId })
                .then(given => expect(given).to.be.eql(null));
        });

        it('deleteStore() works', () => {
            const storeId = 'some-id';

            requestExpectCall({
                json: true,
                method: 'DELETE',
                url: `${BASE_URL}${BASE_PATH}/${storeId}`,
            });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .sequentialStores
                .deleteStore({ storeId });
        });

        it('getRecords() works', () => {
            const storeId = 'some-id';
            const expected = [];

            requestExpectCall({
                json: false,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${storeId}/records`,
                gzip: true,
                qs: {},
                resolveWithResponse: true,
                encoding: null,
            }, JSON.stringify(expected), { headers: { 'content-type': 'application/json; chartset=utf-8' } });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .sequentialStores
                .getRecords({ storeId })
                .then(given => expect(given).to.be.eql(expected));
        });

        it('getRecords() parses JSON', () => {
            const storeId = 'some-id';
            const body = JSON.stringify([{ a: 'foo', b: ['bar1', 'bar2'] }]);
            const contentType = 'application/json';
            const expected = JSON.parse(body);

            requestExpectCall({
                json: false,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${storeId}/records`,
                gzip: true,
                qs: {},
                resolveWithResponse: true,
                encoding: null,
            }, body, { headers: { 'content-type': contentType } });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .sequentialStores
                .getRecords({ storeId })
                .then((given) => {
                    expect(given).to.be.eql(expected);
                });
        });

        it('getRecords() doesn\'t parse application/json when disableBodyParser = true', () => {
            const storeId = 'some-id';
            const body = JSON.stringify({ a: 'foo', b: ['bar1', 'bar2'] });
            const contentType = 'application/json';
            const expected = body;

            requestExpectCall({
                json: false,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${storeId}/records`,
                gzip: true,
                qs: {},
                resolveWithResponse: true,
                encoding: null,
            }, body, { headers: { 'content-type': contentType } });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .sequentialStores
                .getRecords({ storeId, disableBodyParser: true })
                .then((given) => {
                    expect(given).to.be.eql(expected);
                });
        });

        it('putRecord() works', () => {
            const storeId = 'some-id';
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
                url: `${BASE_URL}${BASE_PATH}/${storeId}/records`,
            });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .sequentialStores
                .putRecord({ storeId, data });
        });
    });
});
