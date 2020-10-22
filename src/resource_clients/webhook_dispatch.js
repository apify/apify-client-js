const ResourceClient = require('../base/resource_client');

class WebhookDispatchClient extends ResourceClient {
    /**
     * @param {ApiClientOptions} options
     */
    constructor(options) {
        super({
            resourcePath: 'webhook-dispatches',
            disableMethods: ['update', 'delete'],
            ...options,
        });
    }
}

module.exports = WebhookDispatchClient;
