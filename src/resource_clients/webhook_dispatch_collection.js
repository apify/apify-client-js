const ow = require('ow');
const ResourceCollectionClient = require('../base/resource_collection_client');

/**
 * @hideconstructor
 */
class WebhookDispatchCollectionClient extends ResourceCollectionClient {
    /**
     * @param {ApiClientOptions} options
     */
    constructor(options) {
        super({
            resourcePath: 'webhook-dispatches',
            ...options,
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/webhook-dispatches/webhook-dispatches-collection/get-list-of-webhook-dispatches
     * @param {object} [options]
     * @param {number} [options.limit]
     * @param {number} [options.offset]
     * @param {boolean} [options.desc]
     * @return {Promise<PaginationList>}
     */
    async list(options = {}) {
        ow(options, ow.object.exactShape({
            limit: ow.optional.number,
            offset: ow.optional.number,
            desc: ow.optional.boolean,
        }));
        return this._list(options);
    }
}

module.exports = WebhookDispatchCollectionClient;
