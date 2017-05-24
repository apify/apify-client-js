import sinon from 'sinon';
import _ from 'underscore';
import { expect } from 'chai';
import * as utils from '../build/utils';
import ApifyClient from '../build';
import { BASE_PATH } from '../build/key_value_stores';

const options = {
    baseUrl: 'http://myhost:80/mypath',
};

describe('Key value store', () => {
    const requestPromiseMock = sinon.mock(utils, 'requestPromise');

    const requestExpectCall = (requestOpts, body, response) => {
        if (!_.isObject(requestOpts)) throw new Error('"requestOpts" parameter must be an object!');
        if (!requestOpts.method) throw new Error('"requestOpts.method" parameter is not set!');

        const expectedRequestOpts = response ? Object.assign({}, requestOpts, { resolveWithResponse: true, promise: Promise })
                                             : Object.assign({}, requestOpts, { promise: Promise });
        const output = response ? { body, response } : body;

        requestPromiseMock
            .expects('requestPromise')
            .once()
            .withArgs(expectedRequestOpts)
            .returns(Promise.resolve(output));
    };

    after(() => {
        requestPromiseMock.verify();
        requestPromiseMock.restore();
    });

    describe('indentification', () => {
        it('should work with storeId in default params', () => {
            const storeId = 'some-id-2';

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `http://myhost:80/mypath${BASE_PATH}/${storeId}`,
            }, {
                id: storeId,
            });

            const apifyClient = new ApifyClient(Object.assign({}, options, { storeId }));

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
                url: `http://myhost:80/mypath${BASE_PATH}/${storeId}`,
            }, {
                id: storeId,
            });

            const apifyClient = new ApifyClient(options);

            return apifyClient
                .keyValueStores
                .getStore({ storeId })
                .then((store) => {
                    expect(store.id).to.be.eql(storeId);
                });
        });

        it('should work with user ID and credentials', () => {
            const storeId = 'some-id-4';
            const storeOptions = {
                userId: 'someid',
                token: 'sometoken',
                storeName: 'somename',
            };

            requestExpectCall({
                body: storeOptions,
                json: true,
                method: 'POST',
                url: `http://myhost:80/mypath${BASE_PATH}`,
            }, {
                id: storeId,
            });

            const apifyClient = new ApifyClient(Object.assign({}, options, { storeId }));

            return apifyClient
                .keyValueStores
                .getOrCreateStore(storeOptions)
                .then(store => expect(store.id).to.be.eql(storeId));
        });

        it('should work with username and credentials', () => {
            const storeId = 'some-id-5';
            const storeOptions = {
                username: 'someusername',
                token: 'sometoken',
                storeName: 'somename',
            };

            requestExpectCall({
                body: storeOptions,
                json: true,
                method: 'POST',
                url: `http://myhost:80/mypath${BASE_PATH}`,
            }, {
                id: storeId,
            });

            const apifyClient = new ApifyClient(Object.assign({}, options, { storeId }));

            return apifyClient
                .keyValueStores
                .getOrCreateStore(storeOptions)
                .then(store => expect(store.id).to.be.eql(storeId));
        });
    });

    describe('Key value store REST methods work', () => {
        it('getStore() works', () => {
            const storeId = 'some-id';
            const expected = { _id: 'some-id', aaa: 'bbb' };

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `http://myhost:80/mypath${BASE_PATH}/${storeId}`,
            }, expected);

            const apifyClient = new ApifyClient(options);

            return apifyClient
                .keyValueStores
                .getStore({ storeId })
                .then(given => expect(given).to.be.eql(expected));
        });


        it('deleteStore() works', () => {
            const storeId = 'some-id';

            requestExpectCall({
                json: true,
                method: 'DELETE',
                url: `http://myhost:80/mypath${BASE_PATH}/${storeId}`,
            });

            const apifyClient = new ApifyClient(options);

            return apifyClient
                .keyValueStores
                .deleteStore({ storeId });
        });

        it('getRecord() works', () => {
            const recordKey = 'some-key';
            const storeId = 'some-id';
            const body = 'sometext';
            const response = { headers: { 'content-type': 'text/plain' } };
            const expected = {
                body,
                contentType: 'text/plain',
            };

            requestExpectCall({
                json: false,
                method: 'GET',
                url: `http://myhost:80/mypath${BASE_PATH}/${storeId}/records/${recordKey}`,
            }, body, response);

            const apifyClient = new ApifyClient(options);

            return apifyClient
                .keyValueStores
                .getRecord({ storeId, recordKey })
                .then(given => expect(given).to.be.eql(expected));
        });

        it('put() works', () => {
            const recordKey = 'some-key';
            const storeId = 'some-id';
            const contentType = 'application/json';
            const body = 'someValue';

            requestExpectCall({
                body: 'someValue',
                headers: { 'Content-Type': 'application/json' },
                json: false,
                method: 'PUT',
                url: `http://myhost:80/mypath${BASE_PATH}/${storeId}/records/${recordKey}`,
            });

            const apifyClient = new ApifyClient(options);

            return apifyClient
                .keyValueStores
                .putRecord({ storeId, recordKey, contentType, body });
        });

        it('delete() works', () => {
            const recordKey = 'some-key';
            const storeId = 'some-id';

            requestExpectCall({
                json: true,
                method: 'DELETE',
                url: `http://myhost:80/mypath${BASE_PATH}/${storeId}/records/${recordKey}`,
            });

            const apifyClient = new ApifyClient(options);

            return apifyClient
                .keyValueStores
                .deleteRecord({ storeId, recordKey });
        });

        it('keys() works', () => {
            const storeId = 'some-id';
            const exclusiveStartKey = 'fromKey';
            const count = 10;
            const expected = ['key1', 'key2', 'key3'];

            requestExpectCall({
                json: true,
                method: 'GET',
                qs: { count, exclusiveStartKey },
                url: `http://myhost:80/mypath${BASE_PATH}/${storeId}/records`,
            }, expected);

            const apifyClient = new ApifyClient(options);

            return apifyClient
                .keyValueStores
                .getRecordsKeys({ storeId, exclusiveStartKey, count })
                .then(keys => expect(keys).to.be.eql({ items: expected }));
        });
    });
});
