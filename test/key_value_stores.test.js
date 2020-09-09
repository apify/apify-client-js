const { Readable } = require('stream');
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

        test('getRecord() works', async () => {
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

            const res = await client.keyValueStore(storeId).getRecord(key, options);
            const expectedResult = {
                contentType: expectedContentType,
                body: expectedBody,
            };
            expect(res).toEqual(expectedResult);
            validateRequest(options, { storeId, key });

            const browserRes = await page.evaluate((id, k, opts) => client.keyValueStore(id).getRecord(k, opts), storeId, key, options);
            expect(browserRes).toEqual(res);
            validateRequest(options, { storeId, key });
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
            expect(res.body).toEqual(expectedBody);
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
                contentType: expectedContentType,
                body: expectedBody,
            };

            const res = await client.keyValueStore(storeId).getRecord(key, options);
            expect(res.body).toBeInstanceOf(Buffer);
            res.body = res.body.toString();
            expect(res).toEqual(expectedResult);
            validateRequest({}, { storeId, key });

            const browserRes = await page.evaluate(async (id, k, opts) => {
                /* eslint-disable no-shadow */
                const res = await client.keyValueStore(id).getRecord(k, opts);
                const decoder = new TextDecoder();
                res.body = decoder.decode(res.body);
                return res;
            }, storeId, key, options);
            expect(browserRes).toEqual(res);
            validateRequest({}, { storeId, key });
        });

        test('getRecord() returns buffer for non-text content-types', async () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const options = {
                buffer: true,
            };

            const body = 'abcxyz';
            const expectedContentType = 'image/png; charset=utf-8';
            const expectedHeaders = {
                'content-type': expectedContentType,
            };

            mockServer.setResponse({ headers: expectedHeaders, body });
            const expectedResult = {
                contentType: expectedContentType,
                body,
            };

            const res = await client.keyValueStore(storeId).getRecord(key, options);
            expect(res.body).toBeInstanceOf(Buffer);
            res.body = res.body.toString();
            expect(res).toEqual(expectedResult);
            validateRequest({}, { storeId, key });

            const browserRes = await page.evaluate(async (id, k, opts) => {
                /* eslint-disable no-shadow */
                const res = await client.keyValueStore(id).getRecord(k, opts);
                const decoder = new TextDecoder();
                res.body = decoder.decode(res.body);
                return res;
            }, storeId, key, options);
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
                contentType: expectedContentType,
                body: expectedBody,
            };

            const res = await client.keyValueStore(storeId).getRecord(key, options);
            expect(res.body).toBeInstanceOf(Readable);
            const chunks = [];
            for await (const chunk of res.body) {
                chunks.push(chunk);
            }
            res.body = Buffer.concat(chunks).toString();
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

        test('setRecord() works', async () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const contentType = 'text/plain';
            const value = 'someValue';
            const expectedHeaders = {
                'content-type': contentType,
            };

            const res = await client.keyValueStore(storeId).setRecord({ key, value, contentType });
            expect(res).toBeUndefined();
            validateRequest({}, { storeId, key }, value, expectedHeaders);

            const browserRes = await page.evaluate(
                (id, key, value, contentType) => client.keyValueStore(id).setRecord({ key, value, contentType }),
                storeId, key, value, contentType,
            );
            expect(browserRes).toBeUndefined();
            validateRequest({}, { storeId, key }, value, expectedHeaders);
        });

        test('setRecord() works with buffer', async () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const contentType = 'application/octet-stream; charset=utf-8';
            const string = 'special chars 🤖✅';
            const value = Buffer.from(string);
            const expectedHeaders = {
                'content-type': contentType,
            };

            const res = await client.keyValueStore(storeId).setRecord({ key, value, contentType });
            expect(res).toBeUndefined();
            validateRequest({}, { storeId, key }, value, expectedHeaders);

            const browserRes = await page.evaluate(async (id, key, s, contentType) => {
                const encoder = new TextEncoder();
                const value = encoder.encode(s);
                return client.keyValueStore(id).setRecord({ key, value, contentType });
            }, storeId, key, string, contentType);
            expect(browserRes).toBeUndefined();
            validateRequest({}, { storeId, key }, value, expectedHeaders);
        });

        test('setRecord() uploads via signed url when gzipped buffer.length > SIGNED_URL_UPLOAD_MIN_BYTESIZE', async () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const value = Array(10000).fill({ hello: 'world' });
            const expectedHeaders = {
                'content-type': 'application/json; charset=utf-8',
            };
            const code = '12345';

            mockServer.setResponse({
                body: {
                    signedUrl: `${baseUrl}/external/signed-url/${code}`,
                },
            });

            const res = await client.keyValueStore(storeId).setRecord({ key, value });
            expect(res).toBeUndefined();
            validateRequest({}, { code }, value, expectedHeaders);

            const browserRes = await page.evaluate(
                (id, key, value) => client.keyValueStore(id).setRecord({ key, value }),
                storeId, key, value,
            );
            expect(browserRes).toBeUndefined();
            validateRequest({}, { code }, value, expectedHeaders);
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
