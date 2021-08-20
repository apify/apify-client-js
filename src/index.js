const ow = require('ow').default;
const { ME_USER_NAME_PLACEHOLDER } = require('@apify/consts');
const { default: logger } = require('@apify/log');

const HttpClient = require('./http_client');
const { Statistics } = require('./statistics');

const { ActorClient } = require('./resource_clients/actor');
const { ActorCollectionClient } = require('./resource_clients/actor_collection');
const { BuildClient } = require('./resource_clients/build');
// const { BuildCollectionClient } = require('./resource_clients/build_collection');
const DatasetClient = require('./resource_clients/dataset');
const DatasetCollectionClient = require('./resource_clients/dataset_collection');
const { KeyValueStoreClient } = require('./resource_clients/key_value_store');
const { KeyValueStoreCollectionClient } = require('./resource_clients/key_value_store_collection');
const LogClient = require('./resource_clients/log');
const RequestQueueClient = require('./resource_clients/request_queue');
const RequestQueueCollectionClient = require('./resource_clients/request_queue_collection');
const RunClient = require('./resource_clients/run');
// const RunCollectionClient = require('./resource_clients/run_collection');
const ScheduleClient = require('./resource_clients/schedule');
const ScheduleCollectionClient = require('./resource_clients/schedule_collection');
const TaskClient = require('./resource_clients/task');
const TaskCollectionClient = require('./resource_clients/task_collection');
const { UserClient } = require('./resource_clients/user');
const WebhookClient = require('./resource_clients/webhook');
const WebhookCollectionClient = require('./resource_clients/webhook_collection');
const WebhookDispatchClient = require('./resource_clients/webhook_dispatch');
const WebhookDispatchCollectionClient = require('./resource_clients/webhook_dispatch_collection');

/**
 * ApifyClient is the official library to access [Apify API](https://docs.apify.com/api/v2) from your
 * JavaScript applications. It runs both in Node.js and browser.
 *
 * @param {object} [options]
 * @param {string} [options.baseUrl=https://api.apify.com]
 * @param {number} [options.maxRetries=8]
 * @param {number} [options.minDelayBetweenRetriesMillis=500]
 * @param {function[]} [options.requestInterceptors]
 * @param {number} [options.timeoutSecs]
 * @param {string} [options.token]
 */
class ApifyClient {
    constructor(options = {}) {
        ow(options, ow.object.exactShape({
            baseUrl: ow.optional.string,
            maxRetries: ow.optional.number,
            minDelayBetweenRetriesMillis: ow.optional.number,
            requestInterceptors: ow.optional.array,
            timeoutSecs: ow.optional.number,
            token: ow.optional.string,
        }));

        const {
            baseUrl = 'https://api.apify.com',
            maxRetries = 8,
            minDelayBetweenRetriesMillis = 500,
            requestInterceptors = [],
            timeoutSecs = 360,
            token,
        } = options;

        const tempBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, baseUrl.length - 1) : baseUrl;
        this.baseUrl = `${tempBaseUrl}/v2`;
        this.token = token;
        this.stats = new Statistics();
        this.logger = logger.child({ prefix: 'ApifyClient' });
        this.httpClient = new HttpClient({
            apifyClientStats: this.stats,
            maxRetries,
            minDelayBetweenRetriesMillis,
            requestInterceptors,
            timeoutSecs,
            logger: this.logger,
        });
    }

    /**
     * @return {{httpClient: HttpClient, apifyClient: ApifyClient, baseUrl: string, params: {token: string}}}
     * @private
     */
    _options() {
        return {
            baseUrl: this.baseUrl,
            apifyClient: this,
            httpClient: this.httpClient,
            params: {
                token: this.token,
            },
        };
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/actor-collection
     * @return {ActorCollectionClient}
     */
    actors() {
        return new ActorCollectionClient(this._options());
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/actor-object
     * @param {string} id
     * @return {ActorClient}
     */
    actor(id) {
        ow(id, ow.string.nonEmpty);
        return new ActorClient({
            id,
            ...this._options(),
        });
    }

    // TODO we don't have this endpoint yet
    // /**
    //  * @return {BuildCollectionClient}
    //  */
    // builds() {
    //     return new BuildCollectionClient(this._options());
    // }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-builds/build-object
     * @param {string} id
     * @return {BuildClient}
     */
    build(id) {
        ow(id, ow.string.nonEmpty);
        return new BuildClient({
            id,
            ...this._options(),
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/datasets/dataset-collection
     * @return {DatasetCollectionClient}
     */
    datasets() {
        return new DatasetCollectionClient(this._options());
    }

    /**
     * https://docs.apify.com/api/v2#/reference/datasets/dataset
     * @param {string} id
     * @return {DatasetClient}
     */
    dataset(id) {
        ow(id, ow.string.nonEmpty);
        return new DatasetClient({
            id,
            ...this._options(),
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/key-value-stores/store-collection
     * @return {KeyValueStoreCollectionClient}
     */
    keyValueStores() {
        return new KeyValueStoreCollectionClient(this._options());
    }

    /**
     * https://docs.apify.com/api/v2#/reference/key-value-stores/store-object
     * @param {string} id
     * @return {KeyValueStoreClient}
     */
    keyValueStore(id) {
        ow(id, ow.string.nonEmpty);
        return new KeyValueStoreClient({
            id,
            ...this._options(),
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/logs
     * @param {string} buildOrRunId
     * @return {LogClient}
     */
    log(buildOrRunId) {
        ow(buildOrRunId, ow.string.nonEmpty);
        return new LogClient({
            id: buildOrRunId,
            ...this._options(),
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/request-queues/queue-collection
     * @return {RequestQueueCollection}
     */
    requestQueues() {
        return new RequestQueueCollectionClient(this._options());
    }

    /**
     * https://docs.apify.com/api/v2#/reference/request-queues/queue
     * @param {string} id
     * @param {object} [options]
     * @param {object} [options.clientKey]
     * @return {RequestQueueClient}
     */
    requestQueue(id, options = {}) {
        ow(id, ow.string.nonEmpty);
        ow(options, ow.object.exactShape({
            clientKey: ow.optional.string.nonEmpty,
        }));
        const apiClientOptions = {
            id,
            ...this._options(),
        };
        return new RequestQueueClient(apiClientOptions, options);
    }

    // TODO we don't have this endpoint yet
    // /**
    //  * @return {RunCollectionClient}
    //  */
    // runs() {
    //     return new RunCollectionClient(this._options());
    // }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-runs/run-object-and-its-storages
     * @param {string} id
     * @return {RunClient}
     */
    run(id) {
        ow(id, ow.string.nonEmpty);
        return new RunClient({
            id,
            ...this._options(),
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-tasks/task-collection
     * @return {TaskCollectionClient}
     */
    tasks() {
        return new TaskCollectionClient(this._options());
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-tasks/task-object
     * @param {string} id
     * @return {TaskClient}
     */
    task(id) {
        ow(id, ow.string.nonEmpty);
        return new TaskClient({
            id,
            ...this._options(),
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/schedules/schedules-collection
     * @return {ScheduleCollectionClient}
     */
    schedules() {
        return new ScheduleCollectionClient(this._options());
    }

    /**
     * https://docs.apify.com/api/v2#/reference/schedules/schedule-object
     * @param {string} id
     * @return {ScheduleClient}
     */
    schedule(id) {
        ow(id, ow.string.nonEmpty);
        return new ScheduleClient({
            id,
            ...this._options(),
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/users
     * @param {string} id
     * @return {UserClient}
     */
    user(id = ME_USER_NAME_PLACEHOLDER) {
        ow(id, ow.string.nonEmpty);
        return new UserClient({
            id,
            ...this._options(),
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/webhooks/webhook-collection
     * @return {WebhookCollectionClient}
     */
    webhooks() {
        return new WebhookCollectionClient(this._options());
    }

    /**
     * https://docs.apify.com/api/v2#/reference/webhooks/webhook-object
     * @param {string} id
     * @return {WebhookClient}
     */
    webhook(id) {
        ow(id, ow.string.nonEmpty);
        return new WebhookClient({
            id,
            ...this._options(),
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/webhook-dispatches
     * @return {WebhookDispatchCollectionClient}
     */
    webhookDispatches() {
        return new WebhookDispatchCollectionClient(this._options());
    }

    /**
     * https://docs.apify.com/api/v2#/reference/webhook-dispatches/webhook-dispatch-object
     * @param {string} id
     * @return {WebhookDispatchClient}
     */
    webhookDispatch(id) {
        ow(id, ow.string.nonEmpty);
        return new WebhookDispatchClient({
            id,
            ...this._options(),
        });
    }
}

module.exports = ApifyClient;
