const ow = require('ow');
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


const { REQUEST_ENDPOINTS_EXP_BACKOFF_MAX_REPEATS, RequestQueues } = require('./request_queues');
const { HttpClient, EXP_BACKOFF_MAX_REPEATS } = require('./http-client');

class Statistics {
    constructor() {
        // Number of Apify client function calls
        this.calls = 0;
        // Number of Apify API requests
        this.requests = 0;
        // Number of times the API returned 429 error. Spread based on number of retries.
        this.rateLimitErrors = new Array(Math.max(REQUEST_ENDPOINTS_EXP_BACKOFF_MAX_REPEATS, EXP_BACKOFF_MAX_REPEATS)).fill(0);
    }
}

/**
 * @type package
 * @class ApifyClient
 * @param {Object} [options] - Global options for ApifyClient. You can globally configure here any method option from any namespace. For example
 *                             if you are working with just one actor then you can preset it's actId here instead of passing it to each
 *                             actor's method.
 * @param {String} [options.userId] - Your user ID at apify.com
 * @param {String} [options.token] - Your API token at apify.com
 * @param {Number} [options.expBackoffMillis=500] - Wait time in milliseconds before repeating request to Apify API in a case of server
 or rate limit error
 * @param {Number} [options.expBackoffMaxRepeats=8] - Maximum number of repeats in a case of error
 * @param {Array<Number>} [options.retryOnStatusCodes=[429]] - An array of status codes on which request gets retried. By default requests are retried
 *                                                             only in a case of limit error (status code 429).
 * @description Basic usage of ApifyClient:
 * ```javascript
 * const ApifyClient = require('apify-client');
 *
 * const apifyClient = new ApifyClient({
 *   userId: 'jklnDMNKLekk',
 *   token: 'SNjkeiuoeD443lpod68dk',
 * });
 * ```
 *
 * All API calls done through this client are made with exponential backoff.
 * What this means, is that if the API call fails, this client will attempt the call again with a small delay.
 * If it fails again, it will do another attempt after twice as long and so on, until one attempt succeeds
 * or 8th attempt fails.
 */
class ApifyClient {
    constructor(options = {}) {
        ow(options, ow.object.exactShape({
            baseUrl: ow.optional.string,
            maxRetries: ow.optional.number,
            token: ow.optional.string,
        }));

        const {
            baseUrl = 'https://api.apify.com/v2',
            maxRetries = 8,
            token,
        } = options;

        /**
         * An object that contains various statistics about the API operations.
         * @memberof ApifyClient
         * @instance
         */
        this.baseUrl = baseUrl;
        this.maxRetries = maxRetries;
        this.token = token;

        this.stats = new Statistics();
        this.httpClient = new HttpClient({
            apifyClientStats: this.stats,
            expBackoffMaxRepeats: this.maxRetries,
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

    log(id) {
        ow(id, ow.string);
        return new LogClient({
            id,
            ...this._options(),
        });
    }

    requestQueues() {
        return new RequestQueueCollectionClient(this._options());
    }

    requestQueue(id) {
        ow(id, ow.string);
        return new RequestQueueClient({
            id,
            ...this._options(),
        });
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

    user(id = 'my') {
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
