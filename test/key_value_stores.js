import { expect } from 'chai';
import { gzipSync } from 'zlib';
import ApifyClient from '../build';
import mockServer from './mock_server/server';
import { cleanUpBrowser, getInjectedPage, validateRequest, DEFAULT_QUERY } from './_helper';

describe('KeyValueStores methods', () => {
    let baseUrl = null;
    let page;
    before(async () => {
        const server = await mockServer.start(3333);
        baseUrl = `http://localhost:${server.address().port}`;
    });
    after(() => mockServer.close());

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
        xit('should work with storeId in default params', () => {
            // TODO: DO we want to keep the support for the default params?

        });

        it('should work with storeId in method call params', async () => {
            const storeId = 'some-id-3';

            const res = await client.keyValueStores.getStore({ storeId });
            expect(res.id).to.be.eql('get-store');
            validateRequest({}, { storeId });

            const browserRes = await page.evaluate(opts => client.keyValueStores.getStore(opts), { storeId });
            expect(browserRes).to.eql(res);
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

            const browserRes = await page.evaluate(opts => client.keyValueStores.getOrCreateStore(opts), storeOptions);
            expect(browserRes).to.eql(res);
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

            const browserRes = await page.evaluate(opts => client.keyValueStores.listStores(opts), callOptions);
            expect(browserRes).to.eql(res);
            validateRequest(queryString, {});
        });

        it('getStore() works', async () => {
            const storeId = 'some-id-3';

            const res = await client.keyValueStores.getStore({ storeId });
            expect(res.id).to.be.eql('get-store');
            validateRequest({}, { storeId });

            const browserRes = await page.evaluate(opts => client.keyValueStores.getStore(opts), { storeId });
            expect(browserRes).to.eql(res);
            validateRequest({}, { storeId });
        });

        it('getStore() returns null on 404 status code (RECORD_NOT_FOUND)', async () => {
            const storeId = '404';
            const res = await client.keyValueStores.getStore({ storeId });
            expect(res).to.be.eql(null);
            validateRequest({}, { storeId });

            const browserRes = await page.evaluate(opts => client.keyValueStores.getStore(opts), { storeId });
            expect(browserRes).to.eql(res);
            validateRequest({}, { storeId });
        });

        it('updateStore() works', async () => {
            const storeId = 'some-id';
            const store = { id: storeId, name: 'my-name' };

            const res = await client.keyValueStores.updateStore({ storeId, store });
            expect(res.id).to.be.eql('update-store');
            validateRequest({}, { storeId }, { name: store.name });

            const browserRes = await page.evaluate(opts => client.keyValueStores.updateStore(opts), { storeId, store });
            expect(browserRes).to.eql(res);
            validateRequest({}, { storeId }, { name: store.name });
        });


        it('deleteStore() works', async () => {
            const storeId = '204';
            const res = await client.keyValueStores.deleteStore({ storeId });
            expect(res).to.be.eql('');
            validateRequest({}, { storeId });

            const browserRes = await page.evaluate(opts => client.keyValueStores.deleteStore(opts), { storeId });
            expect(browserRes).to.eql(res);
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

            await page.evaluate(opts => client.keyValueStores.getRecord(opts), { storeId, key });
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

            const browserRes = await page.evaluate(opts => client.keyValueStores.getRecord(opts), { storeId, key });
            expect(browserRes).to.eql(res);
        });

        it('getRecord() doesn\'t parse application/json when disableBodyParser = true', async () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const body = { a: 'foo', b: ['bar1', 'bar2'] };
            const contentType = 'application/json';

            mockServer.setResponse({ headers: { 'content-type': contentType }, body });

            const res = await client.keyValueStores.getRecord({ storeId, key, disableBodyParser: true });
            expect(res).to.be.eql(JSON.stringify(body));

            const browserRes = await page.evaluate(opts => client.keyValueStores.getRecord(opts), {
                storeId,
                key,
                disableBodyParser: true,
            });
            expect(browserRes).to.eql(res);
        });

        it('getRecord() returns null on 404 status code (RECORD_NOT_FOUND)', async () => {
            const key = 'some-key';
            const storeId = 'some-id';
            const body = { a: 'foo', b: ['bar1', 'bar2'] };

            mockServer.setResponse({ body, statusCode: 404 });

            const res = await client.keyValueStores.getRecord({ storeId, key, disableBodyParser: true });
            expect(res).to.be.eql(null);

            const browserRes = await page.evaluate(opts => client.keyValueStores.getRecord(opts), {
                storeId,
                key,
                disableBodyParser: true,
            });
            expect(browserRes).to.eql(res);
        });

        it('putRecord() works', async () => {
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
            expect(res).to.be.eql(body);

            const browserRes = await page.evaluate(opts => client.keyValueStores.putRecord(opts), {
                storeId,
                key,
                contentType,
                body,
            });
            expect(browserRes).to.eql(res);
        });

        xit('putRecord() uploads via signed url when gzipped buffer.length > SIGNED_URL_UPLOAD_MIN_BYTESIZE', () => {
            // TODO: I have no idea how to test this using this mock flow :(
        });

        it('deleteRecord() works', async () => {
            const key = 'some-key';
            const storeId = '204';

            const res = await client.keyValueStores.deleteRecord({ storeId, key });
            expect(res).to.be.eql('');
            validateRequest({}, { storeId, key });

            const browserRes = await page.evaluate(opts => client.keyValueStores.deleteRecord(opts), { storeId, key });
            expect(browserRes).to.eql(res);
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

            const browserRes = await page.evaluate(opts => client.keyValueStores.listKeys(opts), { storeId, ...query });
            expect(browserRes).to.eql(res);
            validateRequest(query, { storeId });
        });
    });
});
