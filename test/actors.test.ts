import { setTimeout } from 'node:timers/promises';

import c from 'ansi-colors';
import { ActorCollectionCreateOptions, ActorListSortBy, ActorSourceType, ApifyClient, LoggerActorRedirect } from 'apify-client';
import express from 'express';
import type { Page } from 'puppeteer';
import type { AddressInfo } from 'net';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect,test, vi } from 'vitest';

import { LEVELS,Log } from '@apify/log';

import { stringifyWebhooksToBase64 } from '../src/utils';
import { Browser, DEFAULT_OPTIONS,validateRequest } from './_helper';
import { createDefaultApp,mockServer } from './mock_server/server';
import { MOCKED_ACTOR_LOGS_PROCESSED, StatusGenerator } from './mock_server/test_utils';
import { WEBHOOK_EVENT_TYPES } from '@apify/consts';

describe('Actor methods', () => {
    let baseUrl: string;
    const browser = new Browser();

    beforeAll(async () => {
        const server = await mockServer.start() as import('http').Server;
        await browser.start();
        baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
    });

    afterAll(async () => {
        await Promise.all([mockServer.close(), browser.cleanUpBrowser()]);
    });

    let client: ApifyClient;
    let page: Page;
    beforeEach(async () => {
        page = await browser.getInjectedPage(baseUrl, DEFAULT_OPTIONS);
        client = new ApifyClient({
            baseUrl,
            maxRetries: 0,
            ...DEFAULT_OPTIONS,
        });
    });
    afterEach(async () => {
        // purge the client instance to avoid sharing state between tests
        client = null as any;
        page.close().catch(() => {});
    });

    describe('actors()', () => {
        test('list() works', async () => {
            const opts = {
                limit: 5,
                offset: 3,
                desc: true,
                my: true,
                sortBy: ActorListSortBy.CREATED_AT,
            };

            const res = await client.actors().list(opts);
            validateRequest({
                path: '/v2/acts/',
                query: opts
            });

            const browserRes = await page.evaluate((options) => client.actors().list(options), opts);
            expect(browserRes).toEqual(res);
            validateRequest({ query: opts });
        });

        test('create() works', async () => {
            const actor: ActorCollectionCreateOptions = { name: 'my-actor', isPublic: true };

            const res = await client.actors().create(actor);
            validateRequest({ query: {}, params: {}, body: actor, path: '/v2/acts/' });
            const browserRes = await page.evaluate((opts) => client.actors().create(opts), actor);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: {}, body: actor, path: '/v2/acts/' });
        });
    });

    describe('actor(id)', () => {
        test('update() works', async () => {
            const actorId = 'some-user/some-id';
            const newFields: ActorCollectionCreateOptions = { isPublic: true };

            const res = await client.actor(actorId).update(newFields);
            expect(res.id).toEqual('update-actor');
            validateRequest({ query: {}, params: { actorId: 'some-user~some-id' }, body: newFields });

            const browserRes = await page.evaluate((id, opts) => client.actor(id).update(opts), actorId, newFields);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { actorId: 'some-user~some-id' }, body: newFields });
        });

        test('get() works', async () => {
            const actorId = 'some-id';

            const res = await client.actor(actorId).get();
            expect(res?.id).toEqual('get-actor');
            validateRequest({ query: {}, params: { actorId } });

            const browserRes = await page.evaluate((id) => client.actor(id).get(), actorId);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { actorId } });
        });

        test('get() returns undefined on 404 status code (RECORD_NOT_FOUND)', async () => {
            const actorId = '404';

            const res = await client.actor(actorId).get();
            expect(res).toBeUndefined();
            validateRequest({ query: {}, params: { actorId } });

            const browserRes = await page.evaluate((id) => client.actor(id).get(), actorId);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { actorId } });
        });

        test('defaultBuild() works', async () => {
            const actorId = 'some-id';

            const defaultBuildClient = await client.actor(actorId).defaultBuild();
            const res = await defaultBuildClient.get();
            expect(res?.id).toEqual('get-build');
            validateRequest({ query: {}, params: { buildId: 'default-build-get' } });

            const browserRes = await page.evaluate(async (id) => {
                const dbc = await client.actor(id).defaultBuild();
                return dbc.get();
            }, actorId);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { buildId: 'default-build-get' } });
        });

        test('delete() works', async () => {
            const actorId = '204';
            const res = await client.actor(actorId).delete();
            expect(res).toBeUndefined();
            validateRequest({ query: {}, params: { actorId } });

            await page.evaluate((id) => client.actor(id).delete(), actorId);
            validateRequest({ query: {}, params: { actorId } });
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
            validateRequest({ query, params: { actorId }, body: { some: 'body' }, additionalHeaders: { 'content-type': contentType } });

            const browserRes = await page.evaluate((id, i, opts) => client.actor(id).start(i, opts), actorId, input, {
                contentType,
                ...query,
            });
            expect(browserRes).toEqual(res);
            validateRequest({ query, params: { actorId }, body: { some: 'body' }, additionalHeaders: { 'content-type': contentType } });
        });

        test('start() works with pre-stringified JSON', async () => {
            const actorId = 'some-id';
            const contentType = 'application/json; charset=utf-8';
            const input = JSON.stringify({ some: 'body' });

            const res = await client.actor(actorId).start(input, { contentType });
            expect(res.id).toEqual('run-actor');
            validateRequest({ params: { actorId }, body: { some: 'body' }, additionalHeaders: { 'content-type': contentType } });

            const browserRes = await page.evaluate((id, i, opts) => client.actor(id).start(i, opts), actorId, input, {
                contentType,
            });
            expect(browserRes).toEqual(res);
            validateRequest({ params: { actorId }, body: { some: 'body' }, additionalHeaders: { 'content-type': contentType } });
        });

        test('start() works with functions in input', async () => {
            const actorId = 'some-id';
            const input = {
                foo: 'bar',
                fn: async (a: number, b: number) => a + b,
            };

            const expectedRequestProps = {
                params: { actorId },
                body: { foo: 'bar', fn: input.fn.toString() },
                additionalHeaders: { 'content-type': 'application/json' },
                path: `/v2/acts/${encodeURIComponent(actorId)}/runs`,
            };

            const res = await client.actor(actorId).start(input);
            validateRequest(expectedRequestProps);

            const browserRes = await page.evaluate((id) => {
                return client.actor(id).start({
                    foo: 'bar',
                    fn: async (a: number, b: number) => a + b,
                });
            }, actorId);
            expect(browserRes).toEqual(res);
            validateRequest(expectedRequestProps);
        });

        test('start() with webhook works', async () => {
            const actorId = 'some-id';
            const webhooks = [
                {
                    eventTypes: [WEBHOOK_EVENT_TYPES.ACTOR_RUN_CREATED],
                    requestUrl: 'https://example.com/run-created',
                },
                {
                    eventTypes: [WEBHOOK_EVENT_TYPES.ACTOR_RUN_SUCCEEDED],
                    requestUrl: 'https://example.com/run-succeeded',
                },
            ];

            const res = await client.actor(actorId).start(undefined, { webhooks });
            expect(res.id).toEqual('run-actor');
            validateRequest({ query: { webhooks: stringifyWebhooksToBase64(webhooks) }, params: { actorId } });

            const browserRes = await page.evaluate((id, opts) => client.actor(id).start(undefined, opts), actorId, {
                webhooks,
            });
            expect(browserRes).toEqual(res);
            validateRequest({ query: { webhooks: stringifyWebhooksToBase64(webhooks) }, params: { actorId } });
        });

        test('start() with max items works', async () => {
            const actorId = 'some-id';

            const res = await client.actor(actorId).start(undefined, { maxItems: 100 });
            expect(res.id).toEqual('run-actor');
            validateRequest({ query: { maxItems: 100 }, params: { actorId } });

            const browserRes = await page.evaluate((id, opts) => client.actor(id).start(undefined, opts), actorId, {
                maxItems: 100,
            });
            expect(browserRes).toEqual(res);
            validateRequest({ query: { maxItems: 100 }, params: { actorId } });
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
                log: null,
            });

            expect(res).toEqual(data);
            validateRequest({ query: { waitForFinish: waitSecs }, params: { runId } });
            validateRequest({
                query: {
                    timeout,
                    memory,
                    build,
                },
                params: { actorId },
                body: { some: 'body' },
                additionalHeaders: { 'content-type': contentType },
            });

            const callBrowserRes = await page.evaluate(
                (id, i, opts) => client.actor(id).call(i, opts),
                actorId,
                input,
                {
                    contentType,
                    memory,
                    timeout,
                    build,
                    waitSecs,
                },
            );
            expect(callBrowserRes).toEqual(res);
            validateRequest({ query: { waitForFinish: waitSecs }, params: { runId } });
            validateRequest({
                query: {
                    timeout,
                    memory,
                    build,
                },
                params: { actorId },
                body: { some: 'body' },
                additionalHeaders: { 'content-type': contentType },
            });
        });

        test('call() works with maxItems', async () => {
            const actorId = 'some-id';
            const runId = 'started-run-id';
            const data = { id: runId, actId: actorId, status: 'SUCCEEDED' };
            const body = { data };
            const waitSecs = 1;
            const maxItems = 100;

            mockServer.setResponse({ body });
            const res = await client.actor(actorId).call(undefined, { waitSecs, maxItems, log: null });

            expect(res).toEqual(data);
            validateRequest({ query: { waitForFinish: waitSecs }, params: { runId } });
            validateRequest({ query: { maxItems }, params: { actorId } });

            const callBrowserRes = await page.evaluate(
                (id, i, opts) => client.actor(id).call(i, opts),
                actorId,
                undefined,
                {
                    waitSecs,
                    maxItems,
                },
            );
            expect(callBrowserRes).toEqual(res);
            validateRequest({ query: { waitForFinish: waitSecs }, params: { runId } });
            validateRequest({ query: { maxItems }, params: { actorId } });
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
            validateRequest({ query: { version, ...options }, params: { actorId } });

            const browserRes = await page.evaluate(
                (aId, v, opts) => client.actor(aId).build(v, opts),
                actorId,
                version,
                options,
            );
            expect(browserRes).toEqual(res);
            validateRequest({ query: { version, ...options }, params: { actorId } });
        });

        describe('lastRun()', () => {
            test.each(['get', 'dataset', 'keyValueStore', 'requestQueue', 'log'] as const)('%s() works', async (method) => {
                const actorId = 'some-actor-id';
                const requestedStatus = 'SUCCEEDED';

                const lastRunClient = client.actor(actorId).lastRun({ status: requestedStatus });
                const res = method === 'get' ? await lastRunClient.get() : await lastRunClient[method]().get();

                const pathSuffix = method === 'get' ? '' : method === 'keyValueStore' ? '/key-value-store' : method === 'requestQueue' ? '/request-queue' : `/${method}`;
                validateRequest({ query: { status: requestedStatus }, params: { actorId }, path: `/v2/acts/${encodeURIComponent(actorId)}/runs/last${pathSuffix}` });

                const browserRes = await page.evaluate(
                    (aId, mthd) => {
                        const lrc = client.actor(aId).lastRun();
                        if (mthd === 'get') return lrc.get();
                        return lrc[mthd]().get();
                    },
                    actorId,
                    method,
                );
                expect(browserRes).toEqual(res);
                validateRequest({ query: {}, params: { actorId } });
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
            validateRequest({ query: query, params: { actorId }, path: `/v2/acts/${encodeURIComponent(actorId)}/builds` });

            const browserRes = await page.evaluate(
                (aId, opts) => client.actor(aId).builds().list(opts),
                actorId,
                query,
            );
            expect(browserRes).toEqual(res);
            validateRequest({ query: query, params: { actorId } });
        });

        test('runs().list() works', async () => {
            const actorId = 'some-id';

            const query = {
                limit: 5,
                offset: 3,
                desc: true,
            };

            const res = await client.actor(actorId).runs().list(query);
            validateRequest({ query: query, params: { actorId }, path: `/v2/acts/${encodeURIComponent(actorId)}/runs` });

            const browserRes = await page.evaluate((aId, opts) => client.actor(aId).runs().list(opts), actorId, query);
            expect(browserRes).toEqual(res);
            validateRequest({ query: query, params: { actorId } });
        });

        describe('versions()', () => {
            test('list() works', async () => {
                const actorId = 'some-id';

                const res = await client.actor(actorId).versions().list();
                validateRequest({ query: {}, params: { actorId }, path: `/v2/acts/${encodeURIComponent(actorId)}/versions` });

                const browserRes = await page.evaluate((id) => client.actor(id).versions().list(), actorId);
                expect(browserRes).toEqual(res);
                validateRequest({ query: {}, params: { actorId }, path: `/v2/acts/${encodeURIComponent(actorId)}/versions` });
            });

            test('create() works', async () => {
                const actorId = 'some-id';
                const actorVersion = {
                    versionNumber: '0.0',
                    gitRepoUrl: 'https://github.com/user/repo.git',
                    sourceType: ActorSourceType.GitRepo,
                } as const;

                const res = await client.actor(actorId).versions().create(actorVersion);
                validateRequest({ query: {}, params: { actorId }, body: actorVersion, path: `/v2/acts/${encodeURIComponent(actorId)}/versions` });

                const browserRes = await page.evaluate(
                    (id, opts) => client.actor(id).versions().create(opts),
                    actorId,
                    actorVersion,
                );
                expect(browserRes).toEqual(res);
                validateRequest({ query: {}, params: { actorId }, body: actorVersion });
            });
        });

        describe('version()', () => {
            test('get() works', async () => {
                const actorId = 'some-id';
                const versionNumber = '0.0';

                const res = await client.actor(actorId).version(versionNumber).get();
                validateRequest({ query: {}, params: { actorId, versionNumber }, path: `/v2/acts/${encodeURIComponent(actorId)}/versions/${encodeURIComponent(versionNumber)}` });

                const browserRes = await page.evaluate(
                    (id, vn) => client.actor(id).version(vn).get(),
                    actorId,
                    versionNumber,
                );
                expect(browserRes).toEqual(res);
                validateRequest({ query: {}, params: { actorId, versionNumber } });
            });

            test('get() works if version did not exist', async () => {
                const actorId = '404';
                const versionNumber = '0.0';

                const res = await client.actor(actorId).version(versionNumber).get();
                expect(res).toBeUndefined();
                validateRequest({ query: {}, params: { actorId, versionNumber } });

                const browserRes = await page.evaluate(
                    (id, vn) => client.actor(id).version(vn).get(),
                    actorId,
                    versionNumber,
                );
                expect(browserRes).toEqual(res);
                validateRequest({ query: {}, params: { actorId, versionNumber } });
            });

            test('update() works', async () => {
                const actorId = 'some-user/some-id';
                const versionNumber = '0.0';
                const newFields = {
                    versionNumber: '0.0',
                    gitRepoUrl: 'https://github.com/user/repo.git',
                    sourceType: ActorSourceType.GitRepo,
                } as const;

                const res = await client.actor(actorId).version(versionNumber).update(newFields);
                validateRequest({ query: {}, params: { actorId: 'some-user~some-id', versionNumber }, body: newFields, path: `/v2/acts/some-user~some-id/versions/${encodeURIComponent(versionNumber)}` });

                const browserRes = await page.evaluate(
                    (id, vn, nf) => client.actor(id).version(vn).update(nf),
                    actorId,
                    versionNumber,
                    newFields,
                );
                expect(browserRes).toEqual(res);
                validateRequest({ query: {}, params: { actorId: 'some-user~some-id', versionNumber }, body: newFields });
            });

            test('delete() works', async () => {
                const actorId = '204';
                const versionNumber = '0.0';

                const res = await client.actor(actorId).version(versionNumber).delete();
                expect(res).toBeUndefined();
                validateRequest({ query: {}, params: { actorId, versionNumber } });

                const browserRes = await page.evaluate(
                    (id, vn) => client.actor(id).version(vn).delete(),
                    actorId,
                    versionNumber,
                );
                expect(browserRes).toEqual(res);
                validateRequest({ query: {}, params: { actorId, versionNumber } });
            });
        });

        describe('envVars()', () => {
            test('list() works', async () => {
                const actorId = 'some-id';
                const versionNumber = '0.1';

                const res = await client.actor(actorId).version(versionNumber).envVars().list();
                validateRequest({ query: {}, params: { actorId, versionNumber }, path: `/v2/acts/${encodeURIComponent(actorId)}/versions/${encodeURIComponent(versionNumber)}/env-vars` });

                const browserRes = await page.evaluate(
                    (aId, vn) => client.actor(aId).version(vn).envVars().list(),
                    actorId,
                    versionNumber,
                );
                expect(browserRes).toEqual(res);
                validateRequest({ query: {}, params: { actorId, versionNumber } });
            });

            test('create() works', async () => {
                const actorId = 'some-id';
                const versionNumber = '0.1';
                const actorEnvVar = {
                    name: 'TEST_ENV_VAR',
                    value: '123',
                } as const;

                const res = await client.actor(actorId).version(versionNumber).envVars().create(actorEnvVar);
                validateRequest({ query: {}, params: { actorId, versionNumber }, body: actorEnvVar, path: `/v2/acts/${encodeURIComponent(actorId)}/versions/${encodeURIComponent(versionNumber)}/env-vars` });

                const browserRes = await page.evaluate(
                    (aId, vn, ev) => client.actor(aId).version(vn).envVars().create(ev),
                    actorId,
                    versionNumber,
                    actorEnvVar,
                );
                expect(browserRes).toEqual(res);
                validateRequest({ query: {}, params: { actorId, versionNumber }, body: actorEnvVar });
            });
        });

        describe('envVar()', () => {
            test('get() works', async () => {
                const actorId = 'some-id';
                const versionNumber = '0.0';
                const envVarName = 'TEST_ENV_VAR';

                const res = await client.actor(actorId).version(versionNumber).envVar(envVarName).get();
                validateRequest({ query: {}, params: { actorId, versionNumber, envVarName }, path: `/v2/acts/${encodeURIComponent(actorId)}/versions/${encodeURIComponent(versionNumber)}/env-vars/${encodeURIComponent(envVarName)}` });

                const browserRes = await page.evaluate(
                    (aId, vn, evn) => client.actor(aId).version(vn).envVar(evn).get(),
                    actorId,
                    versionNumber,
                    envVarName,
                );
                expect(browserRes).toEqual(res);
                validateRequest({ query: {}, params: { actorId, versionNumber, envVarName } });
            });

            test('get() works if envVar did not exist', async () => {
                const actorId = '404'; // this will make the mock API return 404. Must be the first param.
                const versionNumber = '0.0';
                const envVarName = 'TEST_ENV_VAR';

                const res = await client.actor(actorId).version(versionNumber).envVar(envVarName).get();
                expect(res).toBeUndefined();
                validateRequest({ query: {}, params: { actorId, versionNumber, envVarName } });

                const browserRes = await page.evaluate(
                    (aId, vn, evn) => client.actor(aId).version(vn).envVar(evn).get(),
                    actorId,
                    versionNumber,
                    envVarName,
                );
                expect(browserRes).toEqual(res);
                validateRequest({ query: {}, params: { actorId, versionNumber, envVarName } });
            });

            test('update() works', async () => {
                const actorId = 'some-user/some-id';
                const versionNumber = '0.0';
                const envVarName = 'TEST_UPDATE_ENV_VAR';
                const envVar = {
                    name: 'TEST_UPDATE_ENV_VAR',
                    value: '123',
                };

                const res = await client.actor(actorId).version(versionNumber).envVar(envVarName).update(envVar);
                validateRequest({ query: {}, params: { actorId: 'some-user~some-id', versionNumber, envVarName }, body: envVar, path: `/v2/acts/some-user~some-id/versions/${encodeURIComponent(versionNumber)}/env-vars/${encodeURIComponent(envVarName)}` });

                const browserRes = await page.evaluate(
                    (id, vn, evn, uev) => client.actor(id).version(vn).envVar(evn).update(uev),
                    actorId,
                    versionNumber,
                    envVarName,
                    envVar,
                );
                expect(browserRes).toEqual(res);
                validateRequest({ query: {}, params: { actorId: 'some-user~some-id', versionNumber, envVarName }, body: envVar });
            });

            test('delete() works', async () => {
                const actorId = '204';
                const versionNumber = '0.0';
                const envVarName = 'TEST_ENV_VAR_TO_DELETE';

                const res = await client.actor(actorId).version(versionNumber).envVar(envVarName).delete();
                expect(res).toBeUndefined();
                validateRequest({ query: {}, params: { actorId, versionNumber, envVarName } });

                const browserRes = await page.evaluate(
                    (id, vn, evn) => client.actor(id).version(vn).envVar(evn).delete(),
                    actorId,
                    versionNumber,
                    envVarName,
                );
                expect(browserRes).toEqual(res);
                validateRequest({ query: {}, params: { actorId, versionNumber, envVarName } });
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
            validateRequest({ query: query, params: { actorId }, path: `/v2/acts/${encodeURIComponent(actorId)}/webhooks` });

            const browserRes = await page.evaluate(
                (id, opts) => client.actor(id).webhooks().list(opts),
                actorId,
                query,
            );
            expect(browserRes).toEqual(res);
            validateRequest({ query: query, params: { actorId } });
        });
    });
});

describe('Run actor with redirected logs', () => {
    let baseUrl: string;
    let client: ApifyClient;
    const statusGenerator = new StatusGenerator();

    beforeAll(async () => {
        // Use custom router for the tests
        const router = express.Router();
        // Set up a status generator to simulate run status changes. It will be reset for each test.
        router.get('/actor-runs/redirect-run-id', async (_, res) => {
            // Delay the response to give the actor time to run and produce expected logs
            await setTimeout(10);

            const [status, statusMessage] = statusGenerator.next().value;
            res.json({ data: { id: 'redirect-run-id', actId: 'redirect-actor-id', status, statusMessage } });
        });
        const app = createDefaultApp(router);
        const server = await mockServer.start(undefined, app);
        baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
    });

    afterAll(async () => {
        await mockServer.close();
    });

    beforeEach(async () => {
        client = new ApifyClient({
            baseUrl,
            maxRetries: 0,
            ...DEFAULT_OPTIONS,
        });
    });
    afterEach(async () => {
        // Reset the generator to so that the next test starts fresh
        statusGenerator.reset();
        client = null as unknown as ApifyClient;
    });

    const testCases = [
        { expectedPrefix: c.cyan('redirect-actor-name runId:redirect-run-id -> '), logOptions: {} },
        { expectedPrefix: c.cyan('redirect-actor-name runId:redirect-run-id -> '), logOptions: { log: 'default' } },
        {
            expectedPrefix: c.cyan('custom prefix...'),
            logOptions: {
                log: new Log({ level: LEVELS.DEBUG, prefix: 'custom prefix...', logger: new LoggerActorRedirect() }),
            },
        },
    ] as const;

    describe('actor.call - redirected logs', () => {
        test.each(testCases)('logOptions:$logOptions', async ({ expectedPrefix, logOptions }) => {
            const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            await client.actor('redirect-actor-id').call(undefined, logOptions);

            expect(logSpy.mock.calls).toEqual(MOCKED_ACTOR_LOGS_PROCESSED.map((item) => [expectedPrefix + item]));
            logSpy.mockRestore();
        });

        test('logOptions:{ "log": null }', async () => {
            const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            await client.actor('redirect-actor-id').call(undefined, { log: null });

            expect(logSpy.mock.calls).toEqual([]);
            logSpy.mockRestore();
        });
    });
});
