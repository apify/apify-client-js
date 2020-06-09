const ow = require('ow');
const ResourceCollectionClient = require('../base/resource_collection_client');

class WebhookDispatchCollectionClient extends ResourceCollectionClient {
    /**
     * @param {object} options
     * @param {string} options.baseUrl
     * @param {HttpClient} options.httpClient
     * @param {object} [options.params]
     */
    constructor(options) {
        super({
            resourcePath: 'webhook-dispatches',
            disableMethods: ['create', 'getOrCreate'],
            ...options,
        });
    }
}

module.exports = WebhookDispatchCollectionClient;
