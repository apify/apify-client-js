import type { SetStatusMessageOptions } from '@crawlee/types';
import ow from 'ow';

import { ACTOR_ENV_VARS, ME_USER_NAME_PLACEHOLDER } from '@apify/consts';
import type { Log } from '@apify/log';
import logger from '@apify/log';

import { HttpClient } from './http_client';
import type { RequestInterceptorFunction } from './interceptors';
import { ActorClient } from './resource_clients/actor';
import { ActorCollectionClient } from './resource_clients/actor_collection';
import { BuildClient } from './resource_clients/build';
import { BuildCollectionClient } from './resource_clients/build_collection';
import { DatasetClient } from './resource_clients/dataset';
import { DatasetCollectionClient } from './resource_clients/dataset_collection';
import { KeyValueStoreClient } from './resource_clients/key_value_store';
import { KeyValueStoreCollectionClient } from './resource_clients/key_value_store_collection';
import { LogClient } from './resource_clients/log';
import type { RequestQueueUserOptions } from './resource_clients/request_queue';
import { RequestQueueClient } from './resource_clients/request_queue';
import { RequestQueueCollectionClient } from './resource_clients/request_queue_collection';
import { RunClient } from './resource_clients/run';
import { RunCollectionClient } from './resource_clients/run_collection';
import { ScheduleClient } from './resource_clients/schedule';
import { ScheduleCollectionClient } from './resource_clients/schedule_collection';
import { StoreCollectionClient } from './resource_clients/store_collection';
import { TaskClient } from './resource_clients/task';
import { TaskCollectionClient } from './resource_clients/task_collection';
import { UserClient } from './resource_clients/user';
import { WebhookClient } from './resource_clients/webhook';
import { WebhookCollectionClient } from './resource_clients/webhook_collection';
import { WebhookDispatchClient } from './resource_clients/webhook_dispatch';
import { WebhookDispatchCollectionClient } from './resource_clients/webhook_dispatch_collection';
import { Statistics } from './statistics';

const DEFAULT_TIMEOUT_SECS = 360;

/**
 * The official JavaScript client for the Apify API.
 *
 * Provides programmatic access to all Apify platform resources including Actors, runs, datasets,
 * key-value stores, request queues, and more. Works in both Node.js and browser environments.
 *
 * @example
 * ```javascript
 * import { ApifyClient } from 'apify-client';
 *
 * const client = new ApifyClient({ token: 'my-token' });
 *
 * // Start an Actor and wait for it to finish
 * const run = await client.actor('my-actor-id').call();
 *
 * // Fetch dataset items
 * const { items } = await client.dataset(run.defaultDatasetId).listItems();
 * ```
 *
 * @see https://docs.apify.com/api/v2
 */
export class ApifyClient {
    baseUrl: string;

    publicBaseUrl: string;

    token?: string;

    stats: Statistics;

    logger: Log;

    httpClient: HttpClient;

    constructor(options: ApifyClientOptions = {}) {
        ow(
            options,
            ow.object.exactShape({
                baseUrl: ow.optional.string,
                publicBaseUrl: ow.optional.string,
                maxRetries: ow.optional.number,
                minDelayBetweenRetriesMillis: ow.optional.number,
                requestInterceptors: ow.optional.array,
                timeoutSecs: ow.optional.number,
                token: ow.optional.string,
                userAgentSuffix: ow.optional.any(ow.string, ow.array.ofType(ow.string)),
            }),
        );

        const {
            baseUrl = 'https://api.apify.com',
            publicBaseUrl = 'https://api.apify.com',
            maxRetries = 8,
            minDelayBetweenRetriesMillis = 500,
            requestInterceptors = [],
            timeoutSecs = DEFAULT_TIMEOUT_SECS,
            token,
        } = options;

        const tempBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, baseUrl.length - 1) : baseUrl;
        this.baseUrl = `${tempBaseUrl}/v2`;
        const tempPublicBaseUrl = publicBaseUrl.endsWith('/')
            ? publicBaseUrl.slice(0, publicBaseUrl.length - 1)
            : publicBaseUrl;
        this.publicBaseUrl = `${tempPublicBaseUrl}/v2`;
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
            token: this.token,
            userAgentSuffix: options.userAgentSuffix,
        });
    }

    private _options() {
        return {
            baseUrl: this.baseUrl,
            publicBaseUrl: this.publicBaseUrl,
            apifyClient: this,
            httpClient: this.httpClient,
        };
    }

    /**
     * Returns a client for managing Actors in your account.
     *
     * Provides access to the Actor collection, allowing you to list, create, and search for Actors.
     *
     * @returns A client for the Actors collection
     * @see https://docs.apify.com/api/v2/acts-get
     */
    actors(): ActorCollectionClient {
        return new ActorCollectionClient(this._options());
    }

    /**
     * Returns a client for a specific Actor.
     *
     * Use this to get, update, delete, start, or call an Actor, as well as manage its builds,
     * runs, versions, and webhooks.
     *
     * @param id - Actor ID or username/name
     * @returns A client for the specific Actor
     * @see https://docs.apify.com/api/v2/act-get
     *
     * @example
     * ```javascript
     * // Call an Actor and wait for it to finish
     * const run = await client.actor('apify/web-scraper').call({ url: 'https://example.com' });
     * ```
     */
    actor(id: string): ActorClient {
        ow(id, ow.string.nonEmpty);

        return new ActorClient({
            id,
            ...this._options(),
        });
    }

    /**
     * Returns a client for managing Actor builds in your account.
     *
     * Lists all builds across all of your Actors.
     *
     * @returns A client for Actor builds collection
     * @see https://docs.apify.com/api/v2/actor-builds-get
     */
    builds(): BuildCollectionClient {
        return new BuildCollectionClient(this._options());
    }

    /**
     * Returns a client for a specific Actor build.
     *
     * Use this to get details about a build, wait for it to finish, or access its logs.
     *
     * @param id - Build ID
     * @returns A client for the specified build
     * @see https://docs.apify.com/api/v2/actor-build-get
     */
    build(id: string): BuildClient {
        ow(id, ow.string.nonEmpty);

        return new BuildClient({
            id,
            ...this._options(),
        });
    }

    /**
     * Returns a client for managing datasets in your account.
     *
     * Datasets store structured data results from Actor runs. Use this to list or create datasets.
     *
     * @returns A client for the Datasets collection
     * @see https://docs.apify.com/api/v2/datasets-get
     */
    datasets(): DatasetCollectionClient {
        return new DatasetCollectionClient(this._options());
    }

    /**
     * Returns a client for a specific dataset.
     *
     * Use this to read, write, and manage items in the dataset. Datasets contain structured
     * data stored as individual items (records).
     *
     * @template Data - Type of items stored in the dataset
     * @param id - Dataset ID or name
     * @returns A client for the specific Dataset
     * @see https://docs.apify.com/api/v2/dataset-get
     *
     * @example
     * ```javascript
     * // Push items to a dataset
     * await client.dataset('my-dataset').pushItems([
     *   { url: 'https://example.com', title: 'Example' },
     *   { url: 'https://test.com', title: 'Test' }
     * ]);
     *
     * // Retrieve items
     * const { items } = await client.dataset('my-dataset').listItems();
     * ```
     */
    dataset<Data extends Record<string | number, any> = Record<string | number, unknown>>(
        id: string,
    ): DatasetClient<Data> {
        ow(id, ow.string.nonEmpty);

        return new DatasetClient({
            id,
            ...this._options(),
        });
    }

    /**
     * Returns a client for managing key-value stores in your account.
     *
     * Key-value stores are used to store arbitrary data records or files.
     *
     * @returns A client for the Key-value stores collection
     * @see https://docs.apify.com/api/v2/key-value-stores-get
     */
    keyValueStores(): KeyValueStoreCollectionClient {
        return new KeyValueStoreCollectionClient(this._options());
    }

    /**
     * Returns a client for a specific key-value store.
     *
     * Use this to read, write, and delete records in the store. Key-value stores can hold
     * any type of data including text, JSON, images, and other files.
     *
     * @param id - Key-value store ID or name
     * @returns A client for the specific key-value store
     * @see https://docs.apify.com/api/v2/key-value-store-get
     *
     * @example
     * ```javascript
     * // Save a record
     * await client.keyValueStore('my-store').setRecord({ key: 'OUTPUT', value: { foo: 'bar' } });
     *
     * // Get a record
     * const record = await client.keyValueStore('my-store').getRecord('OUTPUT');
     * ```
     */
    keyValueStore(id: string): KeyValueStoreClient {
        ow(id, ow.string.nonEmpty);

        return new KeyValueStoreClient({
            id,
            ...this._options(),
        });
    }

    /**
     * Returns a client for accessing logs of an Actor build or run.
     *
     * @param buildOrRunId - Build ID or run ID
     * @returns A client for accessing logs
     * @see https://docs.apify.com/api/v2/log-get
     */
    log(buildOrRunId: string): LogClient {
        ow(buildOrRunId, ow.string.nonEmpty);

        return new LogClient({
            id: buildOrRunId,
            ...this._options(),
        });
    }

    /**
     * Returns a client for managing request queues in your account.
     *
     * Request queues store URLs to be crawled, along with their metadata.
     *
     * @returns A client for the Request queues collection
     * @see https://docs.apify.com/api/v2/request-queues-get
     */
    requestQueues(): RequestQueueCollectionClient {
        return new RequestQueueCollectionClient(this._options());
    }

    /**
     * Returns a client for a specific request queue.
     *
     * Use this to add, retrieve, and manage requests in the queue. Request queues are used
     * by web crawlers to manage URLs that need to be visited.
     *
     * @param id - Request queue ID or name
     * @param options - Configuration options for the request queue client
     * @returns A client for the specific Request queue
     * @see https://docs.apify.com/api/v2/request-queue-get
     *
     * @example
     * ```javascript
     * // Add requests to a queue
     * const queue = client.requestQueue('my-queue');
     * await queue.addRequest({ url: 'https://example.com', uniqueKey: 'example' });
     *
     * // Get and lock the next request
     * const { items } = await queue.listAndLockHead({ lockSecs: 60 });
     * ```
     */
    requestQueue(id: string, options: RequestQueueUserOptions = {}): RequestQueueClient {
        ow(id, ow.string.nonEmpty);
        ow(
            options,
            ow.object.exactShape({
                clientKey: ow.optional.string.nonEmpty,
                timeoutSecs: ow.optional.number,
            }),
        );

        const apiClientOptions = {
            id,
            ...this._options(),
        };
        return new RequestQueueClient(apiClientOptions, options);
    }

    /**
     * Returns a client for managing Actor runs in your account.
     *
     * Lists all runs across all of your Actors.
     *
     * @returns A client for the run collection
     * @see https://docs.apify.com/api/v2/actor-runs-get
     */
    runs(): RunCollectionClient {
        return new RunCollectionClient({
            ...this._options(),
            resourcePath: 'actor-runs',
        });
    }

    /**
     * Returns a client for a specific Actor run.
     *
     * Use this to get details about a run, wait for it to finish, abort it, or access its
     * dataset, key-value store, and request queue.
     *
     * @param id - Run ID
     * @returns A client for the specified run
     * @see https://docs.apify.com/api/v2/actor-run-get
     *
     * @example
     * ```javascript
     * // Wait for a run to finish
     * const run = await client.run('run-id').waitForFinish();
     *
     * // Access run's dataset
     * const { items } = await client.run('run-id').dataset().listItems();
     * ```
     */
    run(id: string): RunClient {
        ow(id, ow.string.nonEmpty);

        return new RunClient({
            id,
            ...this._options(),
        });
    }

    /**
     * Returns a client for managing Actor tasks in your account.
     *
     * Tasks are pre-configured Actor runs with stored input that can be executed repeatedly.
     *
     * @returns A client for the task collection
     * @see https://docs.apify.com/api/v2/actor-tasks-get
     */
    tasks(): TaskCollectionClient {
        return new TaskCollectionClient(this._options());
    }

    /**
     * Returns a client for a specific Actor task.
     *
     * Use this to get, update, delete, or run a task with pre-configured input.
     *
     * @param id - Task ID or username/task-name
     * @returns A client for the specified task
     * @see https://docs.apify.com/api/v2/actor-task-get
     *
     * @example
     * ```javascript
     * // Run a task and wait for it to finish
     * const run = await client.task('my-task').call();
     * ```
     */
    task(id: string): TaskClient {
        ow(id, ow.string.nonEmpty);

        return new TaskClient({
            id,
            ...this._options(),
        });
    }

    /**
     * Returns a client for managing schedules in your account.
     *
     * Schedules automatically start Actor or task runs at specified times.
     *
     * @returns A client for the Schedules collection
     * @see https://docs.apify.com/api/v2/schedules-get
     */
    schedules(): ScheduleCollectionClient {
        return new ScheduleCollectionClient(this._options());
    }

    /**
     * Returns a client for a specific schedule.
     *
     * Use this to get, update, or delete a schedule.
     *
     * @param id - Schedule ID
     * @returns A client for the specific Schedule
     * @see https://docs.apify.com/api/v2/schedule-get
     */
    schedule(id: string): ScheduleClient {
        ow(id, ow.string.nonEmpty);

        return new ScheduleClient({
            id,
            ...this._options(),
        });
    }

    /**
     * Returns a client for accessing user data.
     *
     * By default, returns information about the current user (determined by the API token).
     *
     * @param id - User ID or username. Defaults to 'me' (current user)
     * @returns A client for the user
     * @see https://docs.apify.com/api/v2/user-get
     */
    user(id = ME_USER_NAME_PLACEHOLDER): UserClient {
        ow(id, ow.string.nonEmpty);

        return new UserClient({
            id,
            ...this._options(),
        });
    }

    /**
     * Returns a client for managing webhooks in your account.
     *
     * Webhooks notify external services when specific events occur (e.g., Actor run finishes).
     *
     * @returns A client for the Webhooks collection
     * @see https://docs.apify.com/api/v2/webhooks-get
     */
    webhooks(): WebhookCollectionClient {
        return new WebhookCollectionClient(this._options());
    }

    /**
     * Returns a client for a specific webhook.
     *
     * Use this to get, update, delete, or test a webhook.
     *
     * @param id - Webhook ID
     * @returns A client for the specific webhook
     * @see https://docs.apify.com/api/v2/webhook-get
     */
    webhook(id: string): WebhookClient {
        ow(id, ow.string.nonEmpty);

        return new WebhookClient({
            id,
            ...this._options(),
        });
    }

    /**
     * Returns a client for viewing webhook dispatches in your account.
     *
     * Webhook dispatches represent individual invocations of webhooks.
     *
     * @returns A client for the webhook dispatches collection
     * @see https://docs.apify.com/api/v2/webhook-dispatches-get
     */
    webhookDispatches(): WebhookDispatchCollectionClient {
        return new WebhookDispatchCollectionClient(this._options());
    }

    /**
     * Returns a client for a specific webhook dispatch.
     *
     * @param id - Webhook dispatch ID
     * @returns A client for the specific webhook dispatch
     * @see https://docs.apify.com/api/v2/webhook-dispatch-get
     */
    webhookDispatch(id: string): WebhookDispatchClient {
        ow(id, ow.string.nonEmpty);

        return new WebhookDispatchClient({
            id,
            ...this._options(),
        });
    }

    /**
     * Returns a client for browsing Actors in Apify Store.
     *
     * Use this to search and retrieve information about public Actors.
     *
     * @returns A client for the Apify Store
     * @see https://docs.apify.com/api/v2/store-actors-get
     */
    store(): StoreCollectionClient {
        return new StoreCollectionClient(this._options());
    }

    /**
     * Sets a status message for the current Actor run.
     *
     * This is a convenience method that updates the status message of the run specified by
     * the `ACTOR_RUN_ID` environment variable. Only works when called from within an Actor run.
     *
     * @param message - The status message to set
     * @param options - Additional options for the status message
     * @throws {Error} If `ACTOR_RUN_ID` environment variable is not set
     */
    async setStatusMessage(message: string, options?: SetStatusMessageOptions): Promise<void> {
        const runId = process.env[ACTOR_ENV_VARS.RUN_ID];
        if (!runId) {
            throw new Error(`Environment variable ${ACTOR_ENV_VARS.RUN_ID} is not set!`);
        }
        await this.run(runId).update({
            statusMessage: message,
            ...options,
        });
    }
}

/**
 * Configuration options for ApifyClient.
 */
export interface ApifyClientOptions {
    /** @default https://api.apify.com */
    baseUrl?: string;
    /** @default https://api.apify.com */
    publicBaseUrl?: string;
    /** @default 8 */
    maxRetries?: number;
    /** @default 500 */
    minDelayBetweenRetriesMillis?: number;
    /** @default [] */
    requestInterceptors?: RequestInterceptorFunction[];
    /** @default 360 */
    timeoutSecs?: number;
    token?: string;
    userAgentSuffix?: string | string[];
}
