import { checkParamOrThrow, pluckData, catchNotFoundOrThrow } from './utils';

/**
 * @typedef {Object} RequestOperationInfo
 * @property {Boolean} wasAlreadyPresent Indicates if request was already present in the queue.
 * @property {Boolean} wasAlreadyHandled Indicates if request was already marked as handled.
 * @property {String} requestId The ID of the added request
 */

/**
 * @typedef {Object} QueueHead
 * @property {Number} limit Maximum number of items to be returned.
 * @property {Array} items
 */

/**
 * @ignore
 *
 * RequestQueues
 * @memberOf ApifyClient
 * @description
 * ### Basic usage
 * ```javascript
 * const ApifyClient = require('apify-client');
 *
 * const apifyClient = new ApifyClient({
 *        userId: 'RWnGtczasdwP63Mak',
 *        token: 'f5J7XsdaKDyRywwuGGo9',
 * });
 * const requestQueues = apifyClient.requestQueues;
 *
 * // Get request queue with name 'my-queue' and set it as default
 * // to be used in following commands.
 * const queue = await requestQueues.getOrCreateQueue({
 *     queueName: 'my-queue',
 * });
 * apifyClient.setOptions({ queueId: queue.id });
 *
 * // Add requests to queue.
 * await requestQueues.addRequest({ url: 'http://example.com', uniqueKey: 'http://example.com' });
 * await requestQueues.addRequest({ url: 'http://example.com/a/b', uniqueKey: 'http://example.com/a/b' });
 *
 * // Fetch unhandled requets from queue.
 * const [request1, request2] = await requestQueues.queryQueueHead();
 *
 * // Mark request as handled.
 * request1.handledAt = new Date();
 * await requestQueues.updateRequest(request1);
 * ```
 *
 * Every method can be used as either promise or with callback. If your Node version supports await/async then you can await promise result.
 * ```javascript
 * // Awaited promise
 * try {
 *      const queue = await requestQueues.getQueue(queueId);
 *      // Do something with the queue ...
 * } catch (err) {
 *      // Do something with error ...
 * }
 *
 * // Promise
 * requestQueues.getQueue(queueId)
 * .then((queue) => {
 *      // Do something with queue ...
 * })
 * .catch((err) => {
 *      // Do something with error ...
 * });
 *
 * // Callback
 * requestQueues.getQueue(queueId, (err, queue) => {
 *      // Do something with error or queue ...
 * });
 * ```
 * @namespace requestQueues
 */

export const BASE_PATH = '/v2/request-queues';

export default {
    /**
     * Creates request queue of given name and returns it's object. If queue with given name already exists then returns it's object.
     *
     * @memberof ApifyClient.requestQueues
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.queueName - Custom unique name to easily identify the queue in the future.
     * @param callback
     * @returns {RequestQueue}
     */
    getOrCreateQueue: (requestPromise, options) => {
        const { baseUrl, token, queueName } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(queueName, 'queueName', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}`,
            json: true,
            method: 'POST',
            qs: { name: queueName, token },
        })
            .then(pluckData);
    },

    /**
     * Gets list of request queues.
     *
     * By default, the objects are sorted by the createdAt field in ascending order,
     * therefore you can use pagination to incrementally fetch all queues while new ones are still being created.
     * To sort them in descending order, use desc: 1 parameter.
     * The endpoint supports pagination using limit and offset parameters and it will not return more than 1000 array elements.
     *
     * @memberof ApifyClient.requestQueues
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Number} [options.desc] - If 1 then the objects are sorted by the startedAt field in descending order.
     * @param callback
     * @returns {PaginationList}
     */
    listQueues: (requestPromise, options) => {
        const { baseUrl, token, offset, limit, desc, unnamed } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(limit, 'limit', 'Maybe Number');
        checkParamOrThrow(offset, 'offset', 'Maybe Number');
        checkParamOrThrow(desc, 'desc', 'Maybe Boolean');
        checkParamOrThrow(unnamed, 'unnamed', 'Maybe Boolean');

        const query = { token };

        if (limit) query.limit = limit;
        if (offset) query.offset = offset;
        if (desc) query.desc = 1;
        if (unnamed) query.unnamed = 1;

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}`,
            json: true,
            method: 'GET',
            qs: query,
        })
            .then(pluckData);
    },

    /**
     * Gets request queue.
     *
     * @memberof ApifyClient.requestQueues
     * @instance
     * @param {Object} options
     * @param {String} options.queueId - Unique queue ID
     * @param callback
     * @returns {RequestQueue}
     */
    getQueue: (requestPromise, options) => {
        const { baseUrl, queueId } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(queueId, 'queueId', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${queueId}`,
            json: true,
            method: 'GET',
        })
            .then(pluckData)
            .catch(catchNotFoundOrThrow);
    },

    /**
     * Deletes request queue.
     *
     * @memberof ApifyClient.requestQueues
     * @instance
     * @param {Object} options
     * @param {String} options.queueId - Unique queue ID
     * @param callback
     * @returns {*}
     */
    deleteQueue: (requestPromise, options) => {
        const { baseUrl, queueId } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(queueId, 'queueId', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${queueId}`,
            json: true,
            method: 'DELETE',
        });
    },

    /**
     * Adds request to the queue.
     * If request is already in the queue then returns info about existing request.
     *
     * @memberof ApifyClient.requestQueues
     * @instance
     * @param {Object} options
     * @param {String} options.queueId - Unique queue ID
     * @param {Object} options.request - Request object
     * @param {Object} [options.forefront] - If yes then request will be enqueued to the begining of the queue
     *                                        and to the end of the queue otherwise.
     * @param callback
     * @returns {RequestOperationInfo}
     */
    addRequest: (requestPromise, options) => {
        const { baseUrl, queueId, request, forefront = false } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(queueId, 'queueId', 'String');
        checkParamOrThrow(request, 'request', 'Object');
        checkParamOrThrow(forefront, 'forefront', 'Boolean');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${queueId}/requests`,
            json: true,
            method: 'POST',
            body: request,
            qs: { forefront },
        })
            .then(pluckData);
    },

    /**
     * Gets request from the queue.
     *
     * @memberof ApifyClient.requestQueues
     * @instance
     * @param {Object} options
     * @param {String} options.queueId - Unique queue ID
     * @param {String} options.requestId - Unique request ID
     * @param callback
     * @returns {Request}
     */
    getRequest: (requestPromise, options) => {
        const { baseUrl, queueId, requestId } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(queueId, 'queueId', 'String');
        checkParamOrThrow(requestId, 'requestId', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${queueId}/requests/${requestId}`,
            json: true,
            method: 'GET',
        })
            .then(pluckData)
            .catch(catchNotFoundOrThrow);
    },

    /**
     * Deletes request from queue.
     *
     * @memberof ApifyClient.requestQueues
     * @instance
     * @param {Object} options
     * @param {String} options.queueId - Unique queue ID
     * @param {String} options.requestId - Unique request ID
     * @param callback
     * @returns {*}
     */
    deleteRequest: (requestPromise, options) => {
        const { baseUrl, queueId, requestId } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(queueId, 'queueId', 'String');
        checkParamOrThrow(requestId, 'requestId', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${queueId}/requests/${requestId}`,
            json: true,
            method: 'DELETE',
        });
    },

    /**
     * Updates request in the queue.
     *
     * @memberof ApifyClient.requestQueues
     * @instance
     * @param {Object} options
     * @param {String} options.queueId - Unique queue ID
     * @param {Object} options.request - Request object
     * @param {String} [options.requestId] - Unique request ID
     * @param {Object} [options.forefront] - If yes then request will be enqueued to the begining of the queue
     *                                        and to the end of the queue otherwise.
     * @param callback
     * @returns {RequestOperationInfo}
     */
    updateRequest: (requestPromise, options) => {
        const { baseUrl, queueId, requestId, request, forefront = false } = options;

        checkParamOrThrow(request, 'request', 'Object');

        const safeRequestId = requestId || request.id;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(queueId, 'queueId', 'String');
        checkParamOrThrow(safeRequestId, 'requestId', 'String');
        checkParamOrThrow(forefront, 'forefront', 'Boolean');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${queueId}/requests/${safeRequestId}`,
            json: true,
            method: 'PUT',
            body: request,
            qs: { forefront },
        })
            .then(pluckData);
    },

    /**
     * Returns given number of the first unhandled requests in he queue.
     *
     * @memberof ApifyClient.requestQueues
     * @instance
     * @param {Object} options
     * @param {String} options.queueId - Unique queue ID
     * @param {Number} options.limit - Maximum number of the items to be returned.
     * @param callback
     * @returns {QueueHead}
     */
    getHead: (requestPromise, options) => {
        const { baseUrl, queueId, limit } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(queueId, 'queueId', 'String');
        checkParamOrThrow(limit, 'limit', 'Number');

        const query = {};
        if (limit) query.limit = limit;

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${queueId}/head`,
            json: true,
            method: 'GET',
            qs: query,
        })
            .then(pluckData);
    },
};
