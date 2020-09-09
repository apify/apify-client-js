const ResourceClient = require('../base/resource_client');

class ActorVersionClient extends ResourceClient {
    /**
     * @param {ApiClientOptions} options
     */
    constructor(options) {
        super({
            resourcePath: 'versions',
            ...options,
        });
    }
}

module.exports = ActorVersionClient;
