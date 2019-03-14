import { expect } from 'chai';
import ApifyClient from '../build';
import { BASE_PATH } from '../build/webhooks';
import { mockRequest, requestExpectCall, restoreRequest } from './_helper';

const BASE_URL = 'http://example.com/something';
const OPTIONS = { baseUrl: BASE_URL };

const token = 'some-token';

describe('Webhooks methods', () => {
    before(mockRequest);
    after(restoreRequest);

    it('createWebhook() works', () => {
        const webhook = {
            actId: 'actId',
            foo: 'bar',
        };

        requestExpectCall({
            json: true,
            method: 'POST',
            url: `${BASE_URL}${BASE_PATH}`,
            qs: { token },
            body: webhook,
        }, { data: webhook });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .webhooks
            .createWebhook({ webhook, token })
            .then(response => expect(response).to.be.eql(webhook));
    });
    it('listWebhooks() works', () => {
        const webhooks = {
            count: 1,
            total: 10,
            items: [
                'webhook1',
                'webhook2',
                'webhook3',
            ],
        };

        requestExpectCall({
            json: true,
            method: 'GET',
            url: `${BASE_URL}${BASE_PATH}`,
            qs: { token },
        }, { data: webhooks });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .webhooks
            .listWebhooks({ token })
            .then(response => expect(response).to.be.deep.eql(webhooks));
    });
    it('getWebhook() works', () => {
        const webhookId = 'webhook_id';
        const webhook = {
            id: webhookId,
            foo: 'bar',
        };

        requestExpectCall({
            json: true,
            method: 'GET',
            url: `${BASE_URL}${BASE_PATH}/${webhookId}`,
            qs: { token },
        }, { data: webhook });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .webhooks
            .getWebhook({ token, webhookId })
            .then(response => expect(response).to.be.eql(webhook));
    });
    it('updateWebhook() works', () => {
        const webhookId = 'webhook_id';
        const webhook = {
            foo: 'bar',
            updated: 'value',
        };

        requestExpectCall({
            json: true,
            method: 'PUT',
            url: `${BASE_URL}${BASE_PATH}/${webhookId}`,
            qs: { token },
            body: webhook,
        }, { data: webhook });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .webhooks
            .updateWebhook({ token, webhook, webhookId })
            .then(response => expect(response).to.be.eql(webhook));
    });
    it('deleteWebhook() works', () => {
        const webhookId = 'webhook_id';

        requestExpectCall({
            json: true,
            method: 'DELETE',
            url: `${BASE_URL}${BASE_PATH}/${webhookId}`,
            qs: { token },
        }, {});

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .webhooks
            .deleteWebhook({ token, webhookId })
            .then(response => expect(response).to.be.eql({}));
    });
    it('listDispatches() works', () => {
        const webhookId = 'webhook_id';
        const dispatches = {
            count: 1,
            total: 10,
            items: [
                'dispatch1',
                'dispatch2',
                'dispatch3',
            ],
        };

        requestExpectCall({
            json: true,
            method: 'GET',
            url: `${BASE_URL}${BASE_PATH}/${webhookId}/dispatches`,
            qs: { token },
        }, { data: dispatches });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .webhooks
            .listDispatches({ token, webhookId })
            .then(response => expect(response).to.be.deep.eql(dispatches));
    });
});
