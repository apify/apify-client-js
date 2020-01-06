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
 * .then((webhooksList) => {
 *      // Do something with the list ...
 * })
 * .catch((err) => {
 *      // Do something with error ...
 * });
 *
 * // Callback
 * apifyClient.webhookDispatches.listWebhookDispatches({}, (err, webhooksList) => {
 *      // Do something with error or list ...
 * });
 * ```
 * @namespace webhookDispatches
 */

export default class WebhookDispatches {
    constructor(httpClient) {
        this.basePath = '/v2/webhook-dispatches';
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
     * Gets list of webhook dispatches.
     * @description By default, the objects are sorted by the startedAt field in ascending order,
     * therefore you can use pagination to incrementally fetch all dispatches.
     * To sort them in descending order, use desc: `true` parameter.
     * The endpoint supports pagination using limit and offset parameters and it will not return more than 1000 array elements.
     * @memberof ApifyClient.webhookDispatches
     * @instance
     * @param {Object} options
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Boolean} [options.desc] - If `true` then the objects are sorted by the startedAd field in descending order.
     * @returns {PaginationList}
     */
    async listDispatches(options) {
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
     * Gets webhook dispatch.
     * @memberof ApifyClient.webhookDispatches
     * @instance
     * @param {Object} options
     * @param options.webhookDispatchId - Webhook dispatch ID
     * @returns {WebhookDispatch}
     */
    async getDispatch(options) {
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
