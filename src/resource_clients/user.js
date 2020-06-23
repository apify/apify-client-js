const ResourceClient = require('../base/resource_client');

class UserClient extends ResourceClient {
    /**
     * @param {ApiClientOptions} options
     */
    constructor(options) {
        super({
            resourcePath: 'users',
            disableMethods: ['update', 'delete'],
            ...options,
        });
    }
}

module.exports = UserClient;
