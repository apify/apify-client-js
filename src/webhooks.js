import { catchNotFoundOrThrow, checkParamOrThrow, parseDateFields, pluckData } from './utils';

/**
 * Webhooks
 * @memberOf ApifyClient
 * @description
 * ### Basic usage
 * Every method can be used as either promise or with callback. If your Node version supports await/async then you can await promise result.
 * ```javascript
 * const ApifyClient = require('apify-client');
 *
 * const apifyClient = new ApifyClient({
 *  userId: 'jklnDMNKLekk',
 *  token: 'SNjkeiuoeD443lpod68dk',
 * });
 *
 * // Awaited promise
 * try {
 *      const webhooks = await apifyClient.webhooks.listWebhooks({});
 *      // Do something with list ...
 * } catch (err) {
 *      // Do something with error ...
 * }
 *
 * // Promise
 * apifyClient.webhooks.listWebhooks({})
 * .then((webhooksList) => {
 *      // Do something with list ...
 * })
 * .catch((err) => {
 *      // Do something with error ...
 * });
 *
 * // Callback
 * apifyClient.webhooks.listWebhooks({}, (err, webhooksList) => {
 *      // Do something with error or list ...
 * });
 * ```
 * @namespace webhooks
 */

export default class Webhooks {
    constructor(httpClient) {
        this.basePath = '/v2/webhooks';
        this.client = httpClient;
    }

    _call(userOptions, endpointOptions) {
        const callOptions = this._getCallOptions(userOptions, endpointOptions);
        return this.client.call(callOptions);
    }

    _getCallOptions(userOptions, endpointOptions) {
        const { baseUrl, token } = userOptions;
        const callOptions = {
            basePath: this.basePath,
            json: true,
            ...endpointOptions,
        };
        if (baseUrl) callOptions.baseUrl = baseUrl;
        if (token) callOptions.token = token;
        return callOptions;
    }

    /**
     * Creates new webhook.
     *
     * @memberof ApifyClient.webhooks
     * @instance
     * @param {Object} options
     * @param options.webhook - Webhook
     * @returns {Webhook}
     */
    async createWebhook(options) {
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
     * @memberof ApifyClient.webhooks
     * @instance
     * @param {Object} options
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Boolean} [options.desc] - If `true` then the objects are sorted by the createdAt field in descending order.
     * @returns {PaginationList}
     */
    async listWebhooks(options) {
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
     * Gets webhook object.
     * @memberof ApifyClient.webhooks
     * @instance
     * @param {Object} options
     * @param options.webhookId - Webhook ID
     * @returns {Webhook}
     */
    async getWebhook(options) {
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
     * Updates webhook.
     * @memberof ApifyClient.webhooks
     * @instance
     * @param {Object} options
     * @param options.token
     * @param options.webhookId - Webhook ID
     * @param options.webhook - Webhook
     * @returns {Webhook}
     */
    async updateWebhook(options) {
        const { webhookId, webhook } = options;

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
     * @memberof ApifyClient.webhooks
     * @instance
     * @param {Object} options
     * @param options.webhookId - Webhook ID
     * @returns {}
     */
    async deleteWebhook(options) {
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
     * @instance
     * @param {Object} options
     * @param options.webhookId - Webhook ID
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Boolean} [options.desc] - If `true` then the objects are sorted by the createdAt field in descending order.
     * @returns {PaginationList}
     */
    async listDispatches(options) {
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
