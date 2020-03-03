import omit from 'lodash/omit';
import { checkParamOrThrow, pluckData, catchNotFoundOrThrow, parseDateFields } from './utils';
import Resource from './resource';

// 256s - we use more for queries pointing to DynamoDB as it may sometimes need more time to scale up.
export const REQUEST_ENDPOINTS_EXP_BACKOFF_MAX_REPEATS = 9;

/**
 * @typedef {Object} RequestOperationInfo
 * @property {Boolean} wasAlreadyPresent Indicates if request was already present in the queue.
 * @property {Boolean} wasAlreadyHandled Indicates if request was already marked as handled.
 * @property {String} requestId The ID of the added request
 */

/**
 * @typedef {Object} QueueHead
 * @property {Number} limit Maximum number of items to be returned.
 * @property {Date} queueModifiedAt Date of the last modification of the queue.
 * @property {Array} items Array of objects containing `id`, `url`, `method`, `uniqueKey` and `retryCount` attributes.
 */

/**
 * RequestQueues
 * @memberOf ApifyClient
 * @description
 * This section describes API endpoints to manage request queues.
 * Request queue is a storage for a queue of HTTP URLs to crawl,
 * which is typically used for deep crawling of websites where you start with several URLs and then recursively follow links to other pages.
 * The storage supports both breadth-first and depth-first crawling orders.
 * For more information, see the [Request queue documentation](https://docs.apify.com/storage/request-queue).
 *
 * Note that some of the endpoints do not require the authentication token, the calls are authenticated using the hard-to-guess ID of the queue.
 *
 * For more information see the [Request queues endpoint](https://docs.apify.com/api/v2#/reference/request-queues).
 *
 * @namespace requestQueues
 */

export default class RequestQueues extends Resource {
    constructor(httpClient) {
        super(
            httpClient,
            '/v2/request-queues',
            { expBackoffMaxRepeats: REQUEST_ENDPOINTS_EXP_BACKOFF_MAX_REPEATS,
            },
        );
        this.basePath = '/v2/request-queues';
        this.client = httpClient;
    }

    /**
     * Creates request queue of given name and returns it's object. If queue with given name already exists then returns it's object.
     *
     * For more information see
     * [get request queues endpoint](https://docs.apify.com/api/v2#/reference/request-queues/queue-collection/create-request-queue).
     *
     * @memberof ApifyClient.requestQueues
     * @param {Object} options
     * @param options.token
     * @param {String} options.queueName - Custom unique name to easily identify the queue in the future.
     * @returns {RequestQueue}
     */
    async getOrCreateQueue(options = {}) {
        const { queueName } = options;


        checkParamOrThrow(queueName, 'storeName', 'String');

        const qs = {
            name: queueName,
        };

        const endpointOptions = {
            url: '',
            method: 'POST',
            qs,
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * Gets list of request queues.
     *
     * By default, the objects are sorted by the createdAt field in ascending order,
     * therefore you can use pagination to incrementally fetch all queues while new ones are still being created.
     * To sort them in descending order, use desc: `true` parameter.
     * The endpoint supports pagination using limit and offset parameters and it will not return more than 1000 array elements.
     * For more information see
     * [get list of request queues endpoint](https://docs.apify.com/api/v2#/reference/request-queues/queue-collection/get-list-of-request-queues).
     *
     * @memberof ApifyClient.requestQueues
     * @param {Object} options
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Boolean} [options.desc] - If `true` then the objects are sorted by the startedAt field in descending order.
     * @param {Boolean} [options.unnamed] - If `true` then also unnamed stores will be returned. By default only named stores are returned.
     * @returns {PaginationList}
     */
    async listQueues(options = {}) {
        const { offset, limit, desc, unnamed } = options;

        checkParamOrThrow(limit, 'limit', 'Maybe Number');
        checkParamOrThrow(offset, 'offset', 'Maybe Number');
        checkParamOrThrow(desc, 'desc', 'Maybe Boolean');
        checkParamOrThrow(unnamed, 'unnamed', 'Maybe Boolean');

        const query = {};

        if (limit) query.limit = limit;
        if (offset) query.offset = offset;
        if (desc) query.desc = 1;
        if (unnamed) query.unnamed = 1;

        const endpointOptions = {
            url: '',
            method: 'GET',
            qs: query,
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * Returns queue object for given queue ID.
     *
     * For more information see [get request queue endpoint](https://docs.apify.com/api/v2#/reference/request-queues/queue/get-request-queue).
     *
     * @memberof ApifyClient.requestQueues
     * @param {Object} options
     * @param {String} options.queueId - Queue ID or username~queue-name.
     * @param {String} [options.token] - Your API token at apify.com. This parameter is required
     *                                   only when using "username~queue-name" format for queueId.
     * @returns {RequestQueue}
     */
    async getQueue(options = {}) {
        const { queueId } = options;

        checkParamOrThrow(queueId, 'queueId', 'String');

        const endpointOptions = {
            url: `/${queueId}`,
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
     * Updates request queue.
     *
     * @memberof ApifyClient.queues
     * @param {Object} options
     * @param options.token
     * @param {String} options.queueId - Queue ID or username~queue-name.
     * @param {Object} options.queue
     * @returns {RequestQueue}
     */
    async updateQueue(options = {}) {
        const { queueId, queue } = options;

        checkParamOrThrow(queueId, 'queueId', 'String');
        checkParamOrThrow(queue, 'queue', 'Object');

        const endpointOptions = {
            url: `/${queueId}`,
            method: 'PUT',
            qs: {},
            body: omit(queue, 'id'),
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * Deletes request queue.
     *
     * For more information see [delete request queue endpoint](https://docs.apify.com/api/v2#/reference/request-queues/queue/delete-request-queue).
     *
     * @memberof ApifyClient.requestQueues
     * @param {Object} options
     * @param {String} options.queueId - Queue ID or username~queue-name.
     * @param {String} [options.token] - Your API token at apify.com. This parameter is required
     *                                   only when using "username~queue-name" format for queueId.
     * @returns {*}
     */
    async deleteQueue(options = {}) {
        const { queueId } = options;

        checkParamOrThrow(queueId, 'queueId', 'String');

        const endpointOptions = {
            url: `/${queueId}`,
            method: 'DELETE',
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(response);
    }

    /**
     * Adds request to the queue.
     * Response contains ID of the request and info if request was already present in the queue or handled.
     *
     * If request with same uniqueKey was already present in the queue then returns an ID of existing request
     *
     * For more information see [add request endpoint](https://docs.apify.com/api/v2#/reference/request-queues/request-collection/add-request).
     *
     * @memberof ApifyClient.requestQueues
     * @param {Object} options
     * @param {String} options.queueId - Queue ID or username~queue-name.
     * @param {Object} options.request - Request object
     * @param {Boolean} [options.forefront] - If yes then request will be enqueued to the begining of the queue
     *                                        and to the end of the queue otherwise.
     * @param {String} [options.token] - Your API token at apify.com. This parameter is required
     *                                   only when using "username~queue-name" format for queueId.
     * @param {String} [options.clientKey] - Unique ID identifying client accessing the request queue.
     *                                      This ID is used to identify how many clients used the queue.
     *                                      This ID must be a string with length between 1 and 32 characters.
     * @returns {RequestOperationInfo}
     */
    async addRequest(options = {}) {
        const { queueId, request, forefront = false, clientKey } = options;

        checkParamOrThrow(queueId, 'queueId', 'String');
        checkParamOrThrow(request, 'request', 'Object');
        checkParamOrThrow(forefront, 'forefront', 'Boolean');
        checkParamOrThrow(clientKey, 'clientKey', 'Maybe String');

        const query = { forefront };
        if (clientKey) query.clientKey = clientKey;

        const endpointOptions = {
            url: `${queueId}/requests`,
            method: 'POST',
            body: request,
            qs: query,
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * Gets request from the queue.
     *
     * For more information see [get request endpoint](https://docs.apify.com/api/v2#/reference/request-queues/request/get-request).
     *
     * @memberof ApifyClient.requestQueues
     * @param {Object} options
     * @param {String} options.queueId - Queue ID or username~queue-name.
     * @param {String} options.requestId - Unique request ID
     * @param {String} [options.token] - Your API token at apify.com. This parameter is required
     *                                   only when using "username~queue-name" format for queueId.
     * @returns {Request}
     */
    async getRequest(options = {}) {
        const { queueId, requestId } = options;

        checkParamOrThrow(queueId, 'queueId', 'String');
        checkParamOrThrow(requestId, 'requestId', 'String');

        const endpointOptions = {
            url: `/${queueId}/requests/${requestId}`,
            method: 'GET',
            qs: {},

        };

        try {
            const response = await this._call(options, endpointOptions);
            return parseDateFields(pluckData(response));
        } catch (err) {
            return catchNotFoundOrThrow(err);
        }
    }

    /**
     * Deletes request from queue.
     *
     * For more information see [delete request endpoint](https://docs.apify.com/api/v2#/reference/request-queues/request/delete-request).
     *
     * @memberof ApifyClient.requestQueues
     * @param {Object} options
     * @param {String} options.queueId - Queue ID or username~queue-name.
     * @param {String} options.requestId - Unique request ID
     * @param {String} [options.token] - Your API token at apify.com. This parameter is required
     *                                   only when using "username~queue-name" format for queueId.
     * @param {String} [options.clientKey] - Unique ID identifying client accessing the request queue.
     *                                      This ID is used to identify how many clients used the queue.
     *                                      This ID must be a string with length between 1 and 32 characters.
     * @returns {*}
     */
    async deleteRequest(options = {}) {
        const { queueId, requestId, clientKey } = options;

        checkParamOrThrow(queueId, 'queueId', 'String');
        checkParamOrThrow(requestId, 'requestId', 'String');
        checkParamOrThrow(clientKey, 'clientKey', 'Maybe String');

        const query = { };
        if (clientKey) query.clientKey = clientKey;

        const endpointOptions = {
            url: `/${queueId}/requests/${requestId}`,
            method: 'DELETE',
            qs: query,

        };
        const response = await this._call(options, endpointOptions);
        return parseDateFields(response);
    }

    /**
     * Updates request in queue.
     * Mark request as handled by setting request.handledAt = new Date().
     * If handledAt is set then request will be removed from head of the queue.
     *
     * For more information see [delete request endpoint](https://docs.apify.com/api/v2#/reference/request-queues/request/update-request).
     *
     * @memberof ApifyClient.requestQueues
     * @param {Object} options
     * @param {String} options.queueId - Queue ID or username~queue-name.
     * @param {Object} options.request - Request object
     * @param {String} [options.requestId] - Unique request ID
     * @param {Boolean} [options.forefront] - If yes then request will be enqueued to the begining of the queue
     *                                        and to the end of the queue otherwise.
     * @param {String} [options.token] - Your API token at apify.com. This parameter is required
     *                                   only when using "username~queue-name" format for queueId.
     * @param {String} [options.clientKey] - Unique ID identifying client accessing the request queue.
     *                                      This ID is used to identify how many clients used the queue.
     *                                      This ID must be a string with length between 1 and 32 characters.
     * @returns {RequestOperationInfo}
     */
    async updateRequest(options = {}) {
        const { queueId, requestId, request, forefront = false, clientKey } = options;

        checkParamOrThrow(request, 'request', 'Object');

        const safeRequestId = requestId || request.id;

        checkParamOrThrow(queueId, 'queueId', 'String');
        checkParamOrThrow(safeRequestId, 'requestId', 'String');
        checkParamOrThrow(forefront, 'forefront', 'Boolean');
        checkParamOrThrow(clientKey, 'clientKey', 'Maybe String');

        const query = { forefront };
        if (clientKey) query.clientKey = clientKey;

        const endpointOptions = {
            url: `/${queueId}/requests/${safeRequestId}`,
            method: 'PUT',
            body: request,
            qs: query,
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * Returns given number of the first unhandled requests in he queue.
     * Returns given number of first requests from the queue.
     * The response contains the hadMultipleClients boolean field which indicates that
     * the queue was accessed by more than one client (with unique or empty clientKey).
     *
     * For more information see [get head](https://docs.apify.com/api/v2#/reference/request-queues/queue-head/get-head).
     *
     * @memberof ApifyClient.requestQueues
     * @param {Object} options
     * @param {String} options.queueId - Queue ID or username~queue-name.
     * @param {Number} options.limit - Maximum number of the items to be returned.
     * @param {String} [options.token] - Your API token at apify.com. This parameter is required
     *                                   only when using "username~queue-name" format for queueId.
     * @param {String} [options.clientKey] - Unique ID identifying client accessing the request queue.
     *                                      This ID is used to identify how many clients used the queue.
     *                                      This ID must be a string with length between 1 and 32 characters.
     * @returns {QueueHead}
     */
    async getHead(options = {}) {
        const { queueId, limit, clientKey } = options;

        checkParamOrThrow(queueId, 'queueId', 'String');
        checkParamOrThrow(limit, 'limit', 'Number');
        checkParamOrThrow(clientKey, 'clientKey', 'Maybe String');

        const query = {};
        if (limit) query.limit = limit;
        if (clientKey) query.clientKey = clientKey;

        const endpointOptions = {
            url: `/${queueId}/head`,
            method: 'GET',
            qs: query,
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }
}
