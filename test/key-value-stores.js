import sinon from 'sinon';
import _ from 'underscore';
import { expect } from 'chai';
import * as utils from '../build/utils';
import ApifyClient from '../build';
import { BASE_PATH } from '../build/key-value-stores';

const options = {
    protocol: 'http',
    host: 'myhost',
    basePath: '/mypath',
    port: 80,
};

describe('Key value store', () => {
    const requestPromiseMock = sinon.mock(utils, 'requestPromise');

    const requestExpectCall = (requestOpts, response) => {
        if (!_.isObject(requestOpts)) throw new Error('"requestOpts" parameter must be an object!');
        if (!requestOpts.method) throw new Error('"requestOpts.method" parameter is not set!');

        requestPromiseMock
            .expects('requestPromise')
            .once()
            .withArgs(Promise, requestOpts)
            .returns(Promise.resolve(response));
    };

    after(() => {
        requestPromiseMock.verify();
        requestPromiseMock.restore();
    });

    describe('indentification', () => {
        it('should work with ENV variable', () => {
            const storeId = 'some-id';

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `http://myhost:80/mypath${BASE_PATH}/${storeId}`,
            }, {
                id: storeId,
            });

            process.env.APIFY_ACT_RUN_ID = storeId;

            const apifyClient = new ApifyClient(options);

            return apifyClient
                .keyValueStores
                .getStore()
                .then((store) => {
                    expect(store.id).to.be.eql(storeId);
                    delete process.env.APIFY_ACT_RUN_ID;
                });
        });

        it('should work with storeId in default params', () => {
            const storeId = 'some-id-2';
            const apifyClient = new ApifyClient(Object.assign({}, options, { storeId }));

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `http://myhost:80/mypath${BASE_PATH}/${storeId}`,
            }, {
                id: storeId,
            });

            return apifyClient
                .keyValueStores
                .getStore()
                .then((store) => {
                    expect(store.id).to.be.eql(storeId);
                    delete process.env.APIFY_ACT_RUN_ID;
                });
        });

        it('should work with storeId in method call params', () => {
            const storeId = 'some-id-3';
            const apifyClient = new ApifyClient(options);

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `http://myhost:80/mypath${BASE_PATH}/${storeId}`,
            }, {
                id: storeId,
            });

            return apifyClient
                .keyValueStores
                .getStore({ storeId })
                .then((store) => {
                    expect(store.id).to.be.eql(storeId);
                    delete process.env.APIFY_ACT_RUN_ID;
                });
        });

        it('should work with user ID and credentials', () => {
            const storeId = 'some-id-4';
            const apifyClient = new ApifyClient(Object.assign({}, options, { storeId }));

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

            return apifyClient
                .keyValueStores
                .getOrCreateStore(storeOptions)
                .then(store => expect(store.id).to.be.eql(storeId));
        });

        it('should work with username and credentials', () => {
            const storeId = 'some-id-5';
            const apifyClient = new ApifyClient(Object.assign({}, options, { storeId }));

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

            return apifyClient
                .keyValueStores
                .getOrCreateStore(storeOptions)
                .then(store => expect(store.id).to.be.eql(storeId));
        });
    });

    describe('Key value store REST methods work', () => {
        it('getStore() works', () => {
            const storeId = 'some-id';
            const apifyClient = new ApifyClient(options);
            const expected = { _id: 'some-id', aaa: 'bbb' };

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `http://myhost:80/mypath${BASE_PATH}/${storeId}`,
            }, expected);

            return apifyClient
                .keyValueStores
                .getStore({ storeId })
                .then(given => expect(given).to.be.eql(expected));
        });


        it('deleteStore() works', () => {
            const storeId = 'some-id';
            const apifyClient = new ApifyClient(options);

            requestExpectCall({
                json: true,
                method: 'DELETE',
                url: `http://myhost:80/mypath${BASE_PATH}/${storeId}`,
            });

            return apifyClient
                .keyValueStores
                .deleteStore({ storeId });
        });

        it('getRecord() works', () => {
            const recordKey = 'some-key';
            const storeId = 'some-id';
            const apifyClient = new ApifyClient(options);
            const body = 'sometext';
            const expected = {
                body,
                contentType: 'text/plain', // TODO: finish this !!!!
            };

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `http://myhost:80/mypath${BASE_PATH}/${storeId}/records/${recordKey}`,
            }, body);

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
            const apifyClient = new ApifyClient(options);

            requestExpectCall({
                body: 'someValue',
                headers: { 'Content-Type': 'application/json' },
                json: true,
                method: 'PUT',
                url: `http://myhost:80/mypath${BASE_PATH}/${storeId}/records/${recordKey}`,
            });

            return apifyClient
                .keyValueStores
                .putRecord({ storeId, recordKey, contentType, body });
        });

        it('delete() works', () => {
            const recordKey = 'some-key';
            const storeId = 'some-id';
            const apifyClient = new ApifyClient(options);

            requestExpectCall({
                json: true,
                method: 'DELETE',
                url: `http://myhost:80/mypath${BASE_PATH}/${storeId}/records/${recordKey}`,
            });

            return apifyClient
                .keyValueStores
                .deleteRecord({ storeId, recordKey });
        });

        it('keys() works', () => {
            const storeId = 'some-id';
            const exclusiveStartKey = 'fromKey';
            const count = 10;
            const apifyClient = new ApifyClient(options);
            const expected = ['key1', 'key2', 'key3'];

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `http://myhost:80/mypath${BASE_PATH}/${storeId}/records?exclusiveStartKey=${exclusiveStartKey}&count=${count}`,
            }, expected);

            return apifyClient
                .keyValueStores
                .getRecordsKeys({ storeId, exclusiveStartKey, count })
                .then(keys => expect(keys).to.be.eql({ items: expected }));
        });
    });
});
