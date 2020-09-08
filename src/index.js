const ow = require('ow');
const { ME_USER_NAME_PLACEHOLDER } = require('apify-shared/consts');

const ActorClient = require('./resource_clients/actor');
const ActorCollectionClient = require('./resource_clients/actor_collection');
const BuildClient = require('./resource_clients/build');
// const BuildCollectionClient = require('./resource_clients/build_collection');
const DatasetClient = require('./resource_clients/dataset');
const DatasetCollectionClient = require('./resource_clients/dataset_collection');
const KeyValueStoreClient = require('./resource_clients/key_value_store');
const KeyValueStoreCollectionClient = require('./resource_clients/key_value_store_collection');
const LogClient = require('./resource_clients/log');
const RequestQueueClient = require('./resource_clients/request_queue');
const RequestQueueCollectionClient = require('./resource_clients/request_queue_collection');
const RunClient = require('./resource_clients/run');
// const RunCollectionClient = require('./resource_clients/run_collection');
const ScheduleClient = require('./resource_clients/schedule');
const ScheduleCollectionClient = require('./resource_clients/schedule_collection');
const TaskClient = require('./resource_clients/task');
const TaskCollectionClient = require('./resource_clients/task_collection');
const UserClient = require('./resource_clients/user');
const WebhookClient = require('./resource_clients/webhook');
const WebhookCollectionClient = require('./resource_clients/webhook_collection');
const WebhookDispatchClient = require('./resource_clients/webhook_dispatch');
const WebhookDispatchCollectionClient = require('./resource_clients/webhook_dispatch_collection');

const { HttpClient } = require('./http-client');
const Statistics = require('./statistics');

/**
 * @typedef ApifyClientOptions
 * @property {string} [baseUrl='https://api.apify.com/v2']
 * @property {number} [maxRetries=8]
 * @property {number} [minDelayBetweenRetriesMillis=500]
 * @property {string} [token]
 */

/**
 * All API calls done through this client are made with exponential backoff.
 * What this means, is that if the API call fails, this client will attempt the call again with a small delay.
 * If it fails again, it will do another attempt after twice as long and so on, until one attempt succeeds
 * or 8th attempt fails.
 */
class ApifyClient {
    /**
     * @param {ApifyClientOptions} options
     */
    constructor(options = {}) {
        ow(options, ow.object.exactShape({
            baseUrl: ow.optional.string,
            maxRetries: ow.optional.number,
            minDelayBetweenRetriesMillis: ow.optional.number,
            token: ow.optional.string,
        }));

        const {
            baseUrl = 'https://api.apify.com/v2',
            maxRetries = 8,
            minDelayBetweenRetriesMillis = 500,
            token,
        } = options;

        this.baseUrl = baseUrl;
        this.maxRetries = maxRetries;
        this.minDelayBetweenRetriesMillis = minDelayBetweenRetriesMillis;
        this.token = token;
        this.stats = new Statistics();
        this.httpClient = new HttpClient({
            apifyClientStats: this.stats,
            expBackoffMaxRepeats: this.maxRetries,
            expBackoffMillis: this.minDelayBetweenRetriesMillis,
        });
    }

    _options() {
        return {
            baseUrl: this.baseUrl,
            httpClient: this.httpClient,
            params: {
                token: this.token,
            },
        };
    }

    actors() {
        return new ActorCollectionClient(this._options());
    }

    actor(id) {
        ow(id, ow.string);
        return new ActorClient({
            id,
            ...this._options(),
        });
    }

    // TODO requires new endpoint
    // builds() {
    //     return new BuildCollectionClient(this._options());
    // }

    // TODO temporarily uses second parameter + nested client
    build(id, actorId) {
        ow(id, ow.string);
        ow(actorId, ow.string);
        const actorClient = new ActorClient({
            id: actorId,
            ...this._options(),
        });

        const nestedOpts = actorClient._subResourceOptions({ id }); // eslint-disable-line no-underscore-dangle
        return new BuildClient(nestedOpts);
    }

    datasets() {
        return new DatasetCollectionClient(this._options());
    }

    dataset(id) {
        ow(id, ow.string);
        return new DatasetClient({
            id,
            ...this._options(),
        });
    }

    keyValueStores() {
        return new KeyValueStoreCollectionClient(this._options());
    }

    keyValueStore(id) {
        ow(id, ow.string);
        return new KeyValueStoreClient({
            id,
            ...this._options(),
        });
    }

    log(buildOrRunId) {
        ow(buildOrRunId, ow.string);
        return new LogClient({
            id: buildOrRunId,
            ...this._options(),
        });
    }

    requestQueues() {
        return new RequestQueueCollectionClient(this._options());
    }

    requestQueue(id, options = {}) {
        ow(id, ow.string);
        ow(options, ow.object.exactShape({
            clientKey: ow.optional.string,
        }));
        const apiClientOptions = {
            id,
            ...this._options(),
        };
        return new RequestQueueClient(apiClientOptions, options);
    }

    // TODO requires new endpoint
    // runs() {
    //
    // }

    // TODO temporarily uses second parameter + nested client
    run(id, actorId) {
        ow(id, ow.string);
        ow(actorId, ow.string);
        const actorClient = new ActorClient({
            id: actorId,
            ...this._options(),
        });

        const nestedOpts = actorClient._subResourceOptions({ id }); // eslint-disable-line no-underscore-dangle
        return new RunClient(nestedOpts);
    }

    tasks() {
        return new TaskCollectionClient(this._options());
    }

    task(id) {
        ow(id, ow.string);
        return new TaskClient({
            id,
            ...this._options(),
        });
    }

    schedules() {
        return new ScheduleCollectionClient(this._options());
    }

    schedule(id) {
        ow(id, ow.string);
        return new ScheduleClient({
            id,
            ...this._options(),
        });
    }

    user(id = ME_USER_NAME_PLACEHOLDER) {
        ow(id, ow.string);
        return new UserClient({
            id,
            ...this._options(),
        });
    }

    webhooks() {
        return new WebhookCollectionClient(this._options());
    }

    webhook(id) {
        ow(id, ow.string);
        return new WebhookClient({
            id,
            ...this._options(),
        });
    }

    webhookDispatches() {
        return new WebhookDispatchCollectionClient(this._options());
    }

    webhookDispatch(id) {
        ow(id, ow.string);
        return new WebhookDispatchClient({
            id,
            ...this._options(),
        });
    }
}

module.exports = ApifyClient;
