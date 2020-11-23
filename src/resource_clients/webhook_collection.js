const ow = require('ow');
const ResourceCollectionClient = require('../base/resource_collection_client');

/**
 * @hideconstructor
 */
class WebhookCollectionClient extends ResourceCollectionClient {
    /**
     * @param {ApiClientOptions} options
     */
    constructor(options) {
        super({
            resourcePath: 'webhooks',
            ...options,
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/webhooks/webhook-collection/get-list-of-webhooks
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

    /**
     * https://docs.apify.com/api/v2#/reference/webhooks/webhook-collection/create-webhook
     * @param {object} [webhook]
     * @return {Promise<Webhook>}
     */
    async create(webhook) {
        ow(webhook, ow.optional.object);
        return this._create(webhook);
    }
}

module.exports = WebhookCollectionClient;
