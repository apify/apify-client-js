import { expect } from 'chai';
import ApifyClient from '../build';
import { BASE_PATH } from '../build/webhook_dispatches';
import { mockRequest, requestExpectCall, restoreRequest } from './_helper';

const BASE_URL = 'http://example.com/something';
const OPTIONS = { baseUrl: BASE_URL };

const token = 'some-token';

describe('Webhook dispatches methods', () => {
    before(mockRequest);
    after(restoreRequest);

    it('listWebhookDispatches() works', () => {
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
            url: `${BASE_URL}${BASE_PATH}`,
            qs: { token },
        }, { data: dispatches });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .webhookDispatches
            .listWebhookDispatches({ token })
            .then(response => expect(response).to.be.deep.eql(dispatches));
    });

    it('listWebhookDispatches() works', () => {
        const webhookDispatchId = 'some-id';
        const dispatch = {
            foo: 'bar',
        };

        requestExpectCall({
            json: true,
            method: 'GET',
            url: `${BASE_URL}${BASE_PATH}/${webhookDispatchId}`,
            qs: { token },
        }, { data: dispatch });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .webhookDispatches
            .getWebhookDispatch({ token, webhookDispatchId })
            .then(response => expect(response).to.be.deep.eql(dispatch));
    });
});
