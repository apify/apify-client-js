const { Readable } = require('stream');
const { ApifyClient } = require('../src');
const mockServer = require('./mock_server/server');
const { Browser, validateRequest, DEFAULT_OPTIONS } = require('./_helper');

describe('Key-Value Store methods', () => {
    let baseUrl;
    const browser = new Browser();

    beforeAll(async () => {
        const server = await mockServer.start();
        await browser.start();
        baseUrl = `http://localhost:${server.address().port}`;
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
        page = await browser.getInjectedPage(baseUrl, DEFAULT_OPTIONS);
        client = new ApifyClient({
            baseUrl,
            maxRetries: 0,
            ...DEFAULT_OPTIONS,
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

        test('getRecord() works', async () => {
            const key = 'some-key';
            const storeId = 'some-id';

            const expectedBody = 'hello-world';
            const expectedContentType = 'text/plain; charset=utf-8';
            const expectedHeaders = {
                'content-type': expectedContentType,
            };

            mockServer.setResponse({ headers: expectedHeaders, body: expectedBody });

            const res = await client.keyValueStore(storeId).getRecord(key);
            const expectedResult = {
                key,
                value: expectedBody,
                contentType: expectedContentType,
            };
            expect(res).toEqual(expectedResult);
            validateRequest({}, { storeId, key });

            const browserRes = await page.evaluate((id, k) => client.keyValueStore(id).getRecord(k), storeId, key);
            expect(browserRes).toEqual(res);
            validateRequest({}, { storeId, key });
        });

        test('getRecord() parses JSON', async () => {
            const key = 'some-key';
            const storeId = 'some-id';

            const expectedBody = { foo: 'bar', baz: [1, 2] };
            const expectedContentType = 'application/json; charset=utf-8';
            const expectedHeaders = {
                'content-type': expectedContentType,
            };

            mockServer.setResponse({ headers: expectedHeaders, body: expectedBody });

            const res = await client.keyValueStore(storeId).getRecord(key);
            expect(res.value).toEqual(expectedBody);
            validateRequest({}, { storeId, key });

            const browserRes = await page.evaluate((id, k) => client.keyValueStore(id).getRecord(k), storeId, key);
            expect(browserRes).toEqual(res);
            validateRequest({}, { storeId, key });
        });

        test('getRecord() returns buffer when selected', async () => {
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
                key,
                value: expectedBody,
                contentType: expectedContentType,
            };

            const res = await client.keyValueStore(storeId).getRecord(key, options);
            expect(res.value).toBeInstanceOf(Buffer);
            res.value = res.value.toString();
            expect(res).toEqual(expectedResult);
            validateRequest({}, { storeId, key });

            const browserRes = await page.evaluate(async (id, k, opts) => {
                /* eslint-disable no-shadow */
                const res = await client.keyValueStore(id).getRecord(k, opts);
                const decoder = new TextDecoder();
                res.value = decoder.decode(res.value);
                return res;
            }, storeId, key, options);
            expect(browserRes).toEqual(res);
            validateRequest({}, { storeId, key });
        });

        test('getRecord() returns buffer for non-text content-types', async () => {
            const key = 'some-key';
            const storeId = 'some-id';

            const body = 'abcxyz';
            const expectedContentType = 'image/png; charset=utf-8';
            const expectedHeaders = {
                'content-type': expectedContentType,
            };

            mockServer.setResponse({ headers: expectedHeaders, body });
            const expectedResult = {
                key,
                value: body,
                contentType: expectedContentType,
            };

            const res = await client.keyValueStore(storeId).getRecord(key);
            expect(res.value).toBeInstanceOf(Buffer);
            res.value = res.value.toString();
            expect(res).toEqual(expectedResult);
            validateRequest({}, { storeId, key });

            const browserRes = await page.evaluate(async (id, k, opts) => {
                /* eslint-disable no-shadow */
                const res = await client.keyValueStore(id).getRecord(k, opts);
                const decoder = new TextDecoder();
                res.value = decoder.decode(res.value);
                return res;
            }, storeId, key);
            expect(browserRes).toEqual(res);
            validateRequest({}, { storeId, key });
        });

        test('getRecord() correctly returns stream', async () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const options = {
                stream: true,
            };

            const body = { foo: 'bar', baz: [1, 2] };
            const expectedBody = JSON.stringify(body);
            const expectedContentType = 'application/json; charset=utf-8';
            const expectedHeaders = {
                'content-type': expectedContentType,
            };

            mockServer.setResponse({ headers: expectedHeaders, body });
            const expectedResult = {
                key,
                value: expectedBody,
                contentType: expectedContentType,
            };

            const res = await client.keyValueStore(storeId).getRecord(key, options);
            expect(res.value).toBeInstanceOf(Readable);
            const chunks = [];
            for await (const chunk of res.value) {
                chunks.push(chunk);
            }
            res.value = Buffer.concat(chunks).toString();
            expect(res).toEqual(expectedResult);
            validateRequest({}, { storeId, key });

            try {
                await page.evaluate(async (id, k, opts) => {
                    /* eslint-disable no-shadow */
                    return client.keyValueStore(id).getRecord(k, opts);
                }, storeId, key, options);
                throw new Error('wrong error');
            } catch (err) {
                expect(err.message).toMatch('The stream option can only be used in Node.js environment.');
            }
        });

        test('getRecord() returns undefined on 404 status code (RECORD_NOT_FOUND)', async () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const body = { a: 'foo', b: ['bar1', 'bar2'] };

            mockServer.setResponse({ body, statusCode: 404 });

            const res = await client.keyValueStore(storeId).getRecord(key);
            expect(res).toBeUndefined();
            validateRequest({}, { storeId, key });

            const browserRes = await page.evaluate((id, k) => client.keyValueStore(id).getRecord(k), storeId, key);
            expect(browserRes).toEqual(res);
            validateRequest({}, { storeId, key });
        });

        test('setRecord() works with text', async () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const value = 'someValue';
            const expectedHeaders = {
                'content-type': 'text/plain; charset=utf-8',
            };

            const res = await client.keyValueStore(storeId).setRecord({ key, value });
            expect(res).toBeUndefined();
            validateRequest({}, { storeId, key }, value, expectedHeaders);

            const browserRes = await page.evaluate(
                (id, key, value) => client.keyValueStore(id).setRecord({ key, value }),
                storeId, key, value,
            );
            expect(browserRes).toBeUndefined();
            validateRequest({}, { storeId, key }, value, expectedHeaders);
        });

        test('setRecord() works with object', async () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const value = { foo: 'bar', one: 1 };
            const expectedHeaders = {
                'content-type': 'application/json; charset=utf-8',
            };

            const res = await client.keyValueStore(storeId).setRecord({ key, value });
            expect(res).toBeUndefined();
            validateRequest({}, { storeId, key }, value, expectedHeaders);

            const browserRes = await page.evaluate(
                (id, key, value) => client.keyValueStore(id).setRecord({ key, value }),
                storeId, key, value,
            );
            expect(browserRes).toBeUndefined();
            validateRequest({}, { storeId, key }, value, expectedHeaders);
        });

        test('setRecord() works with buffer', async () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const string = 'special chars 🤖✅';
            const value = Buffer.from(string);
            const expectedHeaders = {
                'content-type': 'application/octet-stream',
            };

            const res = await client.keyValueStore(storeId).setRecord({ key, value });
            expect(res).toBeUndefined();
            validateRequest({}, { storeId, key }, value, expectedHeaders);

            const browserRes = await page.evaluate(async (id, key, s) => {
                const encoder = new TextEncoder();
                const value = encoder.encode(s);
                return client.keyValueStore(id).setRecord({ key, value });
            }, storeId, key, string);
            expect(browserRes).toBeUndefined();
            validateRequest({}, { storeId, key }, value, expectedHeaders);
        });

        test('setRecord() works with pre-stringified JSON', async () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const contentType = 'application/json; charset=utf-8';
            const value = JSON.stringify({ foo: 'bar', one: 1 });
            const expectedHeaders = {
                'content-type': contentType,
            };

            const res = await client.keyValueStore(storeId).setRecord({ key, value, contentType });
            expect(res).toBeUndefined();
            validateRequest({}, { storeId, key }, JSON.parse(value), expectedHeaders);

            const browserRes = await page.evaluate(
                (id, key, value, contentType) => client.keyValueStore(id).setRecord({ key, value, contentType }),
                storeId, key, value, contentType,
            );
            expect(browserRes).toBeUndefined();
            validateRequest({}, { storeId, key }, JSON.parse(value), expectedHeaders);
        });

        test('setRecord() uploads gzipped buffer in node context', async () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const value = [];
            for (let i = 0; i < 100000; i++) {
                value.push(Math.random().toString(36).substring(7));
            }
            const contentType = 'application/json; charset=utf-8';

            const res = await client.keyValueStore(storeId).setRecord({ key, value });
            expect(res).toBeUndefined();
            validateRequest({}, { storeId, key }, value, {
                'content-type': contentType,
                'content-encoding': 'gzip',
            });

            const browserRes = await page.evaluate(
                (id, key, value) => client.keyValueStore(id).setRecord({ key, value }),
                storeId, key, value,
            );
            expect(browserRes).toBeUndefined();
            validateRequest({}, { storeId, key }, value, {
                'content-type': contentType,
            });
        });

        test('deleteRecord() works', async () => {
            const key = 'some-key';
            const storeId = '204';

            const res = await client.keyValueStore(storeId).deleteRecord(key);
            expect(res).toBeUndefined();
            validateRequest({}, { storeId, key });

            const browserRes = await page.evaluate((id, k) => client.keyValueStore(id).deleteRecord(k), storeId, key);
            expect(browserRes).toBeUndefined();
            validateRequest({}, { storeId, key });
        });
    });
});
