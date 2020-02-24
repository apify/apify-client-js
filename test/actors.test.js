import ApifyClient from '../build';
import { stringifyWebhooksToBase64 } from '../build/utils';
import mockServer from './mock_server/server';
import { cleanUpBrowser, getInjectedPage, validateRequest, DEFAULT_QUERY } from './_helper';

describe('Actor methods', () => {
    let baseUrl = null;
    let page;

    beforeAll(async () => {
        const server = await mockServer.start();
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

    test('listActs() works', async () => {
        const opts = {
            limit: 5,
            offset: 3,
            desc: true,
            my: true,
        };

        const res = await client.acts.listActs(opts);
        expect(res.id).toEqual('list-actors');
        validateRequest(opts);

        const browserRes = await page.evaluate(options => client.acts.listActs(options), opts);
        expect(browserRes).toEqual(res);
        validateRequest(opts);
    });

    test('createAct() works', async () => {
        const act = { foo: 'bar' };

        const res = await client.acts.createAct({ act });
        expect(res.id).toEqual('create-actor');
        validateRequest({}, {}, act);
        const browserRes = await page.evaluate(opts => client.acts.createAct(opts), { act });
        expect(browserRes).toEqual(res);
        validateRequest({}, {}, act);
    });

    test(
        'updateAct() works with both actId parameter and actId in act object',
        async () => {
            const actId = 'some-user/some-id';
            const act = { id: actId, foo: 'bar' };

            const res = await client.acts.updateAct({ actId, act });
            expect(res.id).toEqual('update-actor');
            validateRequest({}, { actorId: 'some-user~some-id' }, { foo: 'bar' });

            const browserRes = await page.evaluate(opts => client.acts.updateAct(opts), { actId, act });
            expect(browserRes).toEqual(res);
            validateRequest({}, { actorId: 'some-user~some-id' }, { foo: 'bar' });
        },
    );

    test('updateAct() works with actId in act object', async () => {
        const actId = 'some-id';
        const act = { id: actId, foo: 'bar' };

        const res = await client.acts.updateAct({ act });
        expect(res.id).toEqual('update-actor');
        validateRequest({}, { actorId: actId }, { foo: 'bar' });

        const browserRes = await page.evaluate(opts => client.acts.updateAct(opts), { act });
        expect(browserRes).toEqual(res);
        validateRequest({}, { actorId: actId }, { foo: 'bar' });
    });

    test('updateAct() works with actId parameter', async () => {
        const actId = 'some-id';
        const act = { foo: 'bar' };

        const res = await client.acts.updateAct({ actId, act });
        expect(res.id).toEqual('update-actor');
        validateRequest({}, { actorId: actId }, act);

        const browserRes = await page.evaluate(opts => client.acts.updateAct(opts), { actId, act });
        expect(browserRes).toEqual(res);
        validateRequest({}, { actorId: actId }, act);
    });

    test('getAct() works', async () => {
        const actId = 'some-id';

        const res = await client.acts.getAct({ actId });
        expect(res.id).toEqual('get-actor');
        validateRequest({}, { actorId: actId });

        const browserRes = await page.evaluate(opts => client.acts.getAct(opts), { actId });
        expect(browserRes).toEqual(res);
        validateRequest({}, { actorId: actId });
    });

    test(
        'getAct() returns null on 404 status code (RECORD_NOT_FOUND)',
        async () => {
            const actId = '404';

            const res = await client.acts.getAct({ actId });
            expect(res).toEqual(null);
            validateRequest({}, { actorId: actId });

            const browserRes = await page.evaluate(opts => client.acts.getAct(opts), { actId });
            expect(browserRes).toEqual(res);
            validateRequest({}, { actorId: actId });
        },
    );

    test('deleteAct() works', async () => {
        const actId = '204';
        const res = await client.acts.deleteAct({ actId });
        expect(res).toEqual('');
        validateRequest({}, { actorId: actId });

        await page.evaluate(opts => client.acts.getAct(opts), { actId });
        validateRequest({}, { actorId: actId });
    });

    test('listRuns() works', async () => {
        const actId = 'some-id';

        const query = {
            limit: 5,
            offset: 3,
            desc: true,
        };

        const res = await client.acts.listRuns({ actId, ...query });
        expect(res.id).toEqual('list-runs');
        validateRequest(query, { actorId: actId });

        const browserRes = await page.evaluate(opts => client.acts.listRuns(opts), { actId, ...query });
        expect(browserRes).toEqual(res);
        validateRequest(query, { actorId: actId });
    });

    test('runAct() works', async () => {
        const actId = 'some-id';
        const contentType = 'application/x-www-form-urlencoded';
        const body = 'some=body';

        const query = {
            waitForFinish: 100,
            timeout: 120,
            memory: 256,
            build: '1.2.0',
        };

        const res = await client.acts.runAct({ actId, contentType, body, ...query });
        expect(res.id).toEqual('run-actor');
        validateRequest(query, { actorId: actId }, { some: 'body' }, { 'content-type': contentType });

        const browserRes = await page.evaluate(opts => client.acts.runAct(opts), { actId, contentType, body, ...query });
        expect(browserRes).toEqual(res);
        validateRequest(query, { actorId: actId }, { some: 'body' }, { 'content-type': contentType });
    });

    test('runAct() with webhook works', async () => {
        const actId = 'some-id';
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

        const res = await client.acts.runAct({ actId, webhooks });
        expect(res.id).toEqual('run-actor');
        validateRequest({ webhooks: stringifyWebhooksToBase64(webhooks) }, { actorId: actId });

        const browserRes = await page.evaluate(opts => client.acts.runAct(opts), { actId, webhooks });
        expect(browserRes).toEqual(res);
        validateRequest({ webhooks: stringifyWebhooksToBase64(webhooks) }, { actorId: actId });
    });

    test('getRun() works', async () => {
        const actId = 'some-act-id';
        const runId = 'some-run-id';

        const query = {
            waitForFinish: 100,
        };

        const res = await client.acts.getRun({ actId, runId, ...query });
        expect(res.id).toEqual('get-run');
        validateRequest(query, { actorId: actId, runId });

        const browserRes = await page.evaluate(opts => client.acts.getRun(opts), { actId, runId, ...query });
        expect(browserRes).toEqual(res);
        validateRequest(query, { actorId: actId, runId });
    });

    test('abortRun() works', async () => {
        const actId = 'some-act-id';
        const runId = 'some-run-id';

        const res = await client.acts.abortRun({ actId, runId });
        expect(res.id).toEqual('abort-run');
        validateRequest({}, { actorId: actId, runId });

        const browserRes = await page.evaluate(opts => client.acts.abortRun(opts), { actId, runId });
        expect(browserRes).toEqual(res);
        validateRequest({}, { actorId: actId, runId });
    });

    test('resurrectRun() works', async () => {
        const actId = 'some-act-id';
        const runId = 'some-run-id';

        const res = await client.acts.resurrectRun({ actId, runId });
        expect(res.id).toEqual('resurrect-run');
        validateRequest({}, { actorId: actId, runId });

        const browserRes = await page.evaluate(opts => client.acts.resurrectRun(opts), { actId, runId });
        expect(browserRes).toEqual(res);
        validateRequest({}, { actorId: actId, runId });
    });

    test('metamorphRun() works', async () => {
        const actId = 'some-id';
        const runId = 'some-run-id';
        const contentType = 'application/x-www-form-urlencoded';
        const body = 'some=body';


        const query = {
            build: '1.2.0',
            targetActorId: 'some-actor-id',
        };

        const res = await client.acts.metamorphRun({ actId, runId, contentType, body, ...query });
        expect(res.id).toEqual('metamorph-run');
        validateRequest(query, { actorId: actId, runId }, { some: 'body' }, { 'content-type': contentType });

        const browserRes = await page.evaluate(opts => client.acts.metamorphRun(opts), { actId, runId, contentType, body, ...query });
        expect(browserRes).toEqual(res);
        validateRequest(query, { actorId: actId, runId }, { some: 'body' }, { 'content-type': contentType });
    });

    test(
        'getRun() returns null on 404 status code (RECORD_NOT_FOUND)',
        async () => {
            const actId = '404';
            const runId = 'some-build-id';

            const query = {};

            const res = await client.acts.getRun({ actId, runId, ...query });
            expect(res).toEqual(null);
            validateRequest(query, { actorId: actId, runId });

            const browserRes = await page.evaluate(opts => client.acts.getRun(opts), { actId, runId, ...query });
            expect(browserRes).toEqual(res);
            validateRequest(query, { actorId: actId, runId });
        },
    );

    test('listBuilds() works', async () => {
        const actId = 'some-id';

        const query = {
            limit: 5,
            offset: 3,
            desc: true,
        };

        const res = await client.acts.listBuilds({ actId, ...query });
        expect(res.id).toEqual('list-builds');
        validateRequest(query, { actorId: actId });

        const browserRes = await page.evaluate(opts => client.acts.listBuilds(opts), { actId, ...query });
        expect(browserRes).toEqual(res);
        validateRequest(query, { actorId: actId });
    });

    test('buildAct() works', async () => {
        const actId = 'some-id';

        const query = {
            betaPackages: true,
            waitForFinish: 120,
            version: '0.0',
            tag: 'latest',
            useCache: true,

        };

        const res = await client.acts.buildAct({ actId, ...query });
        expect(res.id).toEqual('build-actor');
        validateRequest(query, { actorId: actId });

        const browserRes = await page.evaluate(opts => client.acts.buildAct(opts), { actId, ...query });
        expect(browserRes).toEqual(res);
        validateRequest(query, { actorId: actId });
    });

    test('getBuild() works', async () => {
        const actId = 'some-act-id';
        const buildId = 'some-build-id';

        const query = {
            waitForFinish: 120,
        };

        const res = await client.acts.getBuild({ actId, buildId, ...query });
        expect(res.id).toEqual('get-build');
        validateRequest(query, { actorId: actId, buildId });

        const browserRes = await page.evaluate(opts => client.acts.getBuild(opts), { actId, buildId, ...query });
        expect(browserRes).toEqual(res);
        validateRequest(query, { actorId: actId, buildId });
    });

    test(
        'getBuild() returns null on 404 status code (RECORD_NOT_FOUND)',
        async () => {
            const actId = '404';
            const buildId = 'some-build-id';

            const query = {
                waitForFinish: 120,
            };

            const res = await client.acts.getBuild({ actId, buildId, ...query });
            expect(res).toEqual(null);
            validateRequest(query, { actorId: actId, buildId });

            const browserRes = await page.evaluate(opts => client.acts.getBuild(opts), { actId, buildId, ...query });
            expect(browserRes).toEqual(res);
            validateRequest(query, { actorId: actId, buildId });
        },
    );

    test('abortBuild() works', async () => {
        const actId = 'some-act-id';
        const buildId = 'some-build-id';

        const res = await client.acts.abortBuild({ actId, buildId });
        expect(res.id).toEqual('abort-build');
        validateRequest({}, { actorId: actId, buildId });

        const browserRes = await page.evaluate(opts => client.acts.abortBuild(opts), { actId, buildId });
        expect(browserRes).toEqual(res);
        validateRequest({}, { actorId: actId, buildId });
    });

    test('listActVersions() works', async () => {
        const actId = 'some-id';

        const query = {};

        const res = await client.acts.listActVersions({ actId });
        expect(res.id).toEqual('list-actor-versions');
        validateRequest(query, { actorId: actId });

        const browserRes = await page.evaluate(opts => client.acts.listActVersions(opts), { actId });
        expect(browserRes).toEqual(res);
        validateRequest({}, { actorId: actId });
    });

    test('createActVersion() works', async () => {
        const actId = 'some-id';
        const actVersion = {
            versionNumber: '0.0',
            foo: 'bar',
        };

        const res = await client.acts.createActVersion({ actId, actVersion });
        expect(res.id).toEqual('create-actor-version');
        validateRequest({}, { actorId: actId }, actVersion);

        const browserRes = await page.evaluate(opts => client.acts.createActVersion(opts), { actId, actVersion });
        expect(browserRes).toEqual(res);
        validateRequest({}, { actorId: actId }, actVersion);
    });

    test('getActVersion() works', async () => {
        const actId = 'some-id';
        const versionNumber = '0.0';

        const res = await client.acts.getActorVersion({ actId, versionNumber });
        expect(res.id).toEqual('get-actor-version');
        validateRequest({}, { actorId: actId, versionNumber });

        const browserRes = await page.evaluate(opts => client.acts.getActorVersion(opts), { actId, versionNumber });
        expect(browserRes).toEqual(res);
        validateRequest({}, { actorId: actId, versionNumber });
    });

    test('getActVersion() works if version did not exist', async () => {
        const actId = '404';
        const versionNumber = '0.0';

        const res = await client.acts.getActorVersion({ actId, versionNumber });
        expect(res).toEqual(null);
        validateRequest({}, { actorId: actId, versionNumber });

        const browserRes = await page.evaluate(opts => client.acts.getActorVersion(opts), { actId, versionNumber });
        expect(browserRes).toEqual(res);
        validateRequest({}, { actorId: actId, versionNumber });
    });

    test('updateActVersion() works', async () => {
        const actId = 'some-user/some-id';
        const versionNumber = '0.0';
        const actVersion = {
            versionNumber: '0.0',
            foo: 'bar',
        };

        const res = await client.acts.updateActVersion({ actId, versionNumber, actVersion });
        expect(res.id).toEqual('update-actor-version');
        validateRequest({}, { actorId: 'some-user~some-id', versionNumber }, actVersion);

        const browserRes = await page.evaluate(opts => client.acts.updateActVersion(opts), { actId, versionNumber, actVersion });
        expect(browserRes).toEqual(res);
        validateRequest({}, { actorId: 'some-user~some-id', versionNumber }, actVersion);
    });

    test('deleteActVersion() works', async () => {
        const actId = '204';
        const versionNumber = '0.0';

        const res = await client.acts.deleteActVersion({ actId, versionNumber });
        expect(res).toEqual(null);
        validateRequest({}, { actorId: actId, versionNumber });

        const browserRes = await page.evaluate(opts => client.acts.deleteActVersion(opts), { actId, versionNumber });
        expect(browserRes).toEqual(res);
        validateRequest({}, { actorId: actId, versionNumber });
    });

    test('listWebhooks() works', async () => {
        const actId = 'some-act-id';
        const query = {
            limit: 5,
            offset: 3,
            desc: true,
        };


        const res = await client.acts.listWebhooks({ actId, ...query });
        expect(res.id).toEqual('list-webhooks');
        validateRequest(query, { actorId: actId });

        const browserRes = await page.evaluate(opts => client.acts.listWebhooks(opts), { actId, ...query });
        expect(browserRes).toEqual(res);
        validateRequest(query, { actorId: actId });
    });
});
