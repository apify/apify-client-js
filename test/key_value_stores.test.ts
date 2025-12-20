import type { AddressInfo } from 'node:net';
import { Readable } from 'node:stream';

import { ApifyClient } from 'apify-client';
import type { Page } from 'puppeteer';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, test } from 'vitest';

import { Browser, DEFAULT_OPTIONS, validateRequest } from './_helper';
import { mockServer } from './mock_server/server';

describe('Key-Value Store methods', () => {
    let baseUrl: string;
    const browser = new Browser();

    beforeAll(async () => {
        const server = await mockServer.start();
        await browser.start();
        baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
    });

    afterAll(async () => {
        await Promise.all([mockServer.close(), browser.cleanUpBrowser()]);
    });

    let client: ApifyClient;
    let page: Page;
    beforeEach(async () => {
        // Navigate to localhost address to ensure secure context e.g. for Web Crypto API
        page = await browser.getInjectedPage(baseUrl, DEFAULT_OPTIONS, baseUrl);
        client = new ApifyClient({
            baseUrl,
            maxRetries: 0,
            ...DEFAULT_OPTIONS,
        });
    });
    afterEach(async () => {
        client = null as unknown as ApifyClient;
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
            validateRequest({ query: opts, path: '/v2/key-value-stores/' });

            const browserRes = await page.evaluate((options) => client.keyValueStores().list(options), opts);
            expect(browserRes).toEqual(res);
            validateRequest({ query: opts, path: '/v2/key-value-stores/' });
        });

        test('getOrCreate() works without name', async () => {
            const res = await client.keyValueStores().getOrCreate();
            expect(res.id).toEqual('get-or-create-store');
            validateRequest({});

            const browserRes = await page.evaluate((n) => client.keyValueStores().getOrCreate(n), undefined);
            expect(browserRes).toEqual(res);
            validateRequest({});
        });

        test('getOrCreate() works with name', async () => {
            const name = 'some-id-2';

            const res = await client.keyValueStores().getOrCreate(name);
            expect(res.id).toEqual('get-or-create-store');
            validateRequest({ query: { name } });

            const browserRes = await page.evaluate((n) => client.keyValueStores().getOrCreate(n), name);
            expect(browserRes).toEqual(res);
            validateRequest({ query: { name } });
        });
    });

    describe('keyValueStore(id)', () => {
        test('get() works', async () => {
            const storeId = 'some-id';

            const res = await client.keyValueStore(storeId).get();
            expect(res?.id).toEqual('get-store');
            validateRequest({ query: {}, params: { storeId } });

            const browserRes = await page.evaluate((id) => client.keyValueStore(id).get(), storeId);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { storeId } });
        });

        test('get() returns undefined on 404 status code (RECORD_NOT_FOUND)', async () => {
            const storeId = '404';

            const res = await client.keyValueStore(storeId).get();
            expect(res).toBeUndefined();
            validateRequest({ query: {}, params: { storeId } });

            const browserRes = await page.evaluate((id) => client.keyValueStore(id).get(), storeId);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { storeId } });
        });

        test('delete() works', async () => {
            const storeId = '204';
            const res = await client.keyValueStore(storeId).delete();
            expect(res).toBeUndefined();
            validateRequest({ query: {}, params: { storeId } });

            const browserRes = await page.evaluate((id) => client.keyValueStore(id).delete(), storeId);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { storeId } });
        });

        test('update() works', async () => {
            const storeId = 'some-id';
            const store = { name: 'my-name' };

            const res = await client.keyValueStore(storeId).update(store);
            expect(res.id).toEqual('update-store');
            validateRequest({ query: {}, params: { storeId }, body: store });

            const browserRes = await page.evaluate((id, opts) => client.keyValueStore(id).update(opts), storeId, store);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { storeId }, body: store });
        });

        test('listKeys() works', async () => {
            const storeId = 'some-id';

            const query = {
                limit: 10,
                exclusiveStartKey: 'fromKey',
                collection: 'my-collection',
                prefix: 'my-prefix',
            };

            const res = await client.keyValueStore(storeId).listKeys(query);
            validateRequest({ query, params: { storeId }, path: `/v2/key-value-stores/${storeId}/keys` });

            const browserRes = await page.evaluate(
                (id, opts) => client.keyValueStore(id).listKeys(opts),
                storeId,
                query,
            );
            expect(browserRes).toEqual(res);
            validateRequest({ query, params: { storeId } });
        });

        test('listKeys() passes signature', async () => {
            const storeId = 'some-id';

            const query = {
                limit: 10,
                exclusiveStartKey: 'fromKey',
                collection: 'my-collection',
                prefix: 'my-prefix',
                signature: 'some-signature',
            };

            await client.keyValueStore(storeId).listKeys(query);
            validateRequest({ query, params: { storeId } });

            await page.evaluate((id, opts) => client.keyValueStore(id).listKeys(opts), storeId, query);
            validateRequest({ query, params: { storeId } });
        });

        test('recordExists() works', async () => {
            const key = 'some-key';
            const storeId = 'some-id';

            const expectedBody = null;
            const expectedContentType = 'application/json; charset=utf-8';
            const expectedHeaders = {
                'content-type': expectedContentType,
            };

            mockServer.setResponse({ headers: expectedHeaders, body: expectedBody, status: 200 });

            const res = await client.keyValueStore(storeId).recordExists(key);
            const expectedResult = true;

            expect(res).toEqual(expectedResult);
            validateRequest({ query: {}, params: { storeId, key } });

            const browserRes = await page.evaluate((id, k) => client.keyValueStore(id).recordExists(k), storeId, key);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { storeId, key } });
        });

        test('recordExists() works with a missing record', async () => {
            const key = 'missing-key';
            const storeId = 'some-id';

            const expectedBody = null;
            const expectedContentType = 'application/json; charset=utf-8';
            const expectedHeaders = {
                'content-type': expectedContentType,
            };

            mockServer.setResponse({ headers: expectedHeaders, body: expectedBody, statusCode: 404 });

            const res = await client.keyValueStore(storeId).recordExists(key);
            const expectedResult = false;

            expect(res).toEqual(expectedResult);
            validateRequest({ query: {}, params: { storeId, key } });

            const browserRes = await page.evaluate((id, k) => client.keyValueStore(id).recordExists(k), storeId, key);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { storeId, key } });
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
            validateRequest({ query: {}, params: { storeId, key } });

            const browserRes = await page.evaluate((id, k) => client.keyValueStore(id).getRecord(k), storeId, key);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { storeId, key } });
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
            expect(res?.value).toEqual(expectedBody);
            validateRequest({ query: {}, params: { storeId, key } });

            const browserRes = await page.evaluate((id, k) => client.keyValueStore(id).getRecord(k), storeId, key);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { storeId, key } });
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
            expect(res?.value).toBeInstanceOf(Buffer);
            res!.value = (res!.value as unknown as Buffer).toString();

            expect(res).toEqual(expectedResult);
            validateRequest({ query: {}, params: { storeId, key } });

            const browserRes = await page.evaluate(
                async (id, k, opts) => {
                    const res = await client.keyValueStore(id).getRecord(k, opts);
                    const decoder = new TextDecoder();
                    if (!res) throw new Error('Expected a record response');
                    res.value = decoder.decode(res.value as unknown as BufferSource);
                    return res as any;
                },
                storeId,
                key,
                options,
            );
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { storeId, key } });
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
            expect(res?.value).toBeInstanceOf(Buffer);
            res!.value = (res!.value as unknown as Buffer).toString();
            expect(res).toEqual(expectedResult);
            validateRequest({ query: {}, params: { storeId, key } });

            const browserRes = await page.evaluate(
                async (id, k, opts) => {
                    const res = await client.keyValueStore(id).getRecord(k, opts);
                    const decoder = new TextDecoder();
                    if (!res) throw new Error('Expected a record response');
                    res.value = decoder.decode(res.value as unknown as BufferSource);
                    return res;
                },
                storeId,
                key,
                {},
            );
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { storeId, key } });
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

            expect(res?.value).toBeInstanceOf(Readable);
            const chunks: Buffer[] = [];
            for await (const chunk of res!.value as unknown as Readable) {
                chunks.push(chunk);
            }
            res!.value = Buffer.concat(chunks).toString();
            expect(res).toEqual(expectedResult);
            validateRequest({ query: {}, params: { storeId, key } });

            try {
                await page.evaluate(
                    async (id, k, opts) => {
                        return client.keyValueStore(id).getRecord(k, opts);
                    },
                    storeId,
                    key,
                    options,
                );
                throw new Error('wrong error');
            } catch (err: any) {
                expect(err.message).toMatch('The stream option can only be used in Node.js environment.');
            }
        });

        test('getRecord() correctly passes signature', async () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const options = {
                signature: 'some-signature',
            };

            const body = { foo: 'bar', baz: [1, 2] };
            const expectedContentType = 'application/json; charset=utf-8';
            const expectedHeaders = {
                'content-type': expectedContentType,
            };

            mockServer.setResponse({ headers: expectedHeaders, body });
            await client.keyValueStore(storeId).getRecord(key, options);
            validateRequest({ query: options, params: { storeId, key } });
        });

        test('getRecord() returns undefined on 404 status code (RECORD_NOT_FOUND)', async () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const body = { a: 'foo', b: ['bar1', 'bar2'] };

            mockServer.setResponse({ body, statusCode: 404 });

            const res = await client.keyValueStore(storeId).getRecord(key);
            expect(res).toBeUndefined();
            validateRequest({ query: {}, params: { storeId, key } });

            const browserRes = await page.evaluate((id, k) => client.keyValueStore(id).getRecord(k), storeId, key);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { storeId, key } });
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
            validateRequest({ params: { storeId, key }, body: value, additionalHeaders: expectedHeaders });

            const browserRes = await page.evaluate(
                (id, key, value) => client.keyValueStore(id).setRecord({ key, value }),
                storeId,
                key,
                value,
            );
            expect(browserRes).toBeUndefined();
            validateRequest({ params: { storeId, key }, body: value, additionalHeaders: expectedHeaders });
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
            validateRequest({ params: { storeId, key }, body: value, additionalHeaders: expectedHeaders });

            const browserRes = await page.evaluate(
                (id, key, value) => client.keyValueStore(id).setRecord({ key, value }),
                storeId,
                key,
                value,
            );
            expect(browserRes).toBeUndefined();
            validateRequest({ params: { storeId, key }, body: value, additionalHeaders: expectedHeaders });
        });

        test('setRecord() works with custom timeout options', async () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const value = { foo: 'bar', one: 1 };
            const expectedHeaders = {
                'content-type': 'application/json; charset=utf-8',
            };

            const res = await client.keyValueStore(storeId).setRecord(
                { key, value },
                {
                    timeoutSecs: 1,
                    doNotRetryTimeouts: true,
                },
            );
            expect(res).toBeUndefined();
            validateRequest({ params: { storeId, key }, body: value, additionalHeaders: expectedHeaders });

            const browserRes = await page.evaluate(
                (id, key, value) =>
                    client.keyValueStore(id).setRecord(
                        { key, value },
                        {
                            timeoutSecs: 1,
                            doNotRetryTimeouts: true,
                        },
                    ),
                storeId,
                key,
                value,
            );
            expect(browserRes).toBeUndefined();
            validateRequest({ params: { storeId, key }, body: value, additionalHeaders: expectedHeaders });
        });

        test('setRecord() works with buffer', async () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const string = 'special chars 🤖✅';
            const value = Buffer.from(string);
            const expectedHeaders = {
                'content-type': 'application/octet-stream',
            };

            // required cast -
            const res = await client.keyValueStore(storeId).setRecord({ key, value: value as any });
            expect(res).toBeUndefined();
            validateRequest({ params: { storeId, key }, body: value, additionalHeaders: expectedHeaders });

            const browserRes = await page.evaluate(
                async (id, key, s) => {
                    const encoder = new TextEncoder();
                    const value = encoder.encode(s);
                    return client.keyValueStore(id).setRecord({ key, value } as any);
                },
                storeId,
                key,
                string,
            );
            expect(browserRes).toBeUndefined();
            validateRequest({ params: { storeId, key }, body: value, additionalHeaders: expectedHeaders });
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
            validateRequest({ params: { storeId, key }, body: JSON.parse(value), additionalHeaders: expectedHeaders });

            const browserRes = await page.evaluate(
                (id, key, value, contentType) => client.keyValueStore(id).setRecord({ key, value, contentType }),
                storeId,
                key,
                value,
                contentType,
            );
            expect(browserRes).toBeUndefined();
            validateRequest({ params: { storeId, key }, body: JSON.parse(value), additionalHeaders: expectedHeaders });
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
            validateRequest({
                params: { storeId, key },
                body: value,
                additionalHeaders: {
                    'content-type': contentType,
                    'content-encoding': 'gzip',
                },
            });

            const browserRes = await page.evaluate(
                (id, key, value) => client.keyValueStore(id).setRecord({ key, value }),
                storeId,
                key,
                value,
            );
            expect(browserRes).toBeUndefined();
            validateRequest({
                params: { storeId, key },
                body: value,
                additionalHeaders: {
                    'content-type': contentType,
                },
            });
        });

        test('deleteRecord() works', async () => {
            const key = 'some-key';
            const storeId = '204';

            const res = await client.keyValueStore(storeId).deleteRecord(key);
            expect(res).toBeUndefined();
            validateRequest({ query: {}, params: { storeId, key } });

            const browserRes = await page.evaluate((id, k) => client.keyValueStore(id).deleteRecord(k), storeId, key);
            expect(browserRes).toBeUndefined();
            validateRequest({ query: {}, params: { storeId, key } });
        });

        describe('getRecordPublicUrl()', () => {
            it.each([
                ['https://custom.public.url/', 'custom.public.url'],
                [undefined, 'api.apify.com'],
            ])('respects publicBaseUrl client option (%s)', async (publicBaseUrl, expectedHostname) => {
                const storeId = 'some-id';
                const key = 'some-key';

                client = new ApifyClient({
                    baseUrl,
                    publicBaseUrl,
                    ...DEFAULT_OPTIONS,
                });

                const res = await client.keyValueStore(storeId).getRecordPublicUrl(key);

                const url = new URL(res);
                expect(url.hostname).toBe(expectedHostname);
                expect(url.pathname).toBe(`/v2/key-value-stores/${storeId}/records/${key}`);
            });

            it('should include a signature in the URL when the caller has permission to access the signing secret key', async () => {
                const storeId = 'id-with-secret-key';
                const key = 'some-key';
                const res = await client.keyValueStore(storeId).getRecordPublicUrl(key);

                const url = new URL(res);
                expect(url.searchParams.get('signature')).toBeDefined();
                expect(url.pathname).toBe(`/v2/key-value-stores/${storeId}/records/${key}`);

                const browserRes = await page.evaluate(
                    ({ storeId, key }) => client.keyValueStore(storeId).getRecordPublicUrl(key),
                    { storeId, key },
                );
                expect(browserRes).toEqual(res);
            });

            it('should not include a signature in the URL when the caller lacks permission to access the signing secret key', async () => {
                const storeId = 'some-id';
                const key = 'some-key';
                const res = await client.keyValueStore(storeId).getRecordPublicUrl(key);

                const url = new URL(res);
                expect(url.searchParams.get('signature')).toBeNull();
                expect(url.pathname).toBe(`/v2/key-value-stores/${storeId}/records/${key}`);

                const browserRes = await page.evaluate(
                    ({ storeId, key }) => client.keyValueStore(storeId).getRecordPublicUrl(key),
                    { storeId, key },
                );
                expect(browserRes).toEqual(res);
            });
        });

        describe('createKeysPublicUrl()', () => {
            it.each([
                ['https://custom.public.url/', 'custom.public.url'],
                [undefined, 'api.apify.com'],
            ])('respects publicBaseUrl client option (%s)', async (publicBaseUrl, expectedHostname) => {
                const storeId = 'some-id';

                client = new ApifyClient({
                    baseUrl,
                    publicBaseUrl,
                    ...DEFAULT_OPTIONS,
                });

                const res = await client.keyValueStore(storeId).createKeysPublicUrl();

                const url = new URL(res);
                expect(url.hostname).toBe(expectedHostname);
                expect(url.pathname).toBe(`/v2/key-value-stores/${storeId}/keys`);
            });

            it('should include a signature in the URL when the caller has permission to access the signing secret key', async () => {
                const storeId = 'id-with-secret-key';
                const res = await client.keyValueStore(storeId).createKeysPublicUrl();

                const url = new URL(res);
                expect(url.searchParams.get('signature')).toBeDefined();
                expect(url.pathname).toBe(`/v2/key-value-stores/${storeId}/keys`);

                const browserRes = await page.evaluate((id) => client.keyValueStore(id).createKeysPublicUrl(), storeId);
                expect(browserRes).toEqual(res);
            });

            it('should not include a signature in the URL when the caller lacks permission to access the signing secret key', async () => {
                const storeId = 'some-id';
                const res = await client.keyValueStore(storeId).createKeysPublicUrl();

                const url = new URL(res);
                expect(url.searchParams.get('signature')).toBeNull();
                expect(url.pathname).toBe(`/v2/key-value-stores/${storeId}/keys`);

                const browserRes = await page.evaluate((id) => client.keyValueStore(id).createKeysPublicUrl(), storeId);
                expect(browserRes).toEqual(res);
            });

            it('includes provided options (e.g., limit and prefix) as query parameters', async () => {
                const storeId = 'id-with-secret-key';
                const res = await client.keyValueStore(storeId).createKeysPublicUrl({ limit: 10, prefix: 'prefix' });
                const keysPublicUrl = new URL(res);

                expect(keysPublicUrl.searchParams.get('limit')).toBe('10');
                expect(keysPublicUrl.searchParams.get('prefix')).toBe('prefix');
                expect(keysPublicUrl.searchParams.get('signature')).toBeDefined();
                expect(keysPublicUrl.pathname).toBe(`/v2/key-value-stores/${storeId}/keys`);
            });
        });
    });
});
