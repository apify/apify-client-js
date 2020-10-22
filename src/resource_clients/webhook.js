const ResourceClient = require('../base/resource_client');
const WebhookDispatchCollectionClient = require('./webhook_dispatch_collection');

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

    dispatches() {
        return new WebhookDispatchCollectionClient(this._subResourceOptions({
            resourcePath: 'dispatches',
        }));
    }
}

module.exports = WebhookClient;
