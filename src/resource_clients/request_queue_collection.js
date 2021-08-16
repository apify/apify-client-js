const ow = require('ow').default;
const { ResourceCollectionClient } = require('../base/resource_collection_client');

/**
 * @hideconstructor
 */
class RequestQueueCollection extends ResourceCollectionClient {
    /**
     * @param {ApiClientOptions} options
     */
    constructor(options) {
        super({
            resourcePath: 'request-queues',
            ...options,
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/request-queues/queue-collection/get-list-of-request-queues
     * @param {object} [options]
     * @param {boolean} [options.unnamed]
     * @param {number} [options.limit]
     * @param {number} [options.offset]
     * @param {boolean} [options.desc]
     * @return {Promise<PaginationList>}
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
     * https://docs.apify.com/api/v2#/reference/request-queues/queue-collection/create-request-queue
     * @param {string} [name]
     * @return {Promise<RequestQueue>}
     */
    async getOrCreate(name) {
        ow(name, ow.optional.string);
        return this._getOrCreate(name);
    }
}

module.exports = RequestQueueCollection;
