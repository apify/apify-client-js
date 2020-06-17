const { gzipSync } = require('zlib');
const ApifyClient = require('../src');
const mockServer = require('./mock_server/server');
const { Browser, validateRequest, DEFAULT_QUERY } = require('./_helper');

describe('Key-Value Store methods', () => {
    let baseUrl;
    const browser = new Browser();

    beforeAll(async () => {
        const server = await mockServer.start();
        await browser.start();
        baseUrl = `http://localhost:${server.address().port}/v2`;
    });

    afterAll(async () => {
        await Promise.all([
            mockServer.close(),
            browser.cleanUpBrowser(),
        ]);
    });

    let client;
    let page;
    beforeEach(async () => {
        page = await browser.getInjectedPage(baseUrl, DEFAULT_QUERY);
        client = new ApifyClient({
            baseUrl,
            maxRetries: 0,
            ...DEFAULT_QUERY,
        });
    });
    afterEach(async () => {
        client = null;
        page.close().catch(() => {});
    });

    describe('keyValueStores()', () => {
        test('list() works', async () => {
            const opts = {
                limit: 5,
                offset: 3,
                desc: true,
                unnamed: true,
            };

            const res = await client.keyValueStores().list(opts);
            expect(res.id).toEqual('list-stores');
            validateRequest(opts);

            const browserRes = await page.evaluate((options) => client.keyValueStores().list(options), opts);
            expect(browserRes).toEqual(res);
            validateRequest(opts);
        });

        test('getOrCreate() works', async () => {
            const name = 'some-id-2';

            const res = await client.keyValueStores().getOrCreate(name);
            expect(res.id).toEqual('get-or-create-store');
            validateRequest({ name });

            const browserRes = await page.evaluate((n) => client.keyValueStores().getOrCreate(n), name);
            expect(browserRes).toEqual(res);
            validateRequest({ name });
        });
    });

    describe('keyValueStore(id)', () => {
        test('get() works', async () => {
            const storeId = 'some-id';

            const res = await client.keyValueStore(storeId).get();
            expect(res.id).toEqual('get-store');
            validateRequest({}, { storeId });

            const browserRes = await page.evaluate((id) => client.keyValueStore(id).get(), storeId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { storeId });
        });

        test('get() returns undefined on 404 status code (RECORD_NOT_FOUND)', async () => {
            const storeId = '404';

            const res = await client.keyValueStore(storeId).get();
            expect(res).toBeUndefined();
            validateRequest({}, { storeId });

            const browserRes = await page.evaluate((id) => client.keyValueStore(id).get(), storeId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { storeId });
        });

        test('delete() works', async () => {
            const storeId = '204';
            const res = await client.keyValueStore(storeId).delete();
            expect(res).toBeUndefined();
            validateRequest({}, { storeId });

            const browserRes = await page.evaluate((id) => client.keyValueStore(id).delete(), storeId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { storeId });
        });

        test('update() works', async () => {
            const storeId = 'some-id';
            const store = { name: 'my-name' };

            const res = await client.keyValueStore(storeId).update(store);
            expect(res.id).toEqual('update-store');
            validateRequest({}, { storeId }, store);

            const browserRes = await page.evaluate((id, opts) => client.keyValueStore(id).update(opts), storeId, store);
            expect(browserRes).toEqual(res);
            validateRequest({}, { storeId }, store);
        });

        test('listKeys() works', async () => {
            const storeId = 'some-id';

            const query = {
                limit: 10,
                exclusiveStartKey: 'fromKey',
            };

            const res = await client.keyValueStore(storeId).listKeys(query);
            expect(res.id).toEqual('list-keys');
            validateRequest(query, { storeId });

            const browserRes = await page.evaluate((id, opts) => client.keyValueStore(id).listKeys(opts), storeId, query);
            expect(browserRes).toEqual(res);
            validateRequest(query, { storeId });
        });

        test('getValue() works', async () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const options = {
                disableRedirect: true,
            };

            const expectedBody = 'hello-world';
            const expectedContentType = 'text/plain; charset=utf-8';
            const expectedHeaders = {
                'content-type': expectedContentType,
            };

            mockServer.setResponse({ headers: expectedHeaders, body: expectedBody });

            const res = await client.keyValueStore(storeId).getValue(key, options);
            const expectedResult = {
                contentType: expectedContentType,
                body: expectedBody,
            };
            expect(res).toEqual(expectedResult);
            validateRequest(options, { storeId, key });

            const browserRes = await page.evaluate((id, k, opts) => client.keyValueStore(id).getValue(k, opts), storeId, key, options);
            expect(browserRes).toEqual(res);
            validateRequest(options, { storeId, key });
        });

        test('getValue() parses JSON', async () => {
            const key = 'some-key';
            const storeId = 'some-id';

            const expectedBody = { foo: 'bar', baz: [1, 2] };
            const expectedContentType = 'application/json; charset=utf-8';
            const expectedHeaders = {
                'content-type': expectedContentType,
            };

            mockServer.setResponse({ headers: expectedHeaders, body: expectedBody });

            const res = await client.keyValueStore(storeId).getValue(key);
            expect(res.body).toEqual(expectedBody);
            validateRequest({}, { storeId, key });

            const browserRes = await page.evaluate((id, k) => client.keyValueStore(id).getValue(k), storeId, key);
            expect(browserRes).toEqual(res);
            validateRequest({}, { storeId, key });
        });

        test('getValue() correctly returns buffer', async () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const options = {
                buffer: true,
            };

            const body = { foo: 'bar', baz: [1, 2] };
            const expectedBody = JSON.stringify(body);
            const expectedContentType = 'application/json; charset=utf-8';
            const expectedHeaders = {
                'content-type': expectedContentType,
            };

            mockServer.setResponse({ headers: expectedHeaders, body });
            const expectedResult = {
                contentType: expectedContentType,
                body: expectedBody,
            };

            const res = await client.keyValueStore(storeId).getValue(key, options);
            res.body = res.body.toString();
            expect(res).toEqual(expectedResult);
            validateRequest({}, { storeId, key });

            const browserRes = await page.evaluate(async (id, k, opts) => {
                /* eslint-disable no-shadow */
                const res = await client.keyValueStore(id).getValue(k, opts);
                const decoder = new TextDecoder();
                res.body = decoder.decode(res.body);
                return res;
            }, storeId, key, options);
            expect(browserRes).toEqual(res);
            validateRequest({}, { storeId, key });
        });

        test('getValue() returns undefined on 404 status code (RECORD_NOT_FOUND)', async () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const body = { a: 'foo', b: ['bar1', 'bar2'] };

            mockServer.setResponse({ body, statusCode: 404 });

            const res = await client.keyValueStore(storeId).getValue(key);
            expect(res).toBeUndefined();
            validateRequest({}, { storeId, key });

            const browserRes = await page.evaluate((id, k) => client.keyValueStore(id).getValue(k), storeId, key);
            expect(browserRes).toEqual(res);
            validateRequest({}, { storeId, key });
        });

        test('setValue() works', async () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const contentType = 'text/plain';
            const value = 'someValue';
            const options = { contentType };
            const expectedHeaders = {
                'content-type': contentType,
            };

            const res = await client.keyValueStore(storeId).setValue(key, value, options);
            expect(res).toBeUndefined();
            validateRequest({}, { storeId, key }, value, expectedHeaders);

            const browserRes = await page.evaluate((id, k, v, opts) => client.keyValueStore(id).setValue(k, v, opts), storeId, key, value, options);
            expect(browserRes).toBeUndefined();
            validateRequest({}, { storeId, key }, value, expectedHeaders);
        });

        test('setValue() works with buffer', async () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const contentType = 'application/octet-stream; charset=utf-8';
            const value = 'special chars 🤖✅';
            const buf = Buffer.from(value);
            const options = { contentType };
            const expectedHeaders = {
                'content-type': contentType,
            };

            const res = await client.keyValueStore(storeId).setValue(key, buf, options);
            expect(res).toBeUndefined();
            validateRequest({}, { storeId, key }, buf, expectedHeaders);

            const browserRes = await page.evaluate(async (id, k, v, opts) => {
                const encoder = new TextEncoder();
                const typedArray = encoder.encode(v);
                return client.keyValueStore(id).setValue(k, typedArray, opts);
            }, storeId, key, value, options);
            expect(browserRes).toBeUndefined();
            validateRequest({}, { storeId, key }, buf, expectedHeaders);
        });

        test.skip('setValue() uploads via signed url when gzipped buffer.length > SIGNED_URL_UPLOAD_MIN_BYTESIZE', () => {
            // TODO: I have no idea how to test this using this mock flow :(
        });

        test('deleteValue() works', async () => {
            const key = 'some-key';
            const storeId = '204';

            const res = await client.keyValueStore(storeId).deleteValue(key);
            expect(res).toBeUndefined();
            validateRequest({}, { storeId, key });

            const browserRes = await page.evaluate((id, k) => client.keyValueStore(id).deleteValue(k), storeId, key);
            expect(browserRes).toBeUndefined();
            validateRequest({}, { storeId, key });
        });
    });
});
