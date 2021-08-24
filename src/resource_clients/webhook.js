const ow = require('ow').default;
const ResourceClient = require('../base/resource_client');
const WebhookDispatchCollectionClient = require('./webhook_dispatch_collection');
const {
    pluckData,
    parseDateFields,
    catchNotFoundOrThrow,
} = require('../utils');

/**
 * @hideconstructor
 */
class WebhookClient extends ResourceClient {
    /**
     * @param {ApiClientOptions} options
     */
    constructor(options) {
        super({
            resourcePath: 'webhooks',
            ...options,
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/webhooks/webhook-object/get-webhook
     * @return {Promise<?Webhook>}
     */
    async get() {
        return this._get();
    }

    /**
     * https://docs.apify.com/api/v2#/reference/webhooks/webhook-object/update-webhook
     * @param {object} newFields
     * @return {Promise<Webhook>}
     */
    async update(newFields) {
        ow(newFields, ow.object);
        return this._update(newFields);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/webhooks/webhook-object/delete-webhook
     * @return {Promise<void>}
     */
    async delete() {
        return this._delete();
    }

    /**
     * https://docs.apify.com/api/v2#/reference/webhooks/webhook-test/test-webhook
     * @return {Promise<WebhookDispatch>}
     */
    async test() {
        const request = {
            url: this._url('test'),
            method: 'POST',
            params: this._params(),
        };

        try {
            const response = await this.httpClient.call(request);
            return parseDateFields(pluckData(response.data));
        } catch (err) {
            return catchNotFoundOrThrow(err);
        }
    }

    /**
     * https://docs.apify.com/api/v2#/reference/webhooks/dispatches-collection
     * @return {WebhookDispatchCollectionClient}
     */
    dispatches() {
        return new WebhookDispatchCollectionClient(this._subResourceOptions({
            resourcePath: 'dispatches',
        }));
    }
}

module.exports = WebhookClient;
