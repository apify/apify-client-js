import { gzipSync } from 'zlib';
import ApifyClient from '../build';
import mockServer from './mock_server/server';
import { cleanUpBrowser, getInjectedPage, validateRequest, DEFAULT_QUERY } from './_helper';

describe('KeyValueStores methods', () => {
    let baseUrl = null;
    let page;
    beforeAll(async () => {
        const server = await mockServer.start(3333);
        baseUrl = `http://localhost:${server.address().port}`;
    });
    afterAll(() => mockServer.close());

    let client = null;
    beforeEach(async () => {
        page = await getInjectedPage(baseUrl, DEFAULT_QUERY);

        client = new ApifyClient({
            baseUrl,
            expBackoffMaxRepeats: 0,
            expBackoffMillis: 1,
            ...DEFAULT_QUERY,
        });
    });

    afterEach(async () => {
        client = null;
        await cleanUpBrowser(page);
    });

    describe('indentification', () => {
        test.skip('should work with storeId in default params', () => {
            // TODO: DO we want to keep the support for the default params?

        });

        test('should work with storeId in method call params', async () => {
            const storeId = 'some-id-3';

            const res = await client.keyValueStores.getStore({ storeId });
            expect(res.id).toEqual('get-store');
            validateRequest({}, { storeId });

            const browserRes = await page.evaluate(opts => client.keyValueStores.getStore(opts), { storeId });
            expect(browserRes).toEqual(res);
            validateRequest({}, { storeId });
        });

        test('should work with token and storeName', async () => {
            const storeOptions = {
                token: 'sometoken',
                storeName: 'somename',
            };

            const res = await client.keyValueStores.getOrCreateStore(storeOptions);
            expect(res.id).toEqual('get-or-create-store');
            validateRequest({ token: storeOptions.token, name: storeOptions.storeName }, {});

            const browserRes = await page.evaluate(opts => client.keyValueStores.getOrCreateStore(opts), storeOptions);
            expect(browserRes).toEqual(res);
            validateRequest({ token: storeOptions.token, name: storeOptions.storeName }, {});
        });
    });

    describe('REST method', () => {
        test('listStores() works', async () => {
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
            expect(res.id).toEqual('list-stores');
            validateRequest(queryString, {});

            const browserRes = await page.evaluate(opts => client.keyValueStores.listStores(opts), callOptions);
            expect(browserRes).toEqual(res);
            validateRequest(queryString, {});
        });

        test('getStore() works', async () => {
            const storeId = 'some-id-3';

            const res = await client.keyValueStores.getStore({ storeId });
            expect(res.id).toEqual('get-store');
            validateRequest({}, { storeId });

            const browserRes = await page.evaluate(opts => client.keyValueStores.getStore(opts), { storeId });
            expect(browserRes).toEqual(res);
            validateRequest({}, { storeId });
        });

        test(
            'getStore() returns null on 404 status code (RECORD_NOT_FOUND)',
            async () => {
                const storeId = '404';
                const res = await client.keyValueStores.getStore({ storeId });
                expect(res).toEqual(null);
                validateRequest({}, { storeId });

                const browserRes = await page.evaluate(opts => client.keyValueStores.getStore(opts), { storeId });
                expect(browserRes).toEqual(res);
                validateRequest({}, { storeId });
            },
        );

        test('updateStore() works', async () => {
            const storeId = 'some-id';
            const store = { id: storeId, name: 'my-name' };

            const res = await client.keyValueStores.updateStore({ storeId, store });
            expect(res.id).toEqual('update-store');
            validateRequest({}, { storeId }, { name: store.name });

            const browserRes = await page.evaluate(opts => client.keyValueStores.updateStore(opts), { storeId, store });
            expect(browserRes).toEqual(res);
            validateRequest({}, { storeId }, { name: store.name });
        });


        test('deleteStore() works', async () => {
            const storeId = '204';
            const res = await client.keyValueStores.deleteStore({ storeId });
            expect(res).toEqual('');
            validateRequest({}, { storeId });

            const browserRes = await page.evaluate(opts => client.keyValueStores.deleteStore(opts), { storeId });
            expect(browserRes).toEqual(res);
            validateRequest({}, { storeId });
        });

        test('getRecord() works', async () => {
            const key = 'some-key';
            const storeId = 'some-id';

            const body = { a: 'foo', b: ['bar1', 'bar2'] };
            const contentType = 'application/json';

            mockServer.setResponse({ headers: { 'content-type': contentType }, body });

            await client.keyValueStores.getRecord({ storeId, key });
            validateRequest({}, { storeId, key });

            await page.evaluate(opts => client.keyValueStores.getRecord(opts), { storeId, key });
            validateRequest({}, { storeId, key });
        });

        test('getRecord() parses JSON', async () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const body = { a: 'foo', b: ['bar1', 'bar2'] };
            const contentType = 'application/json';

            mockServer.setResponse({ headers: { 'content-type': contentType }, body });

            const res = await client.keyValueStores.getRecord({ storeId, key });
            expect(res.body).toEqual(body);

            const browserRes = await page.evaluate(opts => client.keyValueStores.getRecord(opts), { storeId, key });
            expect(browserRes).toEqual(res);
        });

        test(
            'getRecord() doesn\'t parse application/json when disableBodyParser = true',
            async () => {
                const key = 'some-key';
                const storeId = 'some-id';
                const body = { a: 'foo', b: ['bar1', 'bar2'] };
                const contentType = 'application/json';

                mockServer.setResponse({ headers: { 'content-type': contentType }, body });

                const res = await client.keyValueStores.getRecord({ storeId, key, disableBodyParser: true });
                expect(res.body).toEqual(JSON.stringify(body));

                const browserRes = await page.evaluate(opts => client.keyValueStores.getRecord(opts), {
                    storeId,
                    key,
                    disableBodyParser: true,
                });
                expect(browserRes).toEqual(res);
            },
        );

        test(
            'getRecord() returns null on 404 status code (RECORD_NOT_FOUND)',
            async () => {
                const key = 'some-key';
                const storeId = 'some-id';
                const body = { a: 'foo', b: ['bar1', 'bar2'] };

                mockServer.setResponse({ body, statusCode: 404 });

                const res = await client.keyValueStores.getRecord({ storeId, key, disableBodyParser: true });
                expect(res).toEqual(null);

                const browserRes = await page.evaluate(opts => client.keyValueStores.getRecord(opts), {
                    storeId,
                    key,
                    disableBodyParser: true,
                });
                expect(browserRes).toEqual(res);
            },
        );

        test('putRecord() works', async () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const contentType = 'text/plain';
            const body = 'someValue';

            mockServer.setResponse({
                body: gzipSync(body),
                headers: {
                    'Content-Type': contentType,
                    'Content-Encoding': 'gzip',
                },
            });

            const res = await client.keyValueStores.putRecord({ storeId, key, contentType, body });
            expect(res).toEqual(body);

            const browserRes = await page.evaluate(opts => client.keyValueStores.putRecord(opts), {
                storeId,
                key,
                contentType,
                body,
            });
            expect(browserRes).toEqual(res);
        });

        test('putRecord() works with buffer', async () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const contentType = 'text/plain';
            const body = Buffer.from('someValue');

            mockServer.setResponse({
                body,
                headers: {
                    'Content-Type': contentType,
                },
            });

            const res = await client.keyValueStores.putRecord({ storeId, key, contentType, body });
            expect(res).toEqual(body.toString());
        });

        test.skip('putRecord() uploads via signed url when gzipped buffer.length > SIGNED_URL_UPLOAD_MIN_BYTESIZE', () => {
            // TODO: I have no idea how to test this using this mock flow :(
        });

        test('deleteRecord() works', async () => {
            const key = 'some-key';
            const storeId = '204';

            const res = await client.keyValueStores.deleteRecord({ storeId, key });
            expect(res).toEqual('');
            validateRequest({}, { storeId, key });

            const browserRes = await page.evaluate(opts => client.keyValueStores.deleteRecord(opts), { storeId, key });
            expect(browserRes).toEqual(res);
            validateRequest({}, { storeId, key });
        });

        test('listKeys() works', async () => {
            const storeId = 'some-id';

            const query = {
                limit: 10,
                exclusiveStartKey: 'fromKey',
            };

            const res = await client.keyValueStores.listKeys({ storeId, ...query });
            expect(res.id).toEqual('list-keys');
            validateRequest(query, { storeId });

            const browserRes = await page.evaluate(opts => client.keyValueStores.listKeys(opts), { storeId, ...query });
            expect(browserRes).toEqual(res);
            validateRequest(query, { storeId });
        });
    });
});
