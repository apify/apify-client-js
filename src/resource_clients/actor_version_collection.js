const ResourceCollectionClient = require('../base/resource_collection_client');

class ActorVersionCollectionClient extends ResourceCollectionClient {
    /**
     * @param {ApiClientOptions} options
     */
    constructor(options) {
        super({
            resourcePath: 'versions',
            disableMethods: ['getOrCreate'],
            ...options,
        });
    }
}

module.exports = ActorVersionCollectionClient;
