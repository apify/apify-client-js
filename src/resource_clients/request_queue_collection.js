const ow = require('ow');
const ResourceCollectionClient = require('../base/resource_collection_client');

class RequestQueueCollection extends ResourceCollectionClient {
    /**
     * @param {ApiClientOptions} options
     */
    constructor(options) {
        super({
            resourcePath: 'request-queues',
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

module.exports = RequestQueueCollection;
