import { catchNotFoundOrThrow, checkParamOrThrow, parseDateFields, pluckData } from './utils';
import Resource from './resource';

/**
 * Webhooks
 * @memberOf ApifyClient
 * @description
 * Webhooks provide an easy and reliable way to configure the Apify platform to carry out an action
 * (e.g. a HTTP request to another service) when a certain system event occurs.
 *
 * For more information see the [Webhooks endpoint](https://docs.apify.com/api/v2#/reference/webhooks).
 *
 * @namespace webhooks
 */

export default class Webhooks extends Resource {
    constructor(httpClient) {
        super(httpClient, '/v2/webhooks');
    }

    /**
     * Creates a new webhook with settings provided by the webhook object passed as `options.webhook`.
     * The response is the created webhook object.
     * To make sure that the same webhook is not created twice, use the idempotencyKey parameter.
     * Multiple calls to create webhook with the same idempotency key will only create the webhook with the first call a
     * nd return the existing webhook on subsequent calls. Idempotency keys must be unique,
     * so use a UUID or another random string with enough entropy.
     *
     * For more information see [create webhook endpoint](https://docs.apify.com/api/v2#/reference/webhooks/webhook-collection/create-webhook).
     *
     * @memberof ApifyClient.webhooks
     * @param {Object} options
     * @param options.webhook - Webhook
     * @returns {Webhook}
     */
    async createWebhook(options = {}) {
        const { webhook } = options;

        checkParamOrThrow(webhook, 'webhook', 'Object');

        const endpointOptions = {
            url: '',
            method: 'POST',
            body: webhook,
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * Gets list of webhooks.
     * @description By default, the objects are sorted by the createdAt field in ascending order,
     * therefore you can use pagination to incrementally fetch all webhooks.
     * To sort them in descending order, use desc: `true` parameter.
     *
     * For more information see [get list of webhooks endpoint](https://docs.apify.com/api/v2#/reference/webhooks/webhook-collection/create-webhook).
     *
     * @memberof ApifyClient.webhooks
     * @param {Object} options
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Boolean} [options.desc] - If `true` then the objects are sorted by the createdAt field in descending order.
     * @returns {PaginationList}
     */
    async listWebhooks(options = {}) {
        const { offset, limit, desc } = options;

        checkParamOrThrow(limit, 'limit', 'Maybe Number');
        checkParamOrThrow(offset, 'offset', 'Maybe Number');
        checkParamOrThrow(desc, 'desc', 'Maybe Boolean');

        const query = {};

        if (limit) query.limit = limit;
        if (offset) query.offset = offset;
        if (desc) query.desc = 1;

        const endpointOptions = {
            url: '',
            method: 'GET',
            qs: query,
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * Gets webhook object with all details.
     *
     * For more information see the [get webhook endpoint](https://docs.apify.com/api/v2#/reference/webhooks/webhook-object/get-webhook).
     *
     * @memberof ApifyClient.webhooks
     * @param {Object} options
     * @param options.webhookId - Webhook ID
     * @returns {Webhook}
     */
    async getWebhook(options = {}) {
        const { webhookId } = options;

        checkParamOrThrow(webhookId, 'webhookId', 'String');

        const endpointOptions = {
            url: `/${webhookId}`,
            method: 'GET',
        };

        try {
            const response = await this._call(options, endpointOptions);
            return parseDateFields(pluckData(response));
        } catch (err) {
            return catchNotFoundOrThrow(err);
        }
    }

    /**
     * Updates a webhook using values specified by a webhook object passed as `options.webhook`.
     * If the object does not define a specific property,
     * its value will not be updated.The response is the full webhook object as returned by the Get webhook endpoint.
     *
     * For more information see the [update webhook endpoint](https://docs.apify.com/api/v2#/reference/webhooks/webhook-object/update-webhook).
     *
     * @memberof ApifyClient.webhooks
     * @param {Object} options
     * @param options.token
     * @param options.webhookId - Webhook ID
     * @param options.webhook - Webhook
     * @returns {Webhook}
     */
    async updateWebhook(options = {}) {
        const { webhookId, webhook } = options;
        // TODO: Consistency with actor and task endpoint, they support the ID in the update body and also as a separate options

        checkParamOrThrow(webhookId, 'webhookId', 'String');
        checkParamOrThrow(webhook, 'webhook', 'Object');

        const endpointOptions = {
            url: `/${webhookId}`,
            method: 'PUT',
            body: webhook,
        };
        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * Deletes webhook.
     *
     * For more information see the [delete webhook endpoint](https://docs.apify.com/api/v2#/reference/webhooks/webhook-object/delete-webhook).
     *
     * @memberof ApifyClient.webhooks
     * @param {Object} options
     * @param options.webhookId - Webhook ID
     * @returns {}
     */
    async deleteWebhook(options = {}) {
        const { webhookId } = options;

        checkParamOrThrow(webhookId, 'webhookId', 'String');

        const endpointOptions = {
            url: `/${webhookId}`,
            method: 'DELETE',
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(response);
    }

    /**
     * Gets list dispatches for webhook.
     * @description By default, the objects are sorted by the createdAt.
     * @memberof ApifyClient.webhooks
     * @param {Object} options
     * @param options.webhookId - Webhook ID
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Boolean} [options.desc] - If `true` then the objects are sorted by the createdAt field in descending order.
     * @returns {PaginationList}
     */
    async listDispatches(options = {}) {
        const { webhookId, limit, offset, desc } = options;

        checkParamOrThrow(webhookId, 'webhookId', 'String');
        checkParamOrThrow(limit, 'limit', 'Maybe Number');
        checkParamOrThrow(offset, 'offset', 'Maybe Number');
        checkParamOrThrow(desc, 'desc', 'Maybe Boolean');

        const query = {};

        if (limit) query.limit = limit;
        if (offset) query.offset = offset;
        if (desc) query.desc = 1;

        const endpointOptions = {
            url: `/${webhookId}/dispatches`,
            method: 'GET',
            qs: query,
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }
}
