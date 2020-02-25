import omit from 'lodash/omit';
import {
    checkParamOrThrow,
    pluckData,
    parseDateFields,
    catchNotFoundOrThrow,
    stringifyWebhooksToBase64,
    replaceSlashWithTilde,
} from './utils';
import Resource from './resource';

/**
 * Tasks
 * @memberOf ApifyClient
 * @description
 * The API endpoints described in this section enables you to manage and run Apify actor tasks.
 * For more information, see the (Actor tasks documentation) [https://docs.apify.com/tasks].
 * Note that for all the API endpoints that accept the actorTaskId parameter to specify a task,
 * you can pass either the task ID
 * (e.g. HG7ML7M8z78YcAPEB) or a tilde-separated username of the task's owner and the task's name (e.g. johndoe~my-task).
 *
 * For more information see the [Task endpoint](https://docs.apify.com/api/v2#/reference/actor-tasks).
 *
 @namespace tasks
 */

export default class Tasks extends Resource {
    constructor(httpClient) {
        super(httpClient, '/v2/actor-tasks');
    }

    /**
     * Gets list of your tasks.
     * @description By default, the objects are sorted by the createdAt field in ascending order,
     * therefore you can use pagination to incrementally fetch all tasks while new ones are still being created.
     * To sort them in descending order, use desc: `true` parameter.
     * The endpoint supports pagination using limit and offset parameters and it will not return more than 1000 array elements.
     *
     * For more information see [get list of tasks endpoint](https://docs.apify.com/api/v2#/reference/actor-tasks/task-collection/get-list-of-tasks).
     *
     * @memberof ApifyClient.tasks
     * @instance
     * @param {Object} options
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Boolean} [options.desc] - If `true` then the objects are sorted by the createdAt field in descending order.
     * @returns {Promise<PaginationList>}
     */
    async listTasks(options = {}) {
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
     * Create a new task with settings specified by the object passed as `options.task`.
     * The response is the full task object as returned by the `client.tasks.createTask`.
     *
     * For more information see [create task endpoint](https://docs.apify.com/api/v2#/reference/actor-tasks/task-collection/create-task).
     *
     * @memberof ApifyClient.tasks
     * @instance
     * @param {Object} options
     * @param {Object} options.task Object containing configuration of the task
     * @returns {Task}
     */
    async createTask(options = {}) {
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
     * Update settings of a task using values specified by an object passed as `options.task`.
     * If the object does not define a specific property, its value is not updated.
     * Id of task to be updated can be passed as `options.taskId` or inside the `options.task` under the `id` key.
     *
     * The response is the full task object as returned by the`client.tasks.createTask`.
     *
     * For more information see [update task endpoint](https://docs.apify.com/api/v2#/reference/actor-tasks/task-object/update-task).
     *
     * @memberof ApifyClient.tasks
     * @instance
     * @param {Object} options
     * @param {String} options.taskId - Task ID or a slash-separated owner's username and task's name.
     * @param {Object} options.task
     * @param callback
     * @returns {Task}
     */
    async updateTask(options = {}) {
        const { taskId, task } = options;
        checkParamOrThrow(task, 'task', 'Object');

        if (taskId) checkParamOrThrow(taskId, 'taskId', 'String');
        else checkParamOrThrow(task.id, 'task.id', 'String');

        const safeTaskId = replaceSlashWithTilde(!taskId && task.id ? task.id : taskId);

        const endpointOptions = {
            url: `/${safeTaskId}`,
            method: 'PUT',
            body: omit(task, 'id'),
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * Delete the task specified through the `options.taskId` parameter.
     *
     * For more information see [delete task endpoint](https://docs.apify.com/api/v2#/reference/actor-tasks/task-object/delete-task).
     *
     * @memberof ApifyClient.tasks
     * @instance
     * @param {Object} options
     * @param {String} options.taskId - Task ID or a slash-separated owner's username and task's name.
     */
    async deleteTask(options = {}) {
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
     * Get an object that contains all the details about a task.
     *
     * For more information see [get task endpoint](https://docs.apify.com/api/v2#/reference/actor-tasks/task-object/get-task).
     *
     * @memberof ApifyClient.tasks
     * @instance
     * @param {Object} options
     * @param {String} options.taskId - Task ID or a slash-separated owner's username and task's name.
     * @returns {Task}
     */
    async getTask(options = {}) {
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
     * For more information see
     * [get list of task runs endpoint](https://docs.apify.com/api/v2#/reference/actor-tasks/run-collection/get-list-of-task-runs).
     *
     * @memberof ApifyClient.tasks
     * @instance
     * @param {Object} options
     * @param {String} options.taskId - Task ID or a slash-separated owner's username and task's name.
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Boolean} [options.desc] - If `true` then the objects are sorted by the createdAt field in descending order.
     * @returns {PaginationList}
     */
    async listRuns(options = {}) {
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
     * Runs an actor task and immediately returns without waiting for the run to finish.
     *
     * For more details see (run task endpoint)[https://docs.apify.com/api/v2#/reference/actor-tasks/run-collection/run-task]
     *
     * @memberof ApifyClient.tasks
     * @instance
     * @param {Object} options
     * @param {String} options.taskId - Task ID or a slash-separated owner's username and task's name.
     * @param {Number} [options.waitForFinish] - Number of seconds to wait for task to finish. Maximum value is 120s.
                                                 If task doesn't finish in time then task run in RUNNING state is returned.
     //TODO: In docs are 300s why the waitFor max value does respect same max
     * @param {Object} [options.input] - Actor task input object.
     * @param {Number} [options.timeout] - Timeout for the act run in seconds. Zero value means there is no timeout.
     * @param {Number} [options.memory] - Amount of memory allocated for the act run, in megabytes.
     * @param {String} [options.build] - Tag or number of the build to run (e.g. <code>latest</code> or <code>1.2.34</code>).
     * @param {Array}  [options.webhooks] - Specifies optional webhooks associated with the actor run,
     *                                      which can be used to receive a notification e.g. when the actor finished or failed,
     *                                      see {@link https://apify.com/docs/webhooks#adhoc|ad hook webhooks documentation} for detailed description.
     * @returns {ActRun}
     */
    async runTask(options = {}) {
        const { taskId, waitForFinish, timeout, memory, build, webhooks, input } = options;

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

        if (input) {
            endpointOptions.body = input;
            endpointOptions.json = true;
        }

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * Gets the list of webhooks of a specific actor task.
     * The response is a JSON with the list of objects where each object contains basic information about a single webhook.
     * The endpoint supports pagination using the limit and offset options and it will not return more than 1000 records.
     * By default, the records are sorted by the createdAt field in ascending order,
     * to sort the records in descending order, use the `desc: true` option.
     *
     *For more details see
     *  (get list of webhooks endpoint)[https://docs.apify.com/api/v2#/reference/actor-tasks/webhook-collection/get-list-of-webhooks]
     *
     * @memberof ApifyClient.acts
     * @instance
     * @param {Object} options
     * @param {String} options.taskId - Task ID or a slash-separated owner's username and task's name.
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Boolean} [options.desc] - If `true` then the objects are sorted by the createdAt field in descending order.
     * @returns {PaginationList}
     */
    async listWebhooks(options = {}) {
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
     * Returns the input of a given task.
     *
     * For more details see (get task input endpoint)[https://docs.apify.com/api/v2#/reference/actor-tasks/task-input-object/get-task-input]
     *
     * @memberof ApifyClient.tasks
     * @instance
     * @param {Object} options
     * @param {String} options.taskId - Task ID or a slash-separated owner's username and task's name.
     * @returns {Object}
     */
    async getInput(options = {}) {
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
     * Updates the input of a task using values specified by an object passed as `options.input`.
     * If the object does not define a specific property, its value is not updated.
     * The response is the full task input as returned by the `client.tasks.getTask`.
     *
     * For more details see (update task input endpoint)[https://docs.apify.com/api/v2#/reference/actor-tasks/task-input-object/update-task-input]
     *
     * @memberof ApifyClient.tasks
     * @instance
     * @param {Object} options
     * @param {String} options.taskId - Task ID or a slash-separated owner's username and task's name.
     * @param {Object} options.input - Input object.
     * @returns {Object}
     */
    async updateInput(options = {}) {
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
