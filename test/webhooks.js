import { expect } from 'chai';
import ApifyClient from '../build';

import mockServer from './mock_server/server';
import { cleanUpBrowser, getInjectedPage, validateRequest, DEFAULT_QUERY } from './_helper';


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


    it('createWebhook() works', async () => {
        const webhook = { foo: 'bar' };

        const res = await client.webhooks.createWebhook({ webhook });
        expect(res.id).to.be.eql('create-webhook');
        validateRequest({}, {}, webhook);

        const browserRes = await page.evaluate(options => client.webhooks.createWebhook(options), { webhook });
        expect(browserRes).to.eql(res);
        validateRequest({}, {}, webhook);
    });

    it('listWebhooks() works', async () => {
        const opts = {
            limit: 5,
            offset: 3,
            desc: true,
        };

        const res = await client.webhooks.listWebhooks(opts);
        expect(res.id).to.be.eql('list-webhooks');
        validateRequest(opts);

        const browserRes = await page.evaluate(options => client.webhooks.listWebhooks(options), opts);
        expect(browserRes).to.eql(res);
        validateRequest(opts);
    });

    it('getWebhook() works', async () => {
        const webhookId = 'webhook_id';

        const res = await client.webhooks.getWebhook({ webhookId });
        expect(res.id).to.be.eql('get-webhook');
        validateRequest({}, { webhookId });

        const browserRes = await page.evaluate(options => client.webhooks.getWebhook(options), { webhookId });
        expect(browserRes).to.eql(res);
        validateRequest({}, { webhookId });
    });

    it('getWebhook() 404', async () => {
        const webhookId = '404';

        const res = await client.webhooks.getWebhook({ webhookId });
        expect(res).to.be.eql(null);
        validateRequest({}, { webhookId });

        const browserRes = await page.evaluate(options => client.webhooks.getWebhook(options), { webhookId });
        expect(browserRes).to.eql(res);
        validateRequest({}, { webhookId });
    });

    it('updateWebhook() works', async () => {
        const webhookId = 'webhook_id';
        const webhook = {
            foo: 'bar',
            updated: 'value',
        };

        const res = await client.webhooks.updateWebhook({ webhookId, webhook });
        expect(res.id).to.be.eql('update-webhook');
        validateRequest({}, { webhookId }, webhook);

        const browserRes = await page.evaluate(options => client.webhooks.updateWebhook(options), { webhookId, webhook });
        expect(browserRes).to.eql(res);
        validateRequest({}, { webhookId }, webhook);
    });

    it('deleteWebhook() works', async () => {
        const webhookId = '204';

        const res = await client.webhooks.deleteWebhook({ webhookId });
        expect(res).to.be.eql('');
        validateRequest({}, { webhookId });

        const browserRes = await page.evaluate(options => client.webhooks.deleteWebhook(options), { webhookId });
        expect(browserRes).to.eql(res);
        validateRequest({}, { webhookId });
    });

    it('listDispatches() works', async () => {
        const webhookId = 'webhook_id';
        const opts = {
            limit: 5,
            offset: 3,
            desc: true,
        };

        const res = await client.webhooks.listDispatches({ webhookId, ...opts });
        expect(res.id).to.be.eql('list-dispatches');
        validateRequest(opts, { webhookId });

        const browserRes = await page.evaluate(options => client.webhooks.listDispatches(options), { webhookId, ...opts });
        expect(browserRes).to.eql(res);
        validateRequest(opts, { webhookId });
    });
});
