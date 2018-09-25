import _ from 'underscore';
import { expect } from 'chai';
import ApifyClient from '../build';
import { BASE_PATH } from '../build/actor_configs';
import { mockRequest, requestExpectCall, requestExpectErrorCall, restoreRequest } from './_helper';

const BASE_URL = 'http://example.com/something';
const OPTIONS = { baseUrl: BASE_URL };

describe('ActorConfigs method', () => {
    before(mockRequest);
    after(restoreRequest);

    it('listActorConfigs() works', () => {
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
            items: ['actorConfig1', 'actorConfig2'],
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
            .actorConfigs
            .listActorConfigs(callOptions)
            .then(response => expect(response).to.be.eql(expected));
    });

    it('listActorConfigs() works without pagination', () => {
        const callOptions = {
            token: 'sometoken',
        };

        const queryString = {
            token: 'sometoken',
        };

        const expected = {
            limit: 1000,
            offset: 0,
            count: 2,
            total: 2,
            desc: false,
            items: ['actorConfig1', 'actorConfig2'],
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
            .actorConfigs
            .listActorConfigs(callOptions)
            .then(response => expect(response).to.be.eql(expected));
    });

    it('createActorConfig() works', () => {
        const actorConfig = { foo: 'bar' };
        const token = 'some-token';

        requestExpectCall({
            json: true,
            method: 'POST',
            url: `${BASE_URL}${BASE_PATH}`,
            qs: { token },
            body: actorConfig,
        }, {
            data: actorConfig,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .actorConfigs
            .createActorConfig({ actorConfig, token })
            .then(response => expect(response).to.be.eql(actorConfig));
    });

    it('updateActorConfig() works with both actorConfigId parameter and actorConfigId in actorConfig object', () => {
        const actorConfigId = 'some-user/some-id';
        const actorConfig = { id: actorConfigId, foo: 'bar' };
        const token = 'some-token';

        requestExpectCall({
            json: true,
            method: 'PUT',
            url: `${BASE_URL}${BASE_PATH}/some-user~some-id`,
            qs: { token },
            body: _.omit(actorConfig, 'id'),
        }, {
            data: actorConfig,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .actorConfigs
            .updateActorConfig({ actorConfigId, actorConfig, token })
            .then(response => expect(response).to.be.eql(actorConfig));
    });

    it('updateActorConfig() works with actorConfigId in actorConfig object', () => {
        const actorConfigId = 'some-id';
        const actorConfig = { id: actorConfigId, foo: 'bar' };
        const token = 'some-token';

        requestExpectCall({
            json: true,
            method: 'PUT',
            url: `${BASE_URL}${BASE_PATH}/${actorConfigId}`,
            qs: { token },
            body: _.omit(actorConfig, 'id'),
        }, {
            data: actorConfig,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .actorConfigs
            .updateActorConfig({ actorConfig, token })
            .then(response => expect(response).to.be.eql(actorConfig));
    });

    it('updateActorConfig() works with actorConfigId parameter', () => {
        const actorConfigId = 'some-id';
        const actorConfig = { foo: 'bar' };
        const token = 'some-token';

        requestExpectCall({
            json: true,
            method: 'PUT',
            url: `${BASE_URL}${BASE_PATH}/${actorConfigId}`,
            qs: { token },
            body: actorConfig,
        }, {
            data: actorConfig,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .actorConfigs
            .updateActorConfig({ actorConfigId, actorConfig, token })
            .then(response => expect(response).to.be.eql(actorConfig));
    });

    it('updateActorConfig() works with actorConfigId as part actorConfig.id parameter', () => {
        const actorConfig = { id: 'some-id', foo: 'bar' };
        const token = 'some-token';

        requestExpectCall({
            json: true,
            method: 'PUT',
            url: `${BASE_URL}${BASE_PATH}/${actorConfig.id}`,
            qs: { token },
            body: { foo: 'bar' },
        }, {
            data: actorConfig,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .actorConfigs
            .updateActorConfig({ actorConfig, token })
            .then(response => expect(response).to.be.eql(actorConfig));
    });

    it('getActorConfig() works', () => {
        const actorConfigId = 'some-id';
        const actorConfig = { id: actorConfigId, foo: 'bar' };
        const token = 'some-token';

        requestExpectCall({
            json: true,
            method: 'GET',
            url: `${BASE_URL}${BASE_PATH}/${actorConfigId}`,
            qs: { token },
        }, {
            data: actorConfig,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .actorConfigs
            .getActorConfig({ actorConfigId, token })
            .then(response => expect(response).to.be.eql(actorConfig));
    });

    it('getActorConfig() works without token', () => {
        const actorConfigId = 'some-id';
        const actorConfig = { id: actorConfigId, foo: 'bar' };

        requestExpectCall({
            json: true,
            method: 'GET',
            url: `${BASE_URL}${BASE_PATH}/${actorConfigId}`,
            qs: {},
        }, {
            data: actorConfig,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .actorConfigs
            .getActorConfig({ actorConfigId })
            .then(response => expect(response).to.be.eql(actorConfig));
    });

    it('getActorConfig() returns null on 404 status code (RECORD_NOT_FOUND)', () => {
        const actorConfigId = 'some-id';
        const token = 'some-token';

        requestExpectErrorCall({
            json: true,
            method: 'GET',
            url: `${BASE_URL}${BASE_PATH}/${actorConfigId}`,
            qs: { token },
        }, false, 404);

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .actorConfigs
            .getActorConfig({ actorConfigId, token })
            .then(given => expect(given).to.be.eql(null));
    });

    it('deleteActorConfig() works', () => {
        const actorConfigId = 'some-id';
        const token = 'some-token';

        requestExpectCall({
            json: true,
            method: 'DELETE',
            url: `${BASE_URL}${BASE_PATH}/${actorConfigId}`,
            qs: { token },
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .actorConfigs
            .deleteActorConfig({ actorConfigId, token });
    });

    it('listActorConfigRuns() works', () => {
        const actorConfigId = 'some-id';

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
            url: `${BASE_URL}${BASE_PATH}/${actorConfigId}/runs`,
            qs: queryString,
        }, {
            data: expected,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .actorConfigs
            .listActorConfigRuns(Object.assign({}, callOptions, { actorConfigId }))
            .then(response => expect(response).to.be.eql(expected));
    });

    it('listActorConfigRuns() works without pagination params', () => {
        const actorConfigId = 'some-id';

        const callOptions = {
            token: 'sometoken',
        };

        const queryString = {
            token: 'sometoken',
        };

        const expected = {
            limit: 1000,
            offset: 0,
            desc: false,
            count: 2,
            total: 2,
            items: ['run1', 'run2'],
        };

        requestExpectCall({
            json: true,
            method: 'GET',
            url: `${BASE_URL}${BASE_PATH}/${actorConfigId}/runs`,
            qs: queryString,
        }, {
            data: expected,
        });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .actorConfigs
            .listActorConfigRuns(Object.assign({}, callOptions, { actorConfigId }))
            .then(response => expect(response).to.be.eql(expected));
    });

    it('runActorConfig() works', () => {
        const actorConfigId = 'some-id';
        const token = 'some-token';
        const run = { foo: 'bar' };
        const apiResponse = JSON.stringify({ data: run });

        const waitForFinish = 120;

        requestExpectCall({
            method: 'POST',
            url: `${BASE_URL}${BASE_PATH}/${actorConfigId}/runs`,
            qs: { token, waitForFinish },
        }, apiResponse);

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .actorConfigs
            .runActorConfig({ actorConfigId, token, waitForFinish })
            .then(response => expect(response).to.be.eql(run));
    });

    /*

    it('runActorConfig() works without token', () => {
        const actorConfigId = 'some-id';
        const run = { foo: 'bar' };
        const apiResponse = JSON.stringify({ data: run });

        requestExpectCall({
            method: 'POST',
            url: `${BASE_URL}${BASE_PATH}/${actorConfigId}/runs`,
            qs: {},
        }, apiResponse);

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .actorConfigs
            .runActorConfig({ actorConfigId })
            .then(response => expect(response).to.be.eql(run));
    });
    */
});
