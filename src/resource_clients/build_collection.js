const ResourceCollectionClient = require('../base/resource_collection_client');

class BuildCollectionClient extends ResourceCollectionClient {
    /**
     * @param {object} options
     * @param {string} options.baseUrl
     * @param {HttpClient} options.httpClient
     * @param {object} [options.params]
     */
    constructor(options) {
        super({
            resourcePath: 'builds',
            disableMethods: ['create', 'getOrCreate'],
            ...options,
        });
    }
}

module.exports = BuildCollectionClient;
