const ow = require('ow');
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

    /**
     * https://docs.apify.com/api/v2#/reference/actors/version-object/get-version
     * @return {Promise<ActorVersion>}
     */
    async get() {
        return this._get();
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/version-object/update-version
     * @param {object} newFields
     * @return {Promise<ActorVersion>}
     */
    async update(newFields) {
        ow(newFields, ow.object);
        return this._update(newFields);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/version-object/delete-version
     * @return {Promise<void>}
     */
    async delete() {
        return this._delete();
    }
}

module.exports = ActorVersionClient;
