const ResourceCollectionClient = require('../base/resource_collection_client');

class DatasetCollectionClient extends ResourceCollectionClient {
    /**
     * @param {object} options
     * @param {string} options.baseUrl
     * @param {HttpClient} options.httpClient
     * @param {object} [options.params]
     */
    constructor(options) {
        super({
            resourcePath: 'datasets',
            disableMethods: ['create'],
            ...options,
        });
    }
}

module.exports = DatasetCollectionClient;
