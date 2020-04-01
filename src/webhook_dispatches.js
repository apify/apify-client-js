const { catchNotFoundOrThrow, checkParamOrThrow, parseDateFields, pluckData } = require('./utils');
const Resource = require('./resource');

/**
 * Webhook dispatches
 * @memberOf ApifyClient
 * @description
 *
 * This class handles API endpoints to get webhook dispatches.
 *
 * For more information see the [Webhook dispatches endpoint](https://docs.apify.com/api/v2#/reference/webhook-dispatches).
 *
 * @namespace webhookDispatches
 */

class WebhookDispatches extends Resource {
    constructor(httpClient) {
        super(httpClient, '/v2/webhook-dispatches');
    }

    /**
     * Gets the list of webhook dispatches that the user have.
     *
     * @description By default, the objects are sorted by the startedAt field in ascending order,
     * therefore you can use pagination to incrementally fetch all dispatches.
     * To sort them in descending order, use desc: `true` parameter.
     * The endpoint supports pagination using limit and offset parameters and it will not return more than 1000 array elements.
     *
     * For more information see the
     * [get list of webhook dispatches endpoint]
     * (https://docs.apify.com/api/v2#/reference/webhook-dispatches/webhook-dispatches-collection/get-list-of-webhook-dispatches).
     *
     * @memberof ApifyClient.webhookDispatches
     * @param {Object} options
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Boolean} [options.desc] - If `true` then the objects are sorted by the startedAd field in descending order.
     * @returns {PaginationList}
     */
    async listDispatches(options = {}) {
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
     * Gets webhook dispatch object with all details.
     *
     * For more information see the
     * [get webhook dispatch endpoint](https://docs.apify.com/api/v2#/reference/webhook-dispatches/webhook-dispatch-object/get-webhook-dispatch).
     *
     * @memberof ApifyClient.webhookDispatches
     * @param {Object} options
     * @param options.webhookDispatchId - Webhook dispatch ID
     * @returns {WebhookDispatch}
     */
    async getDispatch(options = {}) {
        const { webhookDispatchId } = options;

        checkParamOrThrow(webhookDispatchId, 'webhookDispatchId', 'String');

        const endpointOptions = {
            url: `/${webhookDispatchId}`,
            method: 'GET',
        };

        try {
            const response = await this._call(options, endpointOptions);
            return parseDateFields(pluckData(response));
        } catch (err) {
            return catchNotFoundOrThrow(err);
        }
    }
}

module.exports = WebhookDispatches;
