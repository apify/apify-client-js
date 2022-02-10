import ow from 'ow';
import { ME_USER_NAME_PLACEHOLDER } from '@apify/consts';
import logger, { Log } from '@apify/log';

import { HttpClient } from './http_client';
import { Statistics } from './statistics';
import { RequestInterceptorFunction } from './interceptors';

import { ActorClient } from './resource_clients/actor';
import { ActorCollectionClient } from './resource_clients/actor_collection';
import { BuildClient } from './resource_clients/build';
// import { BuildCollectionClient } from './resource_clients/build_collection';
import { DatasetClient } from './resource_clients/dataset';
import { DatasetCollectionClient } from './resource_clients/dataset_collection';
import { KeyValueStoreClient } from './resource_clients/key_value_store';
import { KeyValueStoreCollectionClient } from './resource_clients/key_value_store_collection';
import { LogClient } from './resource_clients/log';
import { RequestQueueClient, RequestQueueUserOptions } from './resource_clients/request_queue';
import { RequestQueueCollectionClient } from './resource_clients/request_queue_collection';
import { RunClient } from './resource_clients/run';
// import { RunCollectionClient } from './resource_clients/run_collection';
import { ScheduleClient } from './resource_clients/schedule';
import { ScheduleCollectionClient } from './resource_clients/schedule_collection';
import { TaskClient } from './resource_clients/task';
import { TaskCollectionClient } from './resource_clients/task_collection';
import { UserClient } from './resource_clients/user';
import { WebhookClient } from './resource_clients/webhook';
import { WebhookCollectionClient } from './resource_clients/webhook_collection';
import { WebhookDispatchClient } from './resource_clients/webhook_dispatch';
import { WebhookDispatchCollectionClient } from './resource_clients/webhook_dispatch_collection';

/**
 * ApifyClient is the official library to access [Apify API](https://docs.apify.com/api/v2) from your
 * JavaScript applications. It runs both in Node.js and browser.
 */
export class ApifyClient {
    baseUrl: string;

    token?: string;

    stats: Statistics;

    logger: Log;

    httpClient: HttpClient;

    constructor(options: ApifyClientOptions = {}) {
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
            token: this.token,
        });
    }

    private _options() {
        return {
            baseUrl: this.baseUrl,
            apifyClient: this,
            httpClient: this.httpClient,
        };
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/actor-collection
     */
    actors(): ActorCollectionClient {
        return new ActorCollectionClient(this._options());
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/actor-object
     */
    actor(id: string): ActorClient {
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
     */
    build(id: string): BuildClient {
        ow(id, ow.string.nonEmpty);

        return new BuildClient({
            id,
            ...this._options(),
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/datasets/dataset-collection
     */
    datasets(): DatasetCollectionClient {
        return new DatasetCollectionClient(this._options());
    }

    /**
     * https://docs.apify.com/api/v2#/reference/datasets/dataset
     */
    dataset<
        Data extends Record<string | number, unknown> = Record<string | number, unknown>
    >(id: string): DatasetClient<Data> {
        ow(id, ow.string.nonEmpty);

        return new DatasetClient({
            id,
            ...this._options(),
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/key-value-stores/store-collection
     */
    keyValueStores(): KeyValueStoreCollectionClient {
        return new KeyValueStoreCollectionClient(this._options());
    }

    /**
     * https://docs.apify.com/api/v2#/reference/key-value-stores/store-object
     */
    keyValueStore(id: string): KeyValueStoreClient {
        ow(id, ow.string.nonEmpty);

        return new KeyValueStoreClient({
            id,
            ...this._options(),
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/logs
     */
    log(buildOrRunId: string): LogClient {
        ow(buildOrRunId, ow.string.nonEmpty);

        return new LogClient({
            id: buildOrRunId,
            ...this._options(),
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/request-queues/queue-collection
     */
    requestQueues(): RequestQueueCollectionClient {
        return new RequestQueueCollectionClient(this._options());
    }

    /**
     * https://docs.apify.com/api/v2#/reference/request-queues/queue
     */
    requestQueue(id: string, options: RequestQueueUserOptions = {}): RequestQueueClient {
        ow(id, ow.string.nonEmpty);
        ow(options, ow.object.exactShape({
            clientKey: ow.optional.string.nonEmpty,
            timeoutSecs: ow.optional.number,
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
     */
    run(id: string): RunClient {
        ow(id, ow.string.nonEmpty);

        return new RunClient({
            id,
            ...this._options(),
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-tasks/task-collection
     */
    tasks(): TaskCollectionClient {
        return new TaskCollectionClient(this._options());
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-tasks/task-object
     */
    task(id: string): TaskClient {
        ow(id, ow.string.nonEmpty);

        return new TaskClient({
            id,
            ...this._options(),
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/schedules/schedules-collection
     */
    schedules(): ScheduleCollectionClient {
        return new ScheduleCollectionClient(this._options());
    }

    /**
     * https://docs.apify.com/api/v2#/reference/schedules/schedule-object
     */
    schedule(id: string): ScheduleClient {
        ow(id, ow.string.nonEmpty);

        return new ScheduleClient({
            id,
            ...this._options(),
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/users
     */
    user(id = ME_USER_NAME_PLACEHOLDER): UserClient {
        ow(id, ow.string.nonEmpty);

        return new UserClient({
            id,
            ...this._options(),
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/webhooks/webhook-collection
     */
    webhooks(): WebhookCollectionClient {
        return new WebhookCollectionClient(this._options());
    }

    /**
     * https://docs.apify.com/api/v2#/reference/webhooks/webhook-object
     */
    webhook(id: string): WebhookClient {
        ow(id, ow.string.nonEmpty);

        return new WebhookClient({
            id,
            ...this._options(),
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/webhook-dispatches
     */
    webhookDispatches(): WebhookDispatchCollectionClient {
        return new WebhookDispatchCollectionClient(this._options());
    }

    /**
     * https://docs.apify.com/api/v2#/reference/webhook-dispatches/webhook-dispatch-object
     */
    webhookDispatch(id: string): WebhookDispatchClient {
        ow(id, ow.string.nonEmpty);

        return new WebhookDispatchClient({
            id,
            ...this._options(),
        });
    }
}

export interface ApifyClientOptions {
    /** @default https://api.apify.com */
    baseUrl?: string;
    /** @default 8 */
    maxRetries?: number;
    /** @default 500 */
    minDelayBetweenRetriesMillis?: number;
    /** @default [] */
    requestInterceptors?: RequestInterceptorFunction[];
    /** @default 360 */
    timeoutSecs?: number;
    token?: string;
}
