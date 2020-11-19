const ow = require('ow');
const ResourceCollectionClient = require('../base/resource_collection_client');

class KeyValueStoreCollectionClient extends ResourceCollectionClient {
    /**
     * @param {ApiClientOptions} options
     */
    constructor(options) {
        super({
            resourcePath: 'key-value-stores',
            ...options,
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/key-value-stores/store-collection/get-list-of-key-value-stores
     * @param {object} [options]
     * @param {boolean} [options.unnamed]
     * @param {number} [options.limit]
     * @param {number} [options.offset]
     * @param {boolean} [options.desc]
     * @return {Promise<object>}
     */
    async list(options = {}) {
        ow(options, ow.object.exactShape({
            unnamed: ow.optional.boolean,
            limit: ow.optional.number,
            offset: ow.optional.number,
            desc: ow.optional.boolean,
        }));
        return this._list(options);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/key-value-stores/store-collection/create-key-value-store
     * @param {string} [name]
     * @return {Promise<object>}
     */
    async getOrCreate(name) {
        return this._getOrCreate(name);
    }
}

module.exports = KeyValueStoreCollectionClient;
