import _ from 'underscore';
import { expect } from 'chai';
import ApifyClient from '../build';
import { stringifyWebhooksToBase64 } from '../build/utils';
import { BASE_PATH } from '../build/acts';
import { mockRequest, requestExpectCall, requestExpectErrorCall, restoreRequest } from './_helper';

const BASE_URL = 'http://example.com/something';
const OPTIONS = { baseUrl: BASE_URL };

describe('Act method', () => {
    before(mockRequest);
    after(restoreRequest);

    it('listActs() works', () => {
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
            count: 5,
            total: 10,
            desc: true,
            items: ['act1', 'act2'],
        };

        requestExpectCall({
            json: true,
            method: 'GET',
            url: `${BASE_URL}${BASE_PATH}`,
            qs: queryString,
        }, {
            data: expected,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .acts
            .listActs(callOptions)
            .then(response => expect(response).to.be.eql(expected));
    });

    it('createAct() works', () => {
        const act = { foo: 'bar' };
        const token = 'some-token';

        requestExpectCall({
            json: true,
            method: 'POST',
            url: `${BASE_URL}${BASE_PATH}`,
            qs: { token },
            body: act,
        }, {
            data: act,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .acts
            .createAct({ act, token })
            .then(response => expect(response).to.be.eql(act));
    });

    it('updateAct() works with both actId parameter and actId in act object', () => {
        const actId = 'some-user/some-id';
        const act = { id: actId, foo: 'bar' };
        const token = 'some-token';

        requestExpectCall({
            json: true,
            method: 'PUT',
            url: `${BASE_URL}${BASE_PATH}/some-user~some-id`,
            qs: { token },
            body: _.omit(act, 'id'),
        }, {
            data: act,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .acts
            .updateAct({ actId, act, token })
            .then(response => expect(response).to.be.eql(act));
    });

    it('updateAct() works with actId in act object', () => {
        const actId = 'some-id';
        const act = { id: actId, foo: 'bar' };
        const token = 'some-token';

        requestExpectCall({
            json: true,
            method: 'PUT',
            url: `${BASE_URL}${BASE_PATH}/${actId}`,
            qs: { token },
            body: _.omit(act, 'id'),
        }, {
            data: act,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .acts
            .updateAct({ act, token })
            .then(response => expect(response).to.be.eql(act));
    });

    it('updateAct() works with actId parameter', () => {
        const actId = 'some-id';
        const act = { foo: 'bar' };
        const token = 'some-token';

        requestExpectCall({
            json: true,
            method: 'PUT',
            url: `${BASE_URL}${BASE_PATH}/${actId}`,
            qs: { token },
            body: act,
        }, {
            data: act,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .acts
            .updateAct({ actId, act, token })
            .then(response => expect(response).to.be.eql(act));
    });

    it('getAct() works', () => {
        const actId = 'some-id';
        const act = { id: actId, foo: 'bar' };
        const token = 'some-token';

        requestExpectCall({
            json: true,
            method: 'GET',
            url: `${BASE_URL}${BASE_PATH}/${actId}`,
            qs: { token },
        }, {
            data: act,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .acts
            .getAct({ actId, token })
            .then(response => expect(response).to.be.eql(act));
    });

    it('getAct() returns null on 404 status code (RECORD_NOT_FOUND)', () => {
        const actId = 'some-id';
        const token = 'some-token';

        requestExpectErrorCall({
            json: true,
            method: 'GET',
            url: `${BASE_URL}${BASE_PATH}/${actId}`,
            qs: { token },
        }, false, 404);

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .acts
            .getAct({ actId, token })
            .then(given => expect(given).to.be.eql(null));
    });

    it('deleteAct() works', () => {
        const actId = 'some-id';
        const token = 'some-token';

        requestExpectCall({
            json: true,
            method: 'DELETE',
            url: `${BASE_URL}${BASE_PATH}/${actId}`,
            qs: { token },
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .acts
            .deleteAct({ actId, token });
    });

    it('listRuns() works', () => {
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
            items: ['run1', 'run2'],
        };

        requestExpectCall({
            json: true,
            method: 'GET',
            url: `${BASE_URL}${BASE_PATH}/${actId}/runs`,
            qs: queryString,
        }, {
            data: expected,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .acts
            .listRuns(Object.assign({}, callOptions, { actId }))
            .then(response => expect(response).to.be.eql(expected));
    });

    it('runAct() works', () => {
        const actId = 'some-id';
        const token = 'some-token';
        const contentType = 'some-type';
        const body = 'some-body';
        const run = { foo: 'bar' };
        const apiResponse = JSON.stringify({ data: run });

        const waitForFinish = 120;
        const timeout = 120;
        const memory = 256;
        const build = '1.2.0';

        requestExpectCall({
            method: 'POST',
            url: `${BASE_URL}${BASE_PATH}/${actId}/runs`,
            qs: { token, waitForFinish, timeout, memory, build },
            headers: {
                'Content-Type': contentType,
            },
            body,
        }, apiResponse);

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .acts
            .runAct({ actId, token, contentType, body, waitForFinish, timeout, memory, build })
            .then(response => expect(response).to.be.eql(run));
    });

    it('runAct() with webhook works', () => {
        const actId = 'some-id';
        const token = 'some-token';
        const run = { foo: 'bar' };
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

        requestExpectCall({
            method: 'POST',
            url: `${BASE_URL}${BASE_PATH}/${actId}/runs`,
            qs: { token, webhooks: stringifyWebhooksToBase64(webhooks) },
        }, JSON.stringify({ data: run }));

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .acts
            .runAct({ actId, token, webhooks })
            .then(response => expect(response).to.be.eql(run));
    });

    it('runAct() works without token', () => {
        const actId = 'some-id';
        const run = { foo: 'bar' };
        const apiResponse = JSON.stringify({ data: run });

        requestExpectCall({
            method: 'POST',
            url: `${BASE_URL}${BASE_PATH}/${actId}/runs`,
            qs: {},
        }, apiResponse);

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .acts
            .runAct({ actId })
            .then(response => expect(response).to.be.eql(run));
    });

    it('getRun() works', () => {
        const actId = 'some-act-id';
        const runId = 'some-run-id';
        const token = 'some-token';
        const run = { foo: 'bar' };
        const waitForFinish = 120;

        requestExpectCall({
            json: true,
            method: 'GET',
            url: `${BASE_URL}${BASE_PATH}/${actId}/runs/${runId}`,
            qs: { token, waitForFinish },
        }, {
            data: run,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .acts
            .getRun({ actId, token, runId, waitForFinish })
            .then(response => expect(response).to.be.eql(run));
    });

    it('abortRun() works', () => {
        const actId = 'some-act-id';
        const runId = 'some-run-id';
        const token = 'some-token';
        const run = { foo: 'bar' };

        requestExpectCall({
            json: true,
            method: 'POST',
            url: `${BASE_URL}${BASE_PATH}/${actId}/runs/${runId}/abort`,
            qs: { token },
        }, {
            data: run,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .acts
            .abortRun({ actId, token, runId })
            .then(response => expect(response).to.be.eql(run));
    });

    it('metamorphRun() works', () => {
        const actId = 'some-id';
        const token = 'some-token';
        const contentType = 'some-type';
        const body = 'some-body';
        const run = { foo: 'bar' };
        const runId = 'some-run-id';
        const apiResponse = JSON.stringify({ data: run });
        const build = '1.2.0';
        const targetActorId = 'some-actor-id';

        requestExpectCall({
            method: 'POST',
            url: `${BASE_URL}${BASE_PATH}/${actId}/runs/${runId}/metamorph`,
            qs: { token, build, targetActorId },
            headers: {
                'Content-Type': contentType,
            },
            body,
        }, apiResponse);

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .acts
            .metamorphRun({ actId, token, contentType, body, build, runId, targetActorId })
            .then(response => expect(response).to.be.eql(run));
    });

    it('getRun() works without token', () => {
        const actId = 'some-act-id';
        const runId = 'some-run-id';
        const run = { foo: 'bar' };

        requestExpectCall({
            json: true,
            method: 'GET',
            url: `${BASE_URL}${BASE_PATH}/${actId}/runs/${runId}`,
            qs: {},
        }, {
            data: run,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .acts
            .getRun({ actId, runId })
            .then(response => expect(response).to.be.eql(run));
    });

    it('getRun() returns null on 404 status code (RECORD_NOT_FOUND)', () => {
        const actId = 'some-act-id';
        const runId = 'some-run-id';
        const token = 'some-token';

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

    it('listBuilds() works', () => {
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
            .then(response => expect(response).to.be.eql(expected));
    });

    it('buildAct() works', () => {
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
            .then(response => expect(response).to.be.eql(build));
    });

    it('getBuild() works', () => {
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
            .then(response => expect(response).to.be.eql(build));
    });

    it('getBuild() returns null on 404 status code (RECORD_NOT_FOUND)', () => {
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

    it('abortBuild() works', () => {
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
            .then(response => expect(response).to.be.eql(build));
    });

    it('listActVersions() works', () => {
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
            .then(response => expect(response).to.be.eql(expected));
    });

    it('createActVersion() works', () => {
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
            .then(response => expect(response).to.be.eql(actVersion));
    });

    it('getActVersion() works', () => {
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
            .then(response => expect(response).to.be.eql(actVersion));
    });

    it('getActVersion() works if version did not exist', () => {
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
            .then(response => expect(response).to.be.eql(null));
    });

    it('updateActVersion() works', () => {
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
            .then(response => expect(response).to.be.eql(actVersion));
    });

    it('deleteActVersion() works', () => {
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
            .then(response => expect(response).to.be.eql(null));
    });

    it('listWebhooks() works', () => {
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
            .then(response => expect(response).to.be.eql(expected));
    });
});
