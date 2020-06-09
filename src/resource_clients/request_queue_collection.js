const ResourceCollectionClient = require('../base/resource_collection_client');

class RequestQueueCollection extends ResourceCollectionClient {
    /**
     * @param {object} options
     * @param {string} options.baseUrl
     * @param {HttpClient} options.httpClient
     * @param {object} [options.params]
     */
    constructor(options) {
        super({
            resourcePath: 'request-queues',
            disableMethods: ['create'],
            ...options,
        });
    }
}

module.exports = RequestQueueCollection;
