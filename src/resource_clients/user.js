const { ResourceClient } = require('../base/resource_client');

/**
 * @hideconstructor
 */
class UserClient extends ResourceClient {
    /**
     * @param {ApiClientOptions} options
     */
    constructor(options) {
        super({
            resourcePath: 'users',
            ...options,
        });
    }

    /**
     * Depending on whether ApifyClient was created with a token,
     * the method will either return public or private user data.
     * https://docs.apify.com/api/v2#/reference/users
     * @return {Promise<?User>}
     */
    async get() {
        return this._get();
    }
}

module.exports = UserClient;
