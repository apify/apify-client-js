import _ from 'lodash';
import { expect } from 'chai';
import ApifyClient from '../build';
import { stringifyWebhooksToBase64 } from '../build/utils';
import mockServer from './mock_server/server';

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
    before(async () => {
        const server = await mockServer.start(3333);
        baseUrl = `http://localhost:${server.address().port}`;
    });
    after(() => mockServer.close());

    let client = null;
    beforeEach(() => {
        client = new ApifyClient({
            baseUrl,
            expBackoffMaxRepeats: 0,
            expBackoffMillis: 1,
            ...DEFAULT_QUERY,
        });
    });
    afterEach(() => {
        client = null;
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
    });

    it('createAct() works', async () => {
        const act = { foo: 'bar' };

        const res = await client.acts.createAct({ act });
        expect(res.id).to.be.eql('create-actor');
        validateRequest({}, {}, act);
    });

    it('updateAct() works with both actId parameter and actId in act object', async () => {
        const actId = 'some-user/some-id';
        const act = { id: actId, foo: 'bar' };

        const res = await client.acts.updateAct({ actId, act });
        expect(res.id).to.be.eql('update-actor');
        validateRequest({}, { actorId: 'some-user~some-id' }, { foo: 'bar' });
    });

    it('updateAct() works with actId in act object', async () => {
        const actId = 'some-id';
        const act = { id: actId, foo: 'bar' };

        const res = await client.acts.updateAct({ act });
        expect(res.id).to.be.eql('update-actor');
        validateRequest({}, { actorId: actId }, { foo: 'bar' });
    });

    it('updateAct() works with actId parameter', async () => {
        const actId = 'some-id';
        const act = { foo: 'bar' };

        const res = await client.acts.updateAct({ actId, act });
        expect(res.id).to.be.eql('update-actor');
        validateRequest({}, { actorId: actId }, act);
    });

    it('getAct() works', async () => {
        const actId = 'some-id';

        const res = await client.acts.getAct({ actId });
        expect(res.id).to.be.eql('get-actor');
        validateRequest({}, { actorId: actId });
    });

    it('getAct() returns null on 404 status code (RECORD_NOT_FOUND)', async () => {
        const actId = '404';

        const res = await client.acts.getAct({ actId });
        expect(res).to.be.eql(null);
        validateRequest({}, { actorId: actId });
    });

    it('deleteAct() works', async () => {
        const actId = '204';
        const res = await client.acts.deleteAct({ actId });
        expect(res).to.be.eql('');
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
    });

    it('abortRun() works', async () => {
        const actId = 'some-act-id';
        const runId = 'some-run-id';

        const res = await client.acts.abortRun({ actId, runId });
        expect(res.id).to.be.eql('abort-run');
        validateRequest({}, { actorId: actId, runId });
    });

    xit('resurrectRun() works', async () => {
        const actId = 'some-act-id';
        const runId = 'some-run-id';

        const res = await client.acts.resurrectRun({ actId, runId });
        expect(res.id).to.be.eql('resurrect-run');
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
    });

    it('getRun() returns null on 404 status code (RECORD_NOT_FOUND)', async () => {
        const actId = 'some-act-id';
        const runId = 'some-run-id';

        const res = await client.acts.resurrectRun({ actId, runId });
        expect(res.id).to.be.eql('resurrect-run');
        validateRequest({}, { actorId: actId, runId });

        requestExpectErrorCall({
            json: true,
            method: 'GET',
            url: `${BASE_URL}${BASE_PATH}/${actId}/runs/${runId}`,
            qs: { token },
        }, false, 404);

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .acts
            .getRun({ actId, runId, token })
            .then(given => expect(given).to.be.eql(null));
    });

    xit('listBuilds() works', () => {
        const actId = 'some-id';

        const callOptions = {
            token: 'sometoken',
            limit: 5,
            offset: 3,
            desc: true,
        };

        const queryString = {
            token: 'sometoken',
            limit: 5,
            offset: 3,
            desc: 1,
        };

        const expected = {
            limit: 5,
            offset: 3,
            desc: true,
            count: 5,
            total: 10,
            items: ['build1', 'build2'],
        };

        requestExpectCall({
            json: true,
            method: 'GET',
            url: `${BASE_URL}${BASE_PATH}/${actId}/builds`,
            qs: queryString,
        }, {
            data: expected,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .acts
            .listBuilds(Object.assign({}, callOptions, { actId }))
            .then(res => expect(res).to.be.eql(expected));
    });

    xit('buildAct() works', () => {
        const actId = 'some-id';
        const token = 'some-token';
        const build = { foo: 'bar' };
        const waitForFinish = 120;
        const version = '0.0';
        const tag = 'latest';
        const betaPackages = true;
        const useCache = true;

        requestExpectCall({
            json: true,
            method: 'POST',
            url: `${BASE_URL}${BASE_PATH}/${actId}/builds`,
            qs: { token, version, waitForFinish, tag, betaPackages: 1, useCache: 1 },
        }, {
            data: build,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .acts
            .buildAct({ actId, token, version, waitForFinish, tag, betaPackages, useCache })
            .then(res => expect(res).to.be.eql(build));
    });

    xit('getBuild() works', () => {
        const actId = 'some-act-id';
        const buildId = 'some-build-id';
        const token = 'some-token';
        const build = { foo: 'bar' };
        const waitForFinish = 120;

        requestExpectCall({
            json: true,
            method: 'GET',
            url: `${BASE_URL}${BASE_PATH}/${actId}/builds/${buildId}`,
            qs: { token, waitForFinish },
        }, {
            data: build,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .acts
            .getBuild({ actId, token, buildId, waitForFinish })
            .then(res => expect(res).to.be.eql(build));
    });

    xit('getBuild() returns null on 404 status code (RECORD_NOT_FOUND)', () => {
        const actId = 'some-act-id';
        const buildId = 'some-build-id';
        const token = 'some-token';

        requestExpectErrorCall({
            json: true,
            method: 'GET',
            url: `${BASE_URL}${BASE_PATH}/${actId}/builds/${buildId}`,
            qs: { token },
        }, false, 404);

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .acts
            .getBuild({ actId, buildId, token })
            .then(given => expect(given).to.be.eql(null));
    });

    xit('abortBuild() works', () => {
        const actId = 'some-act-id';
        const buildId = 'some-build-id';
        const token = 'some-token';
        const build = { foo: 'bar' };

        requestExpectCall({
            json: true,
            method: 'POST',
            url: `${BASE_URL}${BASE_PATH}/${actId}/builds/${buildId}/abort`,
            qs: { token },
        }, {
            data: build,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .acts
            .abortBuild({ actId, token, buildId })
            .then(res => expect(res).to.be.eql(build));
    });

    xit('listActVersions() works', () => {
        const actId = 'some-act-id';
        const token = 'some-token';
        const expected = {
            total: 2,
            items: ['actVersion1', 'actVersion2'],
        };

        requestExpectCall({
            json: true,
            method: 'GET',
            url: `${BASE_URL}${BASE_PATH}/${actId}/versions`,
            qs: { token },
        }, {
            data: expected,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .acts
            .listActVersions({ actId, token })
            .then(res => expect(res).to.be.eql(expected));
    });

    xit('createActVersion() works', () => {
        const actId = 'some-act-id';
        const token = 'some-token';
        const actVersion = {
            versionNumber: '0.0',
            foo: 'bar',
        };

        requestExpectCall({
            json: true,
            method: 'POST',
            url: `${BASE_URL}${BASE_PATH}/${actId}/versions`,
            body: actVersion,
            qs: { token },
        }, {
            data: actVersion,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .acts
            .createActVersion({ actId, token, actVersion })
            .then(res => expect(res).to.be.eql(actVersion));
    });

    xit('getActVersion() works', () => {
        const actId = 'some-act-id';
        const token = 'some-token';
        const versionNumber = '0.0';
        const actVersion = {
            versionNumber: '0.0',
            foo: 'bar',
        };

        requestExpectCall({
            json: true,
            method: 'GET',
            url: `${BASE_URL}${BASE_PATH}/${actId}/versions/${versionNumber}`,
            qs: { token },
        }, {
            data: actVersion,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .acts
            .getActVersion({ actId, token, versionNumber })
            .then(res => expect(res).to.be.eql(actVersion));
    });

    xit('getActVersion() works if version did not exist', () => {
        const actId = 'some-act-id';
        const token = 'some-token';
        const versionNumber = '11.0';

        requestExpectErrorCall({
            json: true,
            method: 'GET',
            url: `${BASE_URL}${BASE_PATH}/${actId}/versions/${versionNumber}`,
            qs: { token },
        }, false, 404);

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .acts
            .getActVersion({ actId, token, versionNumber })
            .then(res => expect(res).to.be.eql(null));
    });

    xit('updateActVersion() works', () => {
        const actId = 'some-act-id';
        const token = 'some-token';
        const versionNumber = '0.0';
        const actVersion = {
            versionNumber: '0.0',
            foo: 'bar',
        };

        requestExpectCall({
            json: true,
            method: 'PUT',
            url: `${BASE_URL}${BASE_PATH}/${actId}/versions/${versionNumber}`,
            body: actVersion,
            qs: { token },
        }, {
            data: actVersion,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .acts
            .updateActVersion({ actId, token, actVersion, versionNumber })
            .then(res => expect(res).to.be.eql(actVersion));
    });

    xit('deleteActVersion() works', () => {
        const actId = 'some-act-id';
        const token = 'some-token';
        const versionNumber = '0.0';

        requestExpectCall({
            json: true,
            method: 'DELETE',
            url: `${BASE_URL}${BASE_PATH}/${actId}/versions/${versionNumber}`,
            qs: { token },
        }, {});

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .acts
            .deleteActVersion({ actId, token, versionNumber })
            .then(res => expect(res).to.be.eql(null));
    });

    xit('listWebhooks() works', () => {
        const actId = 'some-act-id';
        const token = 'some-token';

        const expected = {
            limit: 5,
            offset: 3,
            desc: true,
            count: 5,
            total: 10,
            items: ['run1', 'run2'],
        };

        requestExpectCall({
            json: true,
            method: 'GET',
            url: `${BASE_URL}${BASE_PATH}/${actId}/webhooks`,
            qs: { token },
        }, {
            data: expected,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .acts
            .listWebhooks({ actId, token })
            .then(res => expect(res).to.be.eql(expected));
    });
});
