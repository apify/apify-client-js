import { expect } from 'chai';
import ApifyClient from '../build';
import { stringifyWebhooksToBase64 } from '../build/utils';
import mockServer from './mock_server/server';
import { cleanUpBrowser, getInjectedPage } from './_helper';

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

describe('Actor methods', () => {
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

    it('listActs() works', async () => {
        const opts = {
            limit: 5,
            offset: 3,
            desc: true,
        };

        const res = await client.acts.listActs(opts);
        expect(res.id).to.be.eql('list-actors');
        validateRequest(opts);
        const browserRes = await page.evaluate(opts => client.acts.listActs(opts), opts);
        expect(browserRes).to.eql(res);
        validateRequest(opts);
    });

    it('createAct() works', async () => {
        const act = { foo: 'bar' };

        const res = await client.acts.createAct({ act });
        expect(res.id).to.be.eql('create-actor');
        validateRequest({}, {}, act);
        const browserRes = await page.evaluate(opts => client.acts.createAct(opts), { act });
        expect(browserRes).to.eql(res);
        validateRequest({}, {}, act);
    });

    it('updateAct() works with both actId parameter and actId in act object', async () => {
        const actId = 'some-user/some-id';
        const act = { id: actId, foo: 'bar' };

        const res = await client.acts.updateAct({ actId, act });
        expect(res.id).to.be.eql('update-actor');
        validateRequest({}, { actorId: 'some-user~some-id' }, { foo: 'bar' });

        const browserRes = await page.evaluate(opts => client.acts.updateAct(opts), { actId, act });
        expect(browserRes).to.eql(res);
        validateRequest({}, { actorId: 'some-user~some-id' }, { foo: 'bar' });
    });

    it('updateAct() works with actId in act object', async () => {
        const actId = 'some-id';
        const act = { id: actId, foo: 'bar' };

        const res = await client.acts.updateAct({ act });
        expect(res.id).to.be.eql('update-actor');
        validateRequest({}, { actorId: actId }, { foo: 'bar' });

        const browserRes = await page.evaluate(opts => client.acts.updateAct(opts), { act });
        expect(browserRes).to.eql(res);
        validateRequest({}, { actorId: actId }, { foo: 'bar' });
    });

    it('updateAct() works with actId parameter', async () => {
        const actId = 'some-id';
        const act = { foo: 'bar' };

        const res = await client.acts.updateAct({ actId, act });
        expect(res.id).to.be.eql('update-actor');
        validateRequest({}, { actorId: actId }, act);

        const browserRes = await page.evaluate(opts => client.acts.updateAct(opts), { actId, act });
        expect(browserRes).to.eql(res);
        validateRequest({}, { actorId: actId }, act);
    });

    it('getAct() works', async () => {
        const actId = 'some-id';

        const res = await client.acts.getAct({ actId });
        expect(res.id).to.be.eql('get-actor');
        validateRequest({}, { actorId: actId });

        const browserRes = await page.evaluate(opts => client.acts.getAct(opts), { actId });
        expect(browserRes).to.eql(res);
        validateRequest({}, { actorId: actId });
    });

    it('getAct() returns null on 404 status code (RECORD_NOT_FOUND)', async () => {
        const actId = '404';

        const res = await client.acts.getAct({ actId });
        expect(res).to.be.eql(null);
        validateRequest({}, { actorId: actId });

        const browserRes = await page.evaluate(opts => client.acts.getAct(opts), { actId });
        expect(browserRes).to.eql(res);
        validateRequest({}, { actorId: actId });
    });

    it('deleteAct() works', async () => {
        const actId = '204';
        const res = await client.acts.deleteAct({ actId });
        expect(res).to.be.eql('');
        validateRequest({}, { actorId: actId });

        await page.evaluate(opts => client.acts.getAct(opts), { actId });
        validateRequest({}, { actorId: actId });
    });

    it('listRuns() works', async () => {
        const actId = 'some-id';

        const query = {
            limit: 5,
            offset: 3,
            desc: true,
        };

        const res = await client.acts.listRuns({ actId, ...query });
        expect(res.id).to.be.eql('list-runs');
        validateRequest(query, { actorId: actId });

        const browserRes = await page.evaluate(opts => client.acts.listRuns(opts), { actId, ...query });
        expect(browserRes).to.eql(res);
        validateRequest(query, { actorId: actId });
    });

    it('runAct() works', async () => {
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
        expect(res.id).to.be.eql('run-actor');
        validateRequest(query, { actorId: actId }, { some: 'body' }, { 'content-type': contentType });

        const browserRes = await page.evaluate(opts => client.acts.runAct(opts), { actId, contentType, body, ...query });
        expect(browserRes).to.eql(res);
        validateRequest(query, { actorId: actId }, { some: 'body' }, { 'content-type': contentType });
    });

    it('runAct() with webhook works', async () => {
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
        expect(res.id).to.be.eql('run-actor');
        validateRequest({ webhooks: stringifyWebhooksToBase64(webhooks) }, { actorId: actId });

        const browserRes = await page.evaluate(opts => client.acts.runAct(opts), { actId, webhooks });
        expect(browserRes).to.eql(res);
        validateRequest({ webhooks: stringifyWebhooksToBase64(webhooks) }, { actorId: actId });
    });

    it('getRun() works', async () => {
        const actId = 'some-act-id';
        const runId = 'some-run-id';

        const query = {
            waitForFinish: 100,
        };

        const res = await client.acts.getRun({ actId, runId, ...query });
        expect(res.id).to.be.eql('get-run');
        validateRequest(query, { actorId: actId, runId });

        const browserRes = await page.evaluate(opts => client.acts.getRun(opts), { actId, runId, ...query });
        expect(browserRes).to.eql(res);
        validateRequest(query, { actorId: actId, runId });
    });

    it('abortRun() works', async () => {
        const actId = 'some-act-id';
        const runId = 'some-run-id';

        const res = await client.acts.abortRun({ actId, runId });
        expect(res.id).to.be.eql('abort-run');
        validateRequest({}, { actorId: actId, runId });

        const browserRes = await page.evaluate(opts => client.acts.abortRun(opts), { actId, runId });
        expect(browserRes).to.eql(res);
        validateRequest({}, { actorId: actId, runId });
    });

    it('resurrectRun() works', async () => {
        const actId = 'some-act-id';
        const runId = 'some-run-id';

        const res = await client.acts.resurrectRun({ actId, runId });
        expect(res.id).to.be.eql('resurrect-run');
        validateRequest({}, { actorId: actId, runId });

        const browserRes = await page.evaluate(opts => client.acts.resurrectRun(opts), { actId, runId });
        expect(browserRes).to.eql(res);
        validateRequest({}, { actorId: actId, runId });
    });

    it('metamorphRun() works', async () => {
        const actId = 'some-id';
        const runId = 'some-run-id';
        const contentType = 'application/x-www-form-urlencoded';
        const body = 'some=body';


        const query = {
            build: '1.2.0',
            targetActorId: 'some-actor-id',
        };

        const res = await client.acts.metamorphRun({ actId, runId, contentType, body, ...query });
        expect(res.id).to.be.eql('metamorph-run');
        validateRequest(query, { actorId: actId, runId }, { some: 'body' }, { 'content-type': contentType });

        const browserRes = await page.evaluate(opts => client.acts.metamorphRun(opts), { actId, runId, contentType, body, ...query });
        expect(browserRes).to.eql(res);
        validateRequest(query, { actorId: actId, runId }, { some: 'body' }, { 'content-type': contentType });
    });

    it('getRun() returns null on 404 status code (RECORD_NOT_FOUND)', async () => {
        const actId = '404';
        const runId = 'some-build-id';

        const query = {};

        const res = await client.acts.getRun({ actId, runId, ...query });
        expect(res).to.be.eql(null);
        validateRequest(query, { actorId: actId, runId });

        const browserRes = await page.evaluate(opts => client.acts.getRun(opts), { actId, runId, ...query });
        expect(browserRes).to.eql(res);
        validateRequest(query, { actorId: actId, runId });
    });

    it('listBuilds() works', async () => {
        const actId = 'some-id';

        const query = {
            limit: 5,
            offset: 3,
            desc: true,
        };

        const res = await client.acts.listBuilds({ actId, ...query });
        expect(res.id).to.be.eql('list-builds');
        validateRequest(query, { actorId: actId });

        const browserRes = await page.evaluate(opts => client.acts.listBuilds(opts), { actId, ...query });
        expect(browserRes).to.eql(res);
        validateRequest(query, { actorId: actId });
    });

    it('buildAct() works', async () => {
        const actId = 'some-id';

        const query = {
            betaPackages: true,
            waitForFinish: 120,
            version: '0.0',
            tag: 'latest',
            useCache: true,

        };

        const res = await client.acts.buildAct({ actId, ...query });
        expect(res.id).to.be.eql('build-actor');
        validateRequest(query, { actorId: actId });

        const browserRes = await page.evaluate(opts => client.acts.buildAct(opts), { actId, ...query });
        expect(browserRes).to.eql(res);
        validateRequest(query, { actorId: actId });
    });

    it('getBuild() works', async () => {
        const actId = 'some-act-id';
        const buildId = 'some-build-id';

        const query = {
            waitForFinish: 120,
        };

        const res = await client.acts.getBuild({ actId, buildId, ...query });
        expect(res.id).to.be.eql('get-build');
        validateRequest(query, { actorId: actId, buildId });

        const browserRes = await page.evaluate(opts => client.acts.getBuild(opts), { actId, buildId, ...query });
        expect(browserRes).to.eql(res);
        validateRequest(query, { actorId: actId, buildId });
    });

    it('getBuild() returns null on 404 status code (RECORD_NOT_FOUND)', async () => {
        const actId = '404';
        const buildId = 'some-build-id';

        const query = {
            waitForFinish: 120,
        };

        const res = await client.acts.getBuild({ actId, buildId, ...query });
        expect(res).to.be.eql(null);
        validateRequest(query, { actorId: actId, buildId });

        const browserRes = await page.evaluate(opts => client.acts.getBuild(opts), { actId, buildId, ...query });
        expect(browserRes).to.eql(res);
        validateRequest(query, { actorId: actId, buildId });
    });

    it('abortBuild() works', async () => {
        const actId = 'some-act-id';
        const buildId = 'some-build-id';

        const res = await client.acts.abortBuild({ actId, buildId });
        expect(res.id).to.be.eql('abort-build');
        validateRequest({}, { actorId: actId, buildId });

        const browserRes = await page.evaluate(opts => client.acts.abortBuild(opts), { actId, buildId });
        expect(browserRes).to.eql(res);
        validateRequest({}, { actorId: actId, buildId });
    });

    it('listActVersions() works', async () => {
        const actId = 'some-id';

        const query = {};

        const res = await client.acts.listActVersions({ actId });
        expect(res.id).to.be.eql('list-actor-versions');
        validateRequest(query, { actorId: actId });

        const browserRes = await page.evaluate(opts => client.acts.listActVersions(opts), { actId });
        expect(browserRes).to.eql(res);
        validateRequest({}, { actorId: actId });
    });

    it('createActVersion() works', async () => {
        const actId = 'some-id';
        const actVersion = {
            versionNumber: '0.0',
            foo: 'bar',
        };

        const res = await client.acts.createActVersion({ actId, actVersion });
        expect(res.id).to.be.eql('create-actor-version');
        validateRequest({}, { actorId: actId }, actVersion);

        const browserRes = await page.evaluate(opts => client.acts.createActVersion(opts), { actId, actVersion });
        expect(browserRes).to.eql(res);
        validateRequest({}, { actorId: actId }, actVersion);
    });

    it('getActVersion() works', async () => {
        const actId = 'some-id';
        const versionNumber = '0.0';

        const res = await client.acts.getActorVersion({ actId, versionNumber });
        expect(res.id).to.be.eql('get-actor-version');
        validateRequest({}, { actorId: actId, versionNumber });

        const browserRes = await page.evaluate(opts => client.acts.getActorVersion(opts), { actId, versionNumber });
        expect(browserRes).to.eql(res);
        validateRequest({}, { actorId: actId, versionNumber });
    });

    it('getActVersion() works if version did not exist', async () => {
        const actId = '404';
        const versionNumber = '0.0';

        const res = await client.acts.getActorVersion({ actId, versionNumber });
        expect(res).to.be.eql(null);
        validateRequest({}, { actorId: actId, versionNumber });

        const browserRes = await page.evaluate(opts => client.acts.getActorVersion(opts), { actId, versionNumber });
        expect(browserRes).to.eql(res);
        validateRequest({}, { actorId: actId, versionNumber });
    });

    it('updateActVersion() works', async () => {
        const actId = 'some-user/some-id';
        const versionNumber = '0.0';
        const actVersion = {
            versionNumber: '0.0',
            foo: 'bar',
        };

        const res = await client.acts.updateActVersion({ actId, versionNumber, actVersion });
        expect(res.id).to.be.eql('update-actor-version');
        validateRequest({}, { actorId: 'some-user~some-id', versionNumber }, actVersion);

        const browserRes = await page.evaluate(opts => client.acts.updateActVersion(opts), { actId, versionNumber, actVersion });
        expect(browserRes).to.eql(res);
        validateRequest({}, { actorId: 'some-user~some-id', versionNumber }, actVersion);
    });

    it('deleteActVersion() works', async () => {
        const actId = '204';
        const versionNumber = '0.0';

        const res = await client.acts.deleteActVersion({ actId, versionNumber });
        expect(res).to.be.eql(null);
        validateRequest({}, { actorId: actId, versionNumber });

        const browserRes = await page.evaluate(opts => client.acts.deleteActVersion(opts), { actId, versionNumber });
        expect(browserRes).to.eql(res);
        validateRequest({}, { actorId: actId, versionNumber });
    });

    it('listWebhooks() works', async () => {
        const actId = 'some-act-id';
        const query = {
            limit: 5,
            offset: 3,
            desc: true,
        };


        const res = await client.acts.listWebhooks({ actId, ...query });
        expect(res.id).to.be.eql('list-webhooks');
        validateRequest(query, { actorId: actId });

        const browserRes = await page.evaluate(opts => client.acts.listWebhooks(opts), { actId, ...query });
        expect(browserRes).to.eql(res);
        validateRequest(query, { actorId: actId });
    });
});
