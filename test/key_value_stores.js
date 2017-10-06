import { expect } from 'chai';
import { gzipSync } from 'zlib';
import { randomBytes } from 'crypto';
import ApifyClient from '../build';
import { BASE_PATH, SIGNED_URL_UPLOAD_MIN_BYTESIZE } from '../build/key_value_stores';
import { mockRequest, requestExpectCall, requestExpectErrorCall, restoreRequest } from './_helper';

const BASE_URL = 'http://example.com/something';
const OPTIONS = { baseUrl: BASE_URL };

describe('Key value store', () => {
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
                .keyValueStores
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
                .keyValueStores
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
                .keyValueStores
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
                .keyValueStores
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
                .keyValueStores
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
                .keyValueStores
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
                .keyValueStores
                .deleteStore({ storeId });
        });

        it('getRecord() works', () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const expected = {
                body: 'sometext',
                contentType: 'text/plain',
            };

            requestExpectCall({
                json: false,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${storeId}/records/${key}`,
                gzip: true,
                qs: {},
                resolveWithResponse: true,
                encoding: null,
            }, expected.body, { headers: { 'content-type': 'text/plain' } });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .keyValueStores
                .getRecord({ storeId, key })
                .then(given => expect(given).to.be.eql(expected));
        });

        it('getRecord() parses JSON', () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const body = JSON.stringify({ a: 'foo', b: ['bar1', 'bar2'] });
            const contentType = 'application/json';
            const expected = {
                body: JSON.parse(body),
                contentType,
            };

            requestExpectCall({
                json: false,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${storeId}/records/${key}`,
                gzip: true,
                qs: {},
                resolveWithResponse: true,
                encoding: null,
            }, body, { headers: { 'content-type': contentType } });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .keyValueStores
                .getRecord({ storeId, key })
                .then((given) => {
                    expect(given).to.be.eql(expected);
                });
        });

        it('getRecord() doesn\'t parse application/json when disableBodyParser = true', () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const body = JSON.stringify({ a: 'foo', b: ['bar1', 'bar2'] });
            const contentType = 'application/json';
            const expected = { body, contentType };

            requestExpectCall({
                json: false,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${storeId}/records/${key}`,
                gzip: true,
                qs: {},
                resolveWithResponse: true,
                encoding: null,
            }, body, { headers: { 'content-type': contentType } });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .keyValueStores
                .getRecord({ storeId, key, disableBodyParser: true })
                .then((given) => {
                    expect(given).to.be.eql(expected);
                });
        });

        it('getRecord() returns null on 404 status code (RECORD_NOT_FOUND)', () => {
            const key = 'some-key';
            const storeId = 'some-id';

            requestExpectErrorCall({
                json: false,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${storeId}/records/${key}`,
                gzip: true,
                qs: {},
                resolveWithResponse: true,
                encoding: null,
            }, false, 404);

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .keyValueStores
                .getRecord({ storeId, key })
                .then(given => expect(given).to.be.eql(null));
        });

        it('putRecord() works', () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const contentType = 'text/plain';
            const body = 'someValue';

            requestExpectCall({
                body: gzipSync('someValue'),
                headers: {
                    'Content-Type': contentType,
                    'Content-Encoding': 'gzip',
                },
                json: false,
                method: 'PUT',
                url: `${BASE_URL}${BASE_PATH}/${storeId}/records/${key}`,
            });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .keyValueStores
                .putRecord({ storeId, key, contentType, body });
        });

        it('putRecord() uploads via signed url when gzipped buffer.length > SIGNED_URL_UPLOAD_MIN_BYTESIZE', () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const contentType = 'application/octet-stream';
            const body = randomBytes(SIGNED_URL_UPLOAD_MIN_BYTESIZE);
            const signedUrl = 'http://something.aws.com/foo';

            requestExpectCall({
                headers: {
                    'Content-Type': contentType,
                },
                json: true,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${storeId}/records/${key}/direct-upload-url`,
            }, { data: { signedUrl } });

            requestExpectCall({
                json: false,
                method: 'PUT',
                url: signedUrl,
                headers: {
                    'Content-Type': contentType,
                    'Content-Encoding': 'gzip',
                },
                body: gzipSync(body),
            });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .keyValueStores
                .putRecord({ storeId, key, contentType, body });
        });

        it('deleteRecord() works', () => {
            const key = 'some-key';
            const storeId = 'some-id';

            requestExpectCall({
                json: true,
                method: 'DELETE',
                url: `${BASE_URL}${BASE_PATH}/${storeId}/records/${key}`,
            });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .keyValueStores
                .deleteRecord({ storeId, key });
        });

        it('listKeys() works', () => {
            const storeId = 'some-id';
            const exclusiveStartKey = 'fromKey';
            const limit = 10;
            const expected = 'something';

            requestExpectCall({
                json: true,
                method: 'GET',
                qs: { limit, exclusiveStartKey },
                url: `${BASE_URL}${BASE_PATH}/${storeId}/keys`,
            }, { data: expected });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .keyValueStores
                .listKeys({ storeId, exclusiveStartKey, limit })
                .then(response => expect(response).to.be.eql(expected));
        });
    });
});
