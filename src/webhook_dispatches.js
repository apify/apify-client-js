import { catchNotFoundOrThrow, checkParamOrThrow, parseDateFields, pluckData } from './utils';


/**
 * Webhook dispatches
 * @memberOf ApifyClient
 * @description
 * ### Basic usage
 * TODO
 * ```
 * @namespace webhookDispatches
 */
export const BASE_PATH = '/v2/webhook-dispatches';


export default {
    /**
     * Get list of webhook dispatches.
     * @description TODO
     * @memberof ApifyClient.webhookDispatches
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Boolean} [options.desc] - If `true` then the objects are sorted by the createdAt field in descending order.
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
     * Get webhook dispatch.
     * @description TODO
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
