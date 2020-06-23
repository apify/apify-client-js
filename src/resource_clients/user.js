const ResourceClient = require('../base/resource_client');

class UserClient extends ResourceClient {
    /**
     * @param {object} options
     * @param {string} options.id
     * @param {string} options.baseUrl
     * @param {HttpClient} options.httpClient
     * @param {object} [options.params]
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
