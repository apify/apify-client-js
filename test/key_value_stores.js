import { expect } from 'chai';
import { gzipSync } from 'zlib';
import { randomBytes } from 'crypto';
import ApifyClient from '../build';
import { BASE_PATH, SIGNED_URL_UPLOAD_MIN_BYTESIZE } from '../build/key_value_stores';
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

describe('KeyValueStores methods', () => {
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
        xit('should work with storeId in default params', () => {
            // TODO: DO we want to keep the support for the default params?
            const storeId = 'some-id-2';

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${storeId}`,
                qs: {},
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

        it('should work with storeId in method call params', async () => {
            const storeId = 'some-id-3';

            const res = await client.keyValueStores.getStore({ storeId });
            expect(res.id).to.be.eql('get-store');
            validateRequest({}, { storeId });
        });

        it('should work with token and storeName', async () => {
            const storeOptions = {
                token: 'sometoken',
                storeName: 'somename',
            };

            const res = await client.keyValueStores.getOrCreateStore(storeOptions);
            expect(res.id).to.be.eql('get-or-create-store');
            validateRequest({ token: storeOptions.token, name: storeOptions.storeName }, {});
        });
    });

    describe('REST method', () => {
        it('listStores() works', async () => {
            const callOptions = {
                limit: 5,
                offset: 3,
                desc: true,
                unnamed: true,
            };

            const queryString = {
                limit: 5,
                offset: 3,
                desc: 1,
                unnamed: 1,
            };

            const res = await client.keyValueStores.listStores(callOptions);
            expect(res.id).to.be.eql('list-stores');
            validateRequest(queryString, {});
        });

        it('getStore() works', async () => {
            const storeId = 'some-id-3';

            const res = await client.keyValueStores.getStore({ storeId });
            expect(res.id).to.be.eql('get-store');
            validateRequest({}, { storeId });
        });

        it('getStore() returns null on 404 status code (RECORD_NOT_FOUND)', async () => {
            const storeId = '404';

            const res = await client.keyValueStores.getStore({ storeId });
            expect(res).to.be.eql(null);
            validateRequest({}, { storeId });
        });

        it('deleteStore() works', async () => {
            const storeId = '204';
            const res = await client.keyValueStores.deleteStore({ storeId });
            expect(res).to.be.eql('');
            validateRequest({}, { storeId });
        });

        it('getRecord() works', async () => {
            const key = 'some-key';
            const storeId = 'some-id';

            const body = { a: 'foo', b: ['bar1', 'bar2'] };
            const contentType = 'application/json';

            mockServer.setResponse({ headers: { 'content-type': contentType }, body });

            await client.keyValueStores.getRecord({ storeId, key });
            validateRequest({}, { storeId, key });
        });

        it('getRecord() parses JSON', async () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const body = { a: 'foo', b: ['bar1', 'bar2'] };
            const contentType = 'application/json';

            mockServer.setResponse({ headers: { 'content-type': contentType }, body });

            const res = await client.keyValueStores.getRecord({ storeId, key });
            expect(res).to.be.eql(body);
        });

        it('getRecord() doesn\'t parse application/json when disableBodyParser = true', async () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const body = { a: 'foo', b: ['bar1', 'bar2'] };
            const contentType = 'application/json';

            mockServer.setResponse({ headers: { 'content-type': contentType }, body });

            const res = await client.keyValueStores.getRecord({ storeId, key, disableBodyParser: true });
            expect(res).to.be.eql(JSON.stringify(body));
        });

        it('getRecord() returns null on 404 status code (RECORD_NOT_FOUND)', async () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const body = { a: 'foo', b: ['bar1', 'bar2'] };

            mockServer.setResponse({ body, statusCode: 404 });

            const res = await client.keyValueStores.getRecord({ storeId, key, disableBodyParser: true });
            expect(res).to.be.eql(null);
        });

        it('putRecord() works', async () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const contentType = 'text/plain';
            const body = 'someValue';

            mockServer.setResponse({ body: gzipSync(body),
                headers: {
                    'Content-Type': contentType,
                    'Content-Encoding': 'gzip',
                } });

            const res = await client.keyValueStores.putRecord({ storeId, key, contentType, body });
            expect(res).to.be.eql(body);
        });

        xit('putRecord() uploads via signed url when gzipped buffer.length > SIGNED_URL_UPLOAD_MIN_BYTESIZE', () => {
            // TODO: I have no idea how to test this using this mock flow :(
            const key = 'some-key';
            const storeId = 'some-id';
            const contentType = 'application/octet-stream';
            const body = randomBytes(SIGNED_URL_UPLOAD_MIN_BYTESIZE);
            const signedUrl = 'http://something.aws.com/foo';
            const token = 'my-token';

            requestExpectCall({
                headers: {
                    'Content-Type': contentType,
                },
                json: true,
                method: 'GET',
                url: `${BASE_URL}${BASE_PATH}/${storeId}/records/${key}/direct-upload-url`,
                qs: { token },
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
                qs: null,
            });

            const apifyClient = new ApifyClient(OPTIONS);

            return apifyClient
                .keyValueStores
                .putRecord({ storeId, key, contentType, body, token });
        });

        it('deleteRecord() works', async () => {
            const key = 'some-key';
            const storeId = '204';

            const res = await client.keyValueStores.deleteRecord({ storeId, key });
            expect(res).to.be.eql('');
            validateRequest({}, { storeId, key });
        });

        it('listKeys() works', async () => {
            const storeId = 'some-id';

            const query = {
                limit: 10,
                exclusiveStartKey: 'fromKey',
            };

            const res = await client.keyValueStores.listKeys({ storeId, ...query });
            expect(res.id).to.be.eql('list-keys');
            validateRequest(query, { storeId });
        });
    });
});
