const { Browser, validateRequest, DEFAULT_OPTIONS } = require('./_helper');
const mockServer = require('./mock_server/server');
const { ApifyClient } = require('../src');
const { stringifyWebhooksToBase64 } = require('../src/utils');

describe('Actor methods', () => {
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

    describe('actors()', () => {
        test('list() works', async () => {
            const opts = {
                limit: 5,
                offset: 3,
                desc: true,
                my: true,
            };

            const res = await client.actors().list(opts);
            expect(res.id).toEqual('list-actors');
            validateRequest(opts);

            const browserRes = await page.evaluate((options) => client.actors().list(options), opts);
            expect(browserRes).toEqual(res);
            validateRequest(opts);
        });

        test('create() works', async () => {
            const actor = { foo: 'bar' };

            const res = await client.actors().create(actor);
            expect(res.id).toEqual('create-actor');
            validateRequest({}, {}, actor);
            const browserRes = await page.evaluate((opts) => client.actors().create(opts), actor);
            expect(browserRes).toEqual(res);
            validateRequest({}, {}, actor);
        });
    });

    describe('actor(id)', () => {
        test('update() works', async () => {
            const actorId = 'some-user/some-id';
            const newFields = { foo: 'bar' };

            const res = await client.actor(actorId).update(newFields);
            expect(res.id).toEqual('update-actor');
            validateRequest({}, { actorId: 'some-user~some-id' }, newFields);

            const browserRes = await page.evaluate((id, opts) => client.actor(id).update(opts), actorId, newFields);
            expect(browserRes).toEqual(res);
            validateRequest({}, { actorId: 'some-user~some-id' }, newFields);
        });

        test('get() works', async () => {
            const actorId = 'some-id';

            const res = await client.actor(actorId).get();
            expect(res.id).toEqual('get-actor');
            validateRequest({}, { actorId });

            const browserRes = await page.evaluate((id) => client.actor(id).get(), actorId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { actorId });
        });

        test('get() returns undefined on 404 status code (RECORD_NOT_FOUND)', async () => {
            const actorId = '404';

            const res = await client.actor(actorId).get();
            expect(res).toBeUndefined();
            validateRequest({}, { actorId });

            const browserRes = await page.evaluate((id) => client.actor(id).get(), actorId);
            expect(browserRes).toEqual(res);
            validateRequest({}, { actorId });
        });

        test('delete() works', async () => {
            const actorId = '204';
            const res = await client.actor(actorId).delete();
            expect(res).toBeUndefined();
            validateRequest({}, { actorId });

            await page.evaluate((id) => client.actor(id).delete(), actorId);
            validateRequest({}, { actorId });
        });

        test('start() works', async () => {
            const actorId = 'some-id';
            const contentType = 'application/x-www-form-urlencoded';
            const input = 'some=body';

            const query = {
                timeout: 120,
                memory: 256,
                build: '1.2.0',
            };

            const res = await client.actor(actorId).start(input, { contentType, ...query });
            expect(res.id).toEqual('run-actor');
            validateRequest(query, { actorId }, { some: 'body' }, { 'content-type': contentType });

            const browserRes = await page.evaluate((id, i, opts) => client.actor(id).start(i, opts), actorId, input, { contentType, ...query });
            expect(browserRes).toEqual(res);
            validateRequest(query, { actorId }, { some: 'body' }, { 'content-type': contentType });
        });

        test('start() works with pre-stringified JSON', async () => {
            const actorId = 'some-id';
            const contentType = 'application/json; charset=utf-8';
            const input = JSON.stringify({ some: 'body' });

            const res = await client.actor(actorId).start(input, { contentType });
            expect(res.id).toEqual('run-actor');
            validateRequest({}, { actorId }, { some: 'body' }, { 'content-type': contentType });

            const browserRes = await page.evaluate((id, i, opts) => client.actor(id).start(i, opts), actorId, input, { contentType });
            expect(browserRes).toEqual(res);
            validateRequest({}, { actorId }, { some: 'body' }, { 'content-type': contentType });
        });

        test('start() works with functions in input', async () => {
            const actorId = 'some-id';
            const input = {
                foo: 'bar',
                fn: async (a, b) => a + b,
            };

            const expectedRequestProps = [
                {},
                { actorId },
                { foo: 'bar', fn: input.fn.toString() },
                { 'content-type': 'application/json' },
            ];

            const res = await client.actor(actorId).start(input);
            expect(res.id).toEqual('run-actor');
            validateRequest(...expectedRequestProps);

            const browserRes = await page.evaluate((id) => {
                return client.actor(id).start({
                    foo: 'bar',
                    fn: async (a, b) => a + b,
                });
            }, actorId);
            expect(browserRes).toEqual(res);
            validateRequest(...expectedRequestProps);
        });

        test('start() with webhook works', async () => {
            const actorId = 'some-id';
            const webhooks = [
                {
                    eventTypes: ['ACTOR.RUN.CREATED'],
                    requestUrl: 'https://example.com/run-created',
                },
                {
                    eventTypes: ['ACTOR.RUN.SUCCEEDED'],
                    requestUrl: 'https://example.com/run-succeeded',
                },
            ];

            const res = await client.actor(actorId).start(undefined, { webhooks });
            expect(res.id).toEqual('run-actor');
            validateRequest({ webhooks: stringifyWebhooksToBase64(webhooks) }, { actorId });

            const browserRes = await page.evaluate((id, opts) => client.actor(id).start(undefined, opts), actorId, { webhooks });
            expect(browserRes).toEqual(res);
            validateRequest({ webhooks: stringifyWebhooksToBase64(webhooks) }, { actorId });
        });

        test('start() with max items works', async () => {
            const actorId = 'some-id';

            const res = await client.actor(actorId).start(undefined, { maxItems: 100 });
            expect(res.id).toEqual('run-actor');
            validateRequest({ maxItems: 100 }, { actorId });

            const browserRes = await page.evaluate((id, opts) => client.actor(id).start(undefined, opts), actorId, { maxItems: 100 });
            expect(browserRes).toEqual(res);
            validateRequest({ maxItems: 100 }, { actorId });
        });

        test('call() works', async () => {
            const actorId = 'some-id';
            const contentType = 'application/x-www-form-urlencoded';
            const input = 'some=body';
            const timeout = 120;
            const memory = 256;
            const build = '1.2.0';
            const runId = 'started-run-id';
            const data = { id: runId, actId: actorId, status: 'SUCCEEDED' };
            const body = { data };
            const waitSecs = 1;

            mockServer.setResponse({ body });
            const res = await client.actor(actorId).call(input, {
                contentType,
                memory,
                timeout,
                build,
                waitSecs,
            });

            expect(res).toEqual(data);
            validateRequest({ waitForFinish: waitSecs }, { runId });
            validateRequest({
                timeout,
                memory,
                build,
            }, { actorId }, { some: 'body' }, { 'content-type': contentType });

            const callBrowserRes = await page.evaluate(
                (id, i, opts) => client.actor(id).call(i, opts), actorId, input, {
                    contentType,
                    memory,
                    timeout,
                    build,
                    waitSecs,
                },
            );
            expect(callBrowserRes).toEqual(res);
            validateRequest({ waitForFinish: waitSecs }, { runId });
            validateRequest({
                timeout,
                memory,
                build,
            }, { actorId }, { some: 'body' }, { 'content-type': contentType });
        });

        test('call() works with maxItems', async () => {
            const actorId = 'some-id';
            const runId = 'started-run-id';
            const data = { id: runId, actId: actorId, status: 'SUCCEEDED' };
            const body = { data };
            const waitSecs = 1;
            const maxItems = 100;

            mockServer.setResponse({ body });
            const res = await client.actor(actorId).call(undefined, { waitSecs, maxItems });

            expect(res).toEqual(data);
            validateRequest({ waitForFinish: waitSecs }, { runId });
            validateRequest({ maxItems }, { actorId });

            const callBrowserRes = await page.evaluate(
                (id, i, opts) => client.actor(id).call(i, opts), actorId, undefined, {
                    waitSecs,
                    maxItems,
                },
            );
            expect(callBrowserRes).toEqual(res);
            validateRequest({ waitForFinish: waitSecs }, { runId });
            validateRequest({ maxItems }, { actorId });
        });

        test('build() works', async () => {
            const actorId = 'some-id';

            const version = '0.0';
            const options = {
                betaPackages: true,
                waitForFinish: 120,
                tag: 'latest',
                useCache: true,
            };

            const res = await client.actor(actorId).build(version, options);
            expect(res.id).toEqual('build-actor');
            validateRequest({ version, ...options }, { actorId });

            const browserRes = await page.evaluate((aId, v, opts) => client.actor(aId).build(v, opts), actorId, version, options);
            expect(browserRes).toEqual(res);
            validateRequest({ version, ...options }, { actorId });
        });

        describe('lastRun()', () => {
            test.each([
                'get',
                'dataset',
                'keyValueStore',
                'requestQueue',
                'log',
            ])('%s() works', async (method) => {
                const actorId = 'some-actor-id';
                const requestedStatus = 'SUCCEEDED';

                const lastRunClient = client.actor(actorId).lastRun({ status: requestedStatus });
                const res = method === 'get'
                    ? await lastRunClient.get()
                    : await lastRunClient[method]().get();

                if (method === 'log') {
                    expect(res).toEqual('last-run-log');
                } else {
                    expect(res.id).toEqual(`last-run-${method}`);
                }
                validateRequest({ status: requestedStatus }, { actorId });

                const browserRes = await page.evaluate((aId, mthd) => {
                    const lrc = client.actor(aId).lastRun();
                    if (mthd === 'get') return lrc.get();
                    return lrc[mthd]().get();
                }, actorId, method);
                expect(browserRes).toEqual(res);
                validateRequest({}, { actorId });
            });
        });

        test('builds().list() works', async () => {
            const actorId = 'some-id';

            const query = {
                limit: 5,
                offset: 3,
                desc: true,
            };

            const res = await client.actor(actorId).builds().list(query);
            expect(res.id).toEqual('list-builds');
            validateRequest(query, { actorId });

            const browserRes = await page.evaluate((aId, opts) => client.actor(aId).builds().list(opts), actorId, query);
            expect(browserRes).toEqual(res);
            validateRequest(query, { actorId });
        });

        test('runs().list() works', async () => {
            const actorId = 'some-id';

            const query = {
                limit: 5,
                offset: 3,
                desc: true,
            };

            const res = await client.actor(actorId).runs().list(query);
            expect(res.id).toEqual('list-runs');
            validateRequest(query, { actorId });

            const browserRes = await page.evaluate((aId, opts) => client.actor(aId).runs().list(opts), actorId, query);
            expect(browserRes).toEqual(res);
            validateRequest(query, { actorId });
        });

        describe('versions()', () => {
            test('list() works', async () => {
                const actorId = 'some-id';

                const res = await client.actor(actorId).versions().list();
                expect(res.id).toEqual('list-actor-versions');
                validateRequest({}, { actorId });

                const browserRes = await page.evaluate((id) => client.actor(id).versions().list(), actorId);
                expect(browserRes).toEqual(res);
                validateRequest({}, { actorId });
            });

            test('create() works', async () => {
                const actorId = 'some-id';
                const actorVersion = {
                    versionNumber: '0.0',
                    foo: 'bar',
                };

                const res = await client.actor(actorId).versions().create(actorVersion);
                expect(res.id).toEqual('create-actor-version');
                validateRequest({}, { actorId }, actorVersion);

                const browserRes = await page.evaluate((id, opts) => client.actor(id).versions().create(opts), actorId, actorVersion);
                expect(browserRes).toEqual(res);
                validateRequest({}, { actorId }, actorVersion);
            });
        });

        describe('version()', () => {
            test('get() works', async () => {
                const actorId = 'some-id';
                const versionNumber = '0.0';

                const res = await client.actor(actorId).version(versionNumber).get();
                expect(res.id).toEqual('get-actor-version');
                validateRequest({}, { actorId, versionNumber });

                const browserRes = await page.evaluate((id, vn) => client.actor(id).version(vn).get(), actorId, versionNumber);
                expect(browserRes).toEqual(res);
                validateRequest({}, { actorId, versionNumber });
            });

            test('get() works if version did not exist', async () => {
                const actorId = '404';
                const versionNumber = '0.0';

                const res = await client.actor(actorId).version(versionNumber).get();
                expect(res).toBeUndefined();
                validateRequest({}, { actorId, versionNumber });

                const browserRes = await page.evaluate((id, vn) => client.actor(id).version(vn).get(), actorId, versionNumber);
                expect(browserRes).toEqual(res);
                validateRequest({}, { actorId, versionNumber });
            });

            test('update() works', async () => {
                const actorId = 'some-user/some-id';
                const versionNumber = '0.0';
                const newFields = {
                    foo: 'bar',
                };

                const res = await client.actor(actorId).version(versionNumber).update(newFields);
                expect(res.id).toEqual('update-actor-version');
                validateRequest({}, { actorId: 'some-user~some-id', versionNumber }, newFields);

                const browserRes = await page.evaluate((id, vn, nf) => client.actor(id).version(vn).update(nf), actorId, versionNumber, newFields);
                expect(browserRes).toEqual(res);
                validateRequest({}, { actorId: 'some-user~some-id', versionNumber }, newFields);
            });

            test('delete() works', async () => {
                const actorId = '204';
                const versionNumber = '0.0';

                const res = await client.actor(actorId).version(versionNumber).delete();
                expect(res).toBeUndefined();
                validateRequest({}, { actorId, versionNumber });

                const browserRes = await page.evaluate((id, vn) => client.actor(id).version(vn).delete(), actorId, versionNumber);
                expect(browserRes).toEqual(res);
                validateRequest({}, { actorId, versionNumber });
            });
        });

        describe('envVars()', () => {
            test('list() works', async () => {
                const actorId = 'some-id';
                const versionNumber = '0.1';

                const res = await client.actor(actorId).version(versionNumber).envVars().list();
                expect(res.id).toEqual('list-actor-env-vars');
                validateRequest({}, { actorId, versionNumber });

                const browserRes = await page.evaluate((aId, vn) => client.actor(aId).version(vn).envVars().list(), actorId, versionNumber);
                expect(browserRes).toEqual(res);
                validateRequest({}, { actorId, versionNumber });
            });

            test('create() works', async () => {
                const actorId = 'some-id';
                const versionNumber = '0.1';
                const actorEnvVar = {
                    name: 'TEST_ENV_VAR',
                    value: 123,
                };

                const res = await client.actor(actorId).version(versionNumber).envVars().create(actorEnvVar);
                expect(res.id).toEqual('create-actor-env-var');
                validateRequest({}, { actorId, versionNumber }, actorEnvVar);

                const browserRes = await page.evaluate(
                    (aId, vn, ev) => client.actor(aId).version(vn).envVars().create(ev), actorId, versionNumber, actorEnvVar,
                );
                expect(browserRes).toEqual(res);
                validateRequest({}, { actorId, versionNumber }, actorEnvVar);
            });
        });

        describe('envVar()', () => {
            test('get() works', async () => {
                const actorId = 'some-id';
                const versionNumber = '0.0';
                const envVarName = 'TEST_ENV_VAR';

                const res = await client.actor(actorId).version(versionNumber).envVar(envVarName).get();
                expect(res.id).toEqual('get-actor-env-var');
                validateRequest({}, { actorId, versionNumber, envVarName });

                const browserRes = await page.evaluate(
                    (aId, vn, evn) => client.actor(aId).version(vn).envVar(evn).get(), actorId, versionNumber, envVarName,
                );
                expect(browserRes).toEqual(res);
                validateRequest({}, { actorId, versionNumber, envVarName });
            });

            test('get() works if envVar did not exist', async () => {
                const actorId = '404'; // this will make the mock API return 404. Must be the first param.
                const versionNumber = '0.0';
                const envVarName = 'TEST_ENV_VAR';

                const res = await client.actor(actorId).version(versionNumber).envVar(envVarName).get();
                expect(res).toBeUndefined();
                validateRequest({}, { actorId, versionNumber, envVarName });

                const browserRes = await page.evaluate(
                    (aId, vn, evn) => client.actor(aId).version(vn).envVar(evn).get(), actorId, versionNumber, envVarName,
                );
                expect(browserRes).toEqual(res);
                validateRequest({}, { actorId, versionNumber, envVarName });
            });

            test('update() works', async () => {
                const actorId = 'some-user/some-id';
                const versionNumber = '0.0';
                const envVarName = 'TEST_UPDATE_ENV_VAR';
                const envVar = {
                    name: 'TEST_UPDATE_ENV_VAR',
                    value: 123,
                };

                const res = await client.actor(actorId).version(versionNumber).envVar(envVarName).update(envVar);
                expect(res.id).toEqual('update-actor-env-var');
                validateRequest({}, { actorId: 'some-user~some-id', versionNumber, envVarName }, envVar);

                const browserRes = await page.evaluate(
                    (id, vn, evn, uev) => client.actor(id).version(vn).envVar(evn).update(uev), actorId, versionNumber, envVarName, envVar,
                );
                expect(browserRes).toEqual(res);
                validateRequest({}, { actorId: 'some-user~some-id', versionNumber, envVarName }, envVar);
            });

            test('delete() works', async () => {
                const actorId = '204';
                const versionNumber = '0.0';
                const envVarName = 'TEST_ENV_VAR_TO_DELETE';

                const res = await client.actor(actorId).version(versionNumber).envVar(envVarName).delete();
                expect(res).toBeUndefined();
                validateRequest({}, { actorId, versionNumber, envVarName });

                const browserRes = await page.evaluate(
                    (id, vn, evn) => client.actor(id).version(vn).envVar(evn).delete(), actorId, versionNumber, envVarName,
                );
                expect(browserRes).toEqual(res);
                validateRequest({}, { actorId, versionNumber, envVarName });
            });
        });

        test('webhooks().list() works', async () => {
            const actorId = 'some-act-id';
            const query = {
                limit: 5,
                offset: 3,
                desc: true,
            };

            const res = await client.actor(actorId).webhooks().list(query);
            expect(res.id).toEqual('list-webhooks');
            validateRequest(query, { actorId });

            const browserRes = await page.evaluate((id, opts) => client.actor(id).webhooks().list(opts), actorId, query);
            expect(browserRes).toEqual(res);
            validateRequest(query, { actorId });
        });
    });
});
