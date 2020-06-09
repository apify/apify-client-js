const ResourceCollectionClient = require('../base/resource_collection_client');

class KeyValueStoreCollectionClient extends ResourceCollectionClient {
    /**
     * @param {object} options
     * @param {string} options.baseUrl
     * @param {HttpClient} options.httpClient
     * @param {object} [options.params]
     */
    constructor(options) {
        super({
            resourcePath: 'key-value-stores',
            disableMethods: ['create'],
            ...options,
        });
    }
}

module.exports = KeyValueStoreCollectionClient;
