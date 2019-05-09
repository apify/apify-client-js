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
export const BASE_PATH = '/v2/webhooks';

export default {
    /**
     * Creates new webhook.
     *
     * @memberof ApifyClient.webhooks
     * @instance
     * @param {Object} options
     * @param options.token
     * @param options.webhook - Webhook
     * @param callback
     * @returns {Webhook}
     */
    createWebhook: (requestPromise, options) => {
        const { baseUrl, token, webhook } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(webhook, 'webhook', 'Object');
        checkParamOrThrow(token, 'token', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}`,
            json: true,
            method: 'POST',
            body: webhook,
            qs: { token },
        })
            .then(pluckData)
            .then(parseDateFields);
    },

    /**
     * Gets list of webhooks.
     * @description By default, the objects are sorted by the createdAt field in ascending order,
     * therefore you can use pagination to incrementally fetch all webhooks.
     * To sort them in descending order, use desc: `true` parameter.
     * @memberof ApifyClient.webhooks
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Boolean} [options.desc] - If `true` then the objects are sorted by the createdAt field in descending order.
     * @param callback
     * @returns {PaginationList}
     */
    listWebhooks: (requestPromise, options) => {
        const { baseUrl, token, offset, limit, desc } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(limit, 'limit', 'Maybe Number');
        checkParamOrThrow(offset, 'offset', 'Maybe Number');
        checkParamOrThrow(desc, 'desc', 'Maybe Boolean');

        const query = { token };

        if (limit) query.limit = limit;
        if (offset) query.offset = offset;
        if (desc) query.desc = 1;

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}`,
            json: true,
            method: 'GET',
            qs: query,
        })
            .then(pluckData)
            .then(parseDateFields);
    },

    /**
     * Gets webhook object.
     * @memberof ApifyClient.webhooks
     * @instance
     * @param {Object} options
     * @param options.token
     * @param options.webhookId - Webhook ID
     * @param callback
     * @returns {Webhook}
     */
    getWebhook: (requestPromise, options) => {
        const { baseUrl, token, webhookId } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(webhookId, 'webhookId', 'String');
        checkParamOrThrow(token, 'token', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${webhookId}`,
            json: true,
            method: 'GET',
            qs: { token },
        })
            .then(pluckData)
            .then(parseDateFields)
            .catch(catchNotFoundOrThrow);
    },

    /**
     * Updates webhook.
     * @memberof ApifyClient.webhooks
     * @instance
     * @param {Object} options
     * @param options.token
     * @param options.webhookId - Webhook ID
     * @param options.webhook - Webhook
     * @param callback
     * @returns {Webhook}
     */
    updateWebhook: (requestPromise, options) => {
        const { baseUrl, token, webhookId, webhook } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(webhookId, 'webhookId', 'String');
        checkParamOrThrow(webhook, 'webhook', 'Object');
        checkParamOrThrow(token, 'token', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${webhookId}`,
            json: true,
            method: 'PUT',
            body: webhook,
            qs: { token },
        })
            .then(pluckData)
            .then(parseDateFields);
    },

    /**
     * Deletes webhook.
     *
     * @memberof ApifyClient.webhooks
     * @instance
     * @param {Object} options
     * @param options.token
     * @param options.webhookId - Webhook ID
     * @param callback
     * @returns {}
     */
    deleteWebhook: (requestPromise, options) => {
        const { baseUrl, token, webhookId } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(webhookId, 'webhookId', 'String');
        checkParamOrThrow(token, 'token', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${webhookId}`,
            json: true,
            method: 'DELETE',
            qs: { token },
        })
            .then(parseDateFields);
    },

    /**
     * Gets list dispatches for webhook.
     * @description By default, the objects are sorted by the createdAt.
     * @memberof ApifyClient.webhooks
     * @instance
     * @param {Object} options
     * @param options.token
     * @param options.webhookId - Webhook ID
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Boolean} [options.desc] - If `true` then the objects are sorted by the createdAt field in descending order.
     * @param callback
     * @returns {PaginationList}
     */
    listDispatches: (requestPromise, options) => {
        const { baseUrl, token, webhookId, limit, offset, desc } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(webhookId, 'webhookId', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(limit, 'limit', 'Maybe Number');
        checkParamOrThrow(offset, 'offset', 'Maybe Number');
        checkParamOrThrow(desc, 'desc', 'Maybe Boolean');

        const query = { token };

        if (limit) query.limit = limit;
        if (offset) query.offset = offset;
        if (desc) query.desc = 1;

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${webhookId}/dispatches`,
            json: true,
            method: 'GET',
            qs: query,
        })
            .then(pluckData)
            .then(parseDateFields);
    },
};
