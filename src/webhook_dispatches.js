import { catchNotFoundOrThrow, checkParamOrThrow, parseDateFields, pluckData } from './utils';


/**
 * Webhook dispatches
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
 *      const dispatchesList = await apifyClient.webhookDispatches.listWebhookDispatches({});
 *      // Do something with the list ...
 * } catch (err) {
 *      // Do something with error ...
 * }
 *
 * // Promise
 * apifyClient.webhookDispatches.listWebhookDispatches({})
 * .then((tasksList) => {
 *      // Do something with the list ...
 * })
 * .catch((err) => {
 *      // Do something with error ...
 * });
 *
 * // Callback
 * apifyClient.webhookDispatches.listWebhookDispatches({}, (err, tasksList) => {
 *      // Do something with error or list ...
 * });
 * ```
 * @namespace webhookDispatches
 */
export const BASE_PATH = '/v2/webhook-dispatches';


export default {
    /**
     * Gets list of webhook dispatches.
     * @description By default, the objects are sorted by the startedAt field in ascending order,
     * therefore you can use pagination to incrementally fetch all dispatches.
     * To sort them in descending order, use desc: `true` parameter.
     * The endpoint supports pagination using limit and offset parameters and it will not return more than 1000 array elements.
     * @memberof ApifyClient.webhookDispatches
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Boolean} [options.desc] - If `true` then the objects are sorted by the startedAd field in descending order.
     * @param callback
     * @returns {PaginationList}
     */
    listWebhookDispatches: (requestPromise, options) => {
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
     * Gets webhook dispatch.
     * @memberof ApifyClient.webhookDispatches
     * @instance
     * @param {Object} options
     * @param options.token
     * @param option.webhookDispatchId - Webhook dispatch ID
     * @param callback
     * @returns {WebhookDispatch}
     */
    getWebhookDispatch: (requestPromise, options) => {
        const { baseUrl, token, webhookDispatchId } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(webhookDispatchId, 'webhookDispatchId', 'String');
        checkParamOrThrow(token, 'token', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${webhookDispatchId}`,
            json: true,
            method: 'GET',
            qs: { token },
        })
            .then(pluckData)
            .then(parseDateFields)
            .catch(catchNotFoundOrThrow);
    },
};
