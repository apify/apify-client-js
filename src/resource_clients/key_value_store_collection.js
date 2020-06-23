const ow = require('ow');
const ResourceCollectionClient = require('../base/resource_collection_client');

class KeyValueStoreCollectionClient extends ResourceCollectionClient {
    /**
     * @param {ApiClientOptions} options
     */
    constructor(options) {
        super({
            resourcePath: 'key-value-stores',
            disableMethods: ['create'],
            ...options,
        });
    }

    async list(options = {}) {
        ow(options, ow.object.exactShape({
            unnamed: ow.optional.boolean,
            limit: ow.optional.number,
            offset: ow.optional.number,
            desc: ow.optional.boolean,
        }));
        return super.list(options);
    }
}

module.exports = KeyValueStoreCollectionClient;
