import sinon from 'sinon';
import _ from 'underscore';
import { expect } from 'chai';
import * as utils from '../src/utils';
import ApifierClient from '../src';
import { BASE_PATH } from '../src/key-value-stores';

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

            const apifierClient = new ApifierClient(options);

            return apifierClient
                .keyValueStores
                .getStore()
                .then((store) => {
                    expect(store.id).to.be.eql(storeId);
                    delete process.env.APIFY_ACT_RUN_ID;
                });
        });

        it('should work with storeId in default params', () => {
            const storeId = 'some-id-2';
            const apifierClient = new ApifierClient(Object.assign({}, options, { storeId }));

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `http://myhost:80/mypath${BASE_PATH}/${storeId}`,
            }, {
                id: storeId,
            });

            return apifierClient
                .keyValueStores
                .getStore()
                .then((store) => {
                    expect(store.id).to.be.eql(storeId);
                    delete process.env.APIFY_ACT_RUN_ID;
                });
        });

        it('should work with storeId in method call params', () => {
            const storeId = 'some-id-3';
            const apifierClient = new ApifierClient(options);

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `http://myhost:80/mypath${BASE_PATH}/${storeId}`,
            }, {
                id: storeId,
            });

            return apifierClient
                .keyValueStores
                .getStore({ storeId })
                .then((store) => {
                    expect(store.id).to.be.eql(storeId);
                    delete process.env.APIFY_ACT_RUN_ID;
                });
        });

        it('should work with user ID and credentials', () => {
            const storeId = 'some-id-4';
            const apifierClient = new ApifierClient(Object.assign({}, options, { storeId }));

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

            return apifierClient
                .keyValueStores
                .getOrCreateStore(storeOptions)
                .then(store => expect(store.id).to.be.eql(storeId));
        });

        it('should work with username and credentials', () => {
            const storeId = 'some-id-5';
            const apifierClient = new ApifierClient(Object.assign({}, options, { storeId }));

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

            return apifierClient
                .keyValueStores
                .getOrCreateStore(storeOptions)
                .then(store => expect(store.id).to.be.eql(storeId));
        });
    });

    describe('Key value store REST methods work', () => {
        it('getStore() works', () => {
            const storeId = 'some-id';
            const apifierClient = new ApifierClient(options);
            const expected = { _id: 'some-id', aaa: 'bbb' };

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `http://myhost:80/mypath${BASE_PATH}/${storeId}`,
            }, expected);

            return apifierClient
                .keyValueStores
                .getStore({ storeId })
                .then(given => expect(given).to.be.eql(expected));
        });


        it('deleteStore() works', () => {
            const storeId = 'some-id';
            const apifierClient = new ApifierClient(options);

            requestExpectCall({
                json: true,
                method: 'DELETE',
                url: `http://myhost:80/mypath${BASE_PATH}/${storeId}`,
            });

            return apifierClient
                .keyValueStores
                .deleteStore({ storeId });
        });

        it('getRecord() works', () => {
            const recordKey = 'some-key';
            const storeId = 'some-id';
            const apifierClient = new ApifierClient(options);
            const expected = 'sometext';

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `http://myhost:80/mypath${BASE_PATH}/${storeId}/records/${recordKey}`,
            }, expected);

            return apifierClient
                .keyValueStores
                .getRecord({ storeId, recordKey })
                .then(given => expect(given).to.be.eql(expected));
        });

        it('put() works', () => {
            const recordKey = 'some-key';
            const storeId = 'some-id';
            const contentType = 'application/json';
            const body = 'someValue';
            const apifierClient = new ApifierClient(options);

            requestExpectCall({
                body: 'someValue',
                headers: { 'Content-Type': 'application/json' },
                json: true,
                method: 'PUT',
                url: `http://myhost:80/mypath${BASE_PATH}/${storeId}/records/${recordKey}`,
            });

            return apifierClient
                .keyValueStores
                .putRecord({ storeId, recordKey, contentType, body });
        });

        it('delete() works', () => {
            const recordKey = 'some-key';
            const storeId = 'some-id';
            const apifierClient = new ApifierClient(options);

            requestExpectCall({
                json: true,
                method: 'DELETE',
                url: `http://myhost:80/mypath${BASE_PATH}/${storeId}/records/${recordKey}`,
            });

            return apifierClient
                .keyValueStores
                .deleteRecord({ storeId, recordKey });
        });

        it('keys() works', () => {
            const storeId = 'some-id';
            const exclusiveStartKey = 'fromKey';
            const count = 10;
            const apifierClient = new ApifierClient(options);
            const expected = ['key1', 'key2', 'key3'];

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `http://myhost:80/mypath${BASE_PATH}/${storeId}/records?exclusiveStartKey=${exclusiveStartKey}&count=${count}`,
            }, expected);

            return apifierClient
                .keyValueStores
                .getRecordsKeys({ storeId, exclusiveStartKey, count })
                .then(keys => expect(keys).to.be.eql({ items: expected }));
        });
    });
});
