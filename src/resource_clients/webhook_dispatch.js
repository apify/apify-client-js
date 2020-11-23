const ResourceClient = require('../base/resource_client');

/**
 * @hideconstructor
 */
class WebhookDispatchClient extends ResourceClient {
    /**
     * @param {ApiClientOptions} options
     */
    constructor(options) {
        super({
            resourcePath: 'webhook-dispatches',
            ...options,
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/webhook-dispatches/webhook-dispatch-object/get-webhook-dispatch
     * @return {Promise<?WebhookDispatch>}
     */
    async get() {
        return this._get();
    }
}

module.exports = WebhookDispatchClient;
