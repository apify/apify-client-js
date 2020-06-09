const ResourceCollectionClient = require('../base/resource_collection_client');

class WebhookCollectionClient extends ResourceCollectionClient {
    /**
     * @param {object} options
     * @param {string} options.baseUrl
     * @param {HttpClient} options.httpClient
     * @param {object} [options.params]
     */
    constructor(options) {
        super({
            resourcePath: 'webhooks',
            disableMethods: ['getOrCreate'],
            ...options,
        });
    }
}

module.exports = WebhookCollectionClient;
