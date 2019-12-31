import log from 'apify-shared/log';
import _ from 'lodash';
import {
    checkParamOrThrow,
    pluckData,
    parseDateFields,
    catchNotFoundOrThrow,
    stringifyWebhooksToBase64,
    replaceSlashWithTilde,
} from './utils';

/**
 * Tasks
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
 *      const tasksList = await apifyClient.tasks.listTasks({});
 *      // Do something with the tasksList ...
 * } catch (err) {
 *      // Do something with error ...
 * }
 *
 * // Promise
 * apifyClient.tasks.listTasks({})
 * .then((tasksList) => {
 *      // Do something tasksList ...
 * })
 * .catch((err) => {
 *      // Do something with error ...
 * });
 *
 * // Callback
 * apifyClient.tasks.listTasks({}, (err, tasksList) => {
 *      // Do something with error or tasksList ...
 * });
 * ```
 * @namespace tasks
 */

export default class Tasks {
    constructor(httpClient) {
        this.basePath = '/v2/actor-tasks';
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
     * Gets list of your tasks.
     * @description By default, the objects are sorted by the createdAt field in ascending order,
     * therefore you can use pagination to incrementally fetch all tasks while new ones are still being created.
     * To sort them in descending order, use desc: `true` parameter.
     * The endpoint supports pagination using limit and offset parameters and it will not return more than 1000 array elements.
     * @memberof ApifyClient.tasks
     * @instance
     * @param {Object} options
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Boolean} [options.desc] - If `true` then the objects are sorted by the createdAt field in descending order.
     * @returns {Promise<PaginationList>}
     */
    async listTasks(options) {
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
     * Creates a new task.
     *
     * @memberof ApifyClient.tasks
     * @instance
     * @param {Object} options
     * @param {Object} options.task Object containing configuration of the task
     * @returns {Task}
     */
    async createTask(options) {
        const { task } = options;

        checkParamOrThrow(task, 'task', 'Object');

        const endpointOptions = {
            url: '',
            method: 'POST',
            body: task,
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * Updates task.
     *
     * @memberof ApifyClient.tasks
     * @instance
     * @param {Object} options
     * @param {String} options.taskId - Unique task ID
     * @param {Object} options.task
     * @param callback
     * @returns {Task}
     */
    async updateTask(options) {
        const { taskId, task } = options;
        checkParamOrThrow(task, 'task', 'Object');

        if (taskId) checkParamOrThrow(taskId, 'taskId', 'String');
        else checkParamOrThrow(task.id, 'task.id', 'String');

        const safeTaskId = replaceSlashWithTilde(!taskId && task.id ? task.id : taskId);

        const endpointOptions = {
            url: `/${safeTaskId}`,
            method: 'PUT',
            body: _.omit(task, 'id'),
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * Deletes task.
     *
     * @memberof ApifyClient.tasks
     * @instance
     * @param {Object} options
     * @param {String} options.taskId - Unique task ID
     */
    async deleteTask(options) {
        const { taskId } = options;

        checkParamOrThrow(taskId, 'taskId', 'String');

        const safeTaskId = replaceSlashWithTilde(taskId);

        const endpointOptions = {
            url: `/${safeTaskId}`,
            method: 'DELETE',
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(response);
    }

    /**
     * Gets task object.
     *
     * @memberof ApifyClient.tasks
     * @instance
     * @param {Object} options
     * @param {String} options.taskId - Unique task ID
     * @returns {Task}
     */
    async getTask(options) {
        const { taskId } = options;

        checkParamOrThrow(taskId, 'taskId', 'String');

        const safeTaskId = replaceSlashWithTilde(taskId);

        const endpointOptions = {
            url: `/${safeTaskId}`,
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
     * Gets list of task runs.
     *
     * By default, the objects are sorted by the startedAt field in ascending order,
     * therefore you can use pagination to incrementally fetch all builds while new ones are still being created.
     * To sort them in descending order, use desc: `true` parameter.
     *
     * The endpoint supports pagination using limit and offset parameters and it will not return more than 1000 array elements.
     *
     * @memberof ApifyClient.tasks
     * @instance
     * @param {Object} options
     * @param {String} options.taskId - Unique task ID
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Boolean} [options.desc] - If `true` then the objects are sorted by the createdAt field in descending order.
     * @returns {PaginationList}
     */
    async listRuns(options) {
        const { offset, limit, desc, taskId } = options;

        checkParamOrThrow(taskId, 'taskId', 'String');
        checkParamOrThrow(limit, 'limit', 'Maybe Number');
        checkParamOrThrow(offset, 'offset', 'Maybe Number');
        checkParamOrThrow(desc, 'desc', 'Maybe Boolean');

        const safeTaskId = replaceSlashWithTilde(taskId);
        const query = {};

        if (limit) query.limit = limit;
        if (offset) query.offset = offset;
        if (desc) query.desc = 1;

        const endpointOptions = {
            url: `/${safeTaskId}/runs`,
            method: 'GET',
            qs: query,
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * Runs the given task.
     *
     * @memberof ApifyClient.tasks
     * @instance
     * @param {Object} options
     * @param {String} options.taskId - Unique task ID
     * @param {Number} [options.waitForFinish] - Number of seconds to wait for task to finish. Maximum value is 120s.
                                                 If task doesn't finish in time then task run in RUNNING state is returned.
     * @param {Object} [options.input] - Actor task input object.
     * @param {Number} [options.timeout] - Timeout for the act run in seconds. Zero value means there is no timeout.
     * @param {Number} [options.memory] - Amount of memory allocated for the act run, in megabytes.
     * @param {String} [options.build] - Tag or number of the build to run (e.g. <code>latest</code> or <code>1.2.34</code>).
     * @param {Array}  [options.webhooks] - Specifies optional webhooks associated with the actor run,
     *                                      which can be used to receive a notification e.g. when the actor finished or failed,
     *                                      see {@link https://apify.com/docs/webhooks#adhoc|ad hook webhooks documentation} for detailed description.
     * @returns {ActRun}
     */
    async runTask(options) {
        // TODO: NOt finished.
        const { taskId, waitForFinish, body, contentType, timeout, memory, build, webhooks, input } = options;

        checkParamOrThrow(taskId, 'taskId', 'String');
        checkParamOrThrow(waitForFinish, 'waitForFinish', 'Maybe Number');
        checkParamOrThrow(timeout, 'timeout', 'Maybe Number');
        checkParamOrThrow(memory, 'memory', 'Maybe Number');
        checkParamOrThrow(build, 'build', 'Maybe String');
        checkParamOrThrow(webhooks, 'webhooks', 'Maybe Array');
        checkParamOrThrow(input, 'input', 'Maybe Object');

        const safeTaskId = replaceSlashWithTilde(taskId);
        const query = {};

        if (waitForFinish) query.waitForFinish = waitForFinish;
        if (timeout) query.timeout = timeout;
        if (memory) query.memory = memory;
        if (build) query.build = build;
        if (webhooks) query.webhooks = stringifyWebhooksToBase64(webhooks);

        const endpointOptions = {
            url: `${safeTaskId}/runs`,
            method: 'POST',
            qs: query,
        };

        // This is for backwards compatiblity.
        // TODO: Remove when releasing v1.0.
        if (body) {
            if (input) {
                throw new Error('You cannot use deprecated parameter "body" along with its replacement "input"!');
            }
            checkParamOrThrow(contentType, 'contentType', 'Maybe String');
            checkParamOrThrow(body, 'body', 'String');
            log.deprecated('Parameter "body" of client.tasks.runTask() method is depredated. Use "input" parameter instead.');
            endpointOptions.body = body;
            if (contentType) endpointOptions.headers = { 'Content-Type': contentType };
        }

        if (input) {
            endpointOptions.body = input;
            endpointOptions.json = true;
        }

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * Gets list of webhooks for given actor task.
     *
     * @memberof ApifyClient.acts
     * @instance
     * @param {Object} options
     * @param {String} options.taskId - Unique task ID
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Boolean} [options.desc] - If `true` then the objects are sorted by the createdAt field in descending order.
     * @returns {PaginationList}
     */
    async listWebhooks(options) {
        const { taskId } = options;
        const { offset, limit, desc } = options;

        checkParamOrThrow(taskId, 'taskId', 'String');
        checkParamOrThrow(limit, 'limit', 'Maybe Number');
        checkParamOrThrow(offset, 'offset', 'Maybe Number');
        checkParamOrThrow(desc, 'desc', 'Maybe Boolean');

        const safeTaskId = replaceSlashWithTilde(taskId);
        const query = {};

        if (limit) query.limit = limit;
        if (offset) query.offset = offset;
        if (desc) query.desc = 1;

        const endpointOptions = {
            url: `${safeTaskId}/webhooks`,
            method: 'GET',
            qs: query,
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * Gets the actor task input.
     *
     * @memberof ApifyClient.tasks
     * @instance
     * @param {Object} options
     * @param {String} options.taskId - Unique task ID
     * @returns {Object}
     */
    async getInput(options) {
        const { taskId } = options;

        checkParamOrThrow(taskId, 'taskId', 'String');

        const safeTaskId = replaceSlashWithTilde(taskId);

        const endpointOptions = {
            url: `/${safeTaskId}/input`,
            method: 'GET',
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * Updates the actor task input.
     *
     * @memberof ApifyClient.tasks
     * @instance
     * @param {Object} options
     * @param {String} options.taskId - Unique task ID
     * @param {Object} options.input - Input object.
     * @returns {Object}
     */
    async updateInput(options) {
        const { taskId, input } = options;

        checkParamOrThrow(taskId, 'taskId', 'String');
        checkParamOrThrow(input, 'input', 'Object');

        const safeTaskId = replaceSlashWithTilde(taskId);

        const endpointOptions = {
            url: `/${safeTaskId}/input`,
            method: 'PUT',
            body: input,
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }
}
