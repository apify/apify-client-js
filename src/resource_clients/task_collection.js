const ResourceCollectionClient = require('../base/resource_collection_client');

class TaskCollectionClient extends ResourceCollectionClient {
    /**
     * @param {object} options
     * @param {string} options.baseUrl
     * @param {HttpClient} options.httpClient
     * @param {object} [options.params]
     */
    constructor(options) {
        super({
            resourcePath: 'tasks',
            disableMethods: ['getOrCreate'],
            ...options,
        });
    }
}

module.exports = TaskCollectionClient;
