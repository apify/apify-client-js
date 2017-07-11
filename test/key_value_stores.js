import { expect } from 'chai';
import { gzipSync } from 'zlib';
import { randomBytes } from 'crypto';
import ApifyClient from '../build';
import { BASE_PATH, SIGNED_URL_UPLOAD_MIN_BYTESIZE } from '../build/key_value_stores';
import { mockRequest, requestExpectCall, requestExpectErrorCall, verifyAndRestoreRequest } from './_helper';

const deepClone = obj => JSON.parse(JSON.stringify(obj));
const BASE_URL = 'http://example.com/something';
const OPTIONS = { baseUrl: BASE_URL };

describe('Key value store', () => {
    before(mockRequest);
    after(verifyAndRestoreRequest);

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
            };

            const expected = {
                limit: 5,
                offset: 3,
                count: 5,
                total: 10,
                items: ['store1', 'store2'],
            };

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}`,
                qs: callOptions,
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
                json: true,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${storeId}/records/${key}`,
                gzip: true,
                qs: {},
            }, { data: expected });

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
            const fromServer = {
                body,
                contentType,
            };
            const expected = {
                body: JSON.parse(body),
                contentType,
            };

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${storeId}/records/${key}`,
                gzip: true,
                qs: {},
            }, { data: fromServer });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .keyValueStores
                .getRecord({ storeId, key })
                .then((given) => {
                    expect(given).to.be.eql(expected);
                });
        });

        it('getRecord() doesn\'t parse application/json when useRawBody = true', () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const serverResponse = {
                body: JSON.stringify({ a: 'foo', b: ['bar1', 'bar2'] }),
                contentType: 'application/json',
            };
            const expected = deepClone(serverResponse);

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${storeId}/records/${key}`,
                gzip: true,
                qs: {},
            }, { data: serverResponse });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .keyValueStores
                .getRecord({ storeId, key, useRawBody: true })
                .then((given) => {
                    expect(given).to.be.eql(expected);
                });
        });

        it('getRecord() works with raw = true', () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const bodyBufer = new Buffer([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]);

            requestExpectCall({
                json: false,
                method: 'GET',
                qs: { raw: 1 },
                encoding: null,
                url: `${BASE_URL}${BASE_PATH}/${storeId}/records/${key}`,
                gzip: true,
            }, bodyBufer);

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .keyValueStores
                .getRecord({ storeId, key, raw: true })
                .then((given) => {
                    expect(given).to.be.eql(bodyBufer);
                });
        });

        it('getRecord() works with url = true and raw = false', () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const body = new Buffer([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]);
            const signedUrl = 'http://something.aws.com/foo';

            requestExpectCall({
                json: true,
                method: 'GET',
                qs: {},
                url: `${BASE_URL}${BASE_PATH}/${storeId}/records/${key}/direct-download-url`,
                gzip: true,
            }, { data: { signedUrl, foo: 'bar' } });

            requestExpectCall({
                json: false,
                method: 'GET',
                url: signedUrl,
                gzip: true,
            }, body);

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .keyValueStores
                .getRecord({ storeId, key, url: true })
                .then((given) => {
                    expect(given).to.be.eql({ body, foo: 'bar' });
                });
        });

        it('getRecord() works with url = true and raw = true', () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const body = new Buffer([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]);
            const signedUrl = 'http://something.aws.com/foo';

            requestExpectCall({
                json: true,
                method: 'GET',
                qs: { raw: 1 },
                url: `${BASE_URL}${BASE_PATH}/${storeId}/records/${key}/direct-download-url`,
                gzip: true,
            }, { data: { signedUrl, foo: 'bar' } });

            requestExpectCall({
                json: false,
                method: 'GET',
                url: signedUrl,
                gzip: true,
            }, body);

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .keyValueStores
                .getRecord({ storeId, key, url: true, raw: true })
                .then((given) => {
                    expect(given).to.be.eql(body);
                });
        });

        it('getRecord() returns null on 404 status code (RECORD_NOT_FOUND)', () => {
            const key = 'some-key';
            const storeId = 'some-id';

            requestExpectErrorCall({
                json: true,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${storeId}/records/${key}`,
                gzip: true,
                qs: {},
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

        it('putRecord() works parses JSON', () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const contentType = 'application/json';
            const body = { foo: 'bar' };

            requestExpectCall({
                body: gzipSync(JSON.stringify(body)),
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

        it('putRecord() works doesn\'t parse JSON when useRawBody = true', () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const contentType = 'application/json';
            const body = "{ foo: 'bar' }";

            requestExpectCall({
                body: gzipSync(body),
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
                .putRecord({ storeId, key, contentType, body, useRawBody: true });
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

        it('listRecords() parses JSON', () => {
            const storeId = 'some-id';
            const exclusiveStartKey = 'fromKey';
            const limit = 10;
            const serverResponse = {
                items: [
                    { contentType: 'application/json', body: '{ "foo": "bar" }' },
                    { contentType: 'text/plain', body: 'blaah' },
                ],
            };
            const expected = deepClone(serverResponse);
            expected.items[0].body = JSON.parse(expected.items[0].body);

            requestExpectCall({
                json: true,
                method: 'GET',
                qs: { limit, exclusiveStartKey },
                url: `${BASE_URL}${BASE_PATH}/${storeId}/records`,
            }, { data: serverResponse });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .keyValueStores
                .listRecords({ storeId, exclusiveStartKey, limit })
                .then(response => expect(response).to.be.eql(expected));
        });

        it('listRecords() doesn\'t parse JSON when useRawBody = true', () => {
            const storeId = 'some-id';
            const exclusiveStartKey = 'fromKey';
            const limit = 10;
            const serverResponse = {
                items: [
                    { contentType: 'application/json', body: '{ "foo": "bar" }' },
                    { contentType: 'text/plain', body: 'blaah' },
                ],
            };
            const expected = deepClone(serverResponse);

            requestExpectCall({
                json: true,
                method: 'GET',
                qs: { limit, exclusiveStartKey },
                url: `${BASE_URL}${BASE_PATH}/${storeId}/records`,
            }, { data: expected });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .keyValueStores
                .listRecords({ storeId, exclusiveStartKey, limit, useRawBody: true })
                .then(response => expect(response).to.be.eql(expected));
        });
    });
});
