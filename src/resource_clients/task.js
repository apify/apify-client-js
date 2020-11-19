const ow = require('ow');
const { ACT_JOB_STATUSES } = require('apify-shared/consts');
const ResourceClient = require('../base/resource_client');
const RunCollectionClient = require('./run_collection');
const WebhookCollectionClient = require('./webhook_collection');
const RunClient = require('./run');
const {
    pluckData,
    parseDateFields,
    catchNotFoundOrThrow,
    stringifyWebhooksToBase64,
} = require('../utils');

class TaskClient extends ResourceClient {
    /**
     * @param {ApiClientOptions} options
     */
    constructor(options) {
        super({
            resourcePath: 'actor-tasks',
            ...options,
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-tasks/task-object/get-task
     * @return {Promise<?Task>}
     */
    async get() {
        return this._get();
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-tasks/task-object/update-task
     * @param {object} newFields
     * @return {Promise<Task>}
     */
    async update(newFields) {
        ow(newFields, ow.object);
        return this._update(newFields);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-tasks/task-object/delete-task
     * @return {Promise<void>}
     */
    async delete() {
        return this._delete();
    }

    /**
     * Starts a task and immediately returns the Run object.
     * https://docs.apify.com/api/v2#/reference/actor-tasks/run-collection/run-task
     * @param {object} [input]
     * @param {object} [options]
     * @param {string} [options.build]
     * @param {number} [options.memory]
     * @param {number} [options.timeout]
     * @param {object[]} [options.webhooks]
     * @return {Promise<Run>}
     */
    async start(input, options = {}) {
        ow(input, ow.optional.object);
        ow(options, ow.object.exactShape({
            build: ow.optional.string,
            memory: ow.optional.number,
            timeout: ow.optional.number,
            waitForFinish: ow.optional.number,
            webhooks: ow.optional.array.ofType(ow.object),
        }));

        const { waitForFinish, timeout, memory, build } = options;

        const params = {
            waitForFinish,
            timeout,
            memory,
            build,
            webhooks: stringifyWebhooksToBase64(options.webhooks),
        };

        const request = {
            url: this._url('runs'),
            method: 'POST',
            data: input,
            params: this._params(params),
        };

        const response = await this.httpClient.call(request);
        return parseDateFields(pluckData(response.data));
    }

    /**
     * Starts a task and waits for it to finish before returning the Run object.
     * It waits indefinitely, unless the `waitSecs` option is provided.
     * https://docs.apify.com/api/v2#/reference/actor-tasks/run-collection/run-task
     * @param {object} [input]
     * @param {object} [options]
     * @param {string} [options.build]
     * @param {number} [options.memory]
     * @param {number} [options.timeout]
     * @param {number} [options.waitSecs]
     * @param {object[]} [options.webhooks]
     * @return {Promise<Run>}
     */
    async call(input, options = {}) {
        ow(input, ow.optional.object);
        ow(options, ow.object.exactShape({
            build: ow.optional.string,
            memory: ow.optional.number,
            timeout: ow.optional.number.not.negative,
            waitSecs: ow.optional.number.not.negative,
            webhooks: ow.optional.array.ofType(ow.object),
        }));

        const { waitSecs, ...startOptions } = options;

        const { id, actId } = await this.start(input, startOptions);

        return this.apifyClient.run(id, actId).waitForFinish({ waitSecs });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-tasks/task-input-object/get-task-input
     * @return {Promise<?object>}
     */
    async getInput() {
        const requestOpts = {
            url: this._url('input'),
            method: 'GET',
            params: this._params(),
        };
        try {
            const response = await this.httpClient.call(requestOpts);
            return response.data;
        } catch (err) {
            return catchNotFoundOrThrow(err);
        }
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-tasks/task-input-object/update-task-input
     * @return {Promise<object>}
     */
    async updateInput(newFields) {
        const response = await this.httpClient.call({
            url: this._url('input'),
            method: 'PUT',
            params: this._params(),
            data: newFields,
        });
        return response.data;
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-tasks/last-run-object-and-its-storages
     * @param {object} options
     * @param {string} options.status
     * @return {RunClient}
     */
    lastRun(options = {}) {
        ow(options, ow.object.exactShape({
            status: ow.optional.string.oneOf(Object.values(ACT_JOB_STATUSES)),
        }));

        return new RunClient(this._subResourceOptions({
            id: 'last',
            params: this._params(options),
        }));
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-tasks/run-collection
     * @return {RunCollectionClient}
     */
    runs() {
        return new RunCollectionClient(this._subResourceOptions());
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-tasks/webhook-collection
     * @return {WebhookCollectionClient}
     */
    webhooks() {
        return new WebhookCollectionClient(this._subResourceOptions());
    }
}

module.exports = TaskClient;
