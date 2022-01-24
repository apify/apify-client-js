import { ACT_JOB_STATUSES } from '@apify/consts';
import ow from 'ow';
import { ApifyApiError } from '../apify_api_error';
import { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import { ApifyRequestConfig } from '../http_client';
import {
    cast,
    catchNotFoundOrThrow,
    Dictionary,
    parseDateFields,
    pluckData,
    stringifyWebhooksToBase64,
} from '../utils';
import { ActorRun, ActorStartOptions } from './actor';
import { RunClient } from './run';
import { RunCollectionClient } from './run_collection';
import { WebhookCollectionClient } from './webhook_collection';

/**
 * @hideconstructor
 */
export class TaskClient extends ResourceClient {
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'actor-tasks',
            ...options,
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-tasks/task-object/get-task
     */
    async get(): Promise<Task | undefined> {
        return this._get();
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-tasks/task-object/update-task
     */
    async update(newFields: TaskUpdateData): Promise<Task> {
        ow(newFields, ow.object);

        return this._update(newFields);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-tasks/task-object/delete-task
     */
    async delete(): Promise<void> {
        return this._delete();
    }

    /**
     * Starts a task and immediately returns the Run object.
     * https://docs.apify.com/api/v2#/reference/actor-tasks/run-collection/run-task
     */
    async start(input?: Dictionary, options: TaskStartOptions = {}): Promise<ActorRun> {
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

        const request: ApifyRequestConfig = {
            url: this._url('runs'),
            method: 'POST',
            data: input,
            params: this._params(params),
            // Apify internal property. Tells the request serialization interceptor
            // to stringify functions to JSON, instead of omitting them.
            stringifyFunctions: true,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const response = await this.httpClient.call(request);
        return cast(parseDateFields(pluckData(response.data)));
    }

    /**
     * Starts a task and waits for it to finish before returning the Run object.
     * It waits indefinitely, unless the `waitSecs` option is provided.
     * https://docs.apify.com/api/v2#/reference/actor-tasks/run-collection/run-task
     */
    async call(input?: Dictionary, options: TaskStartOptions = {}): Promise<ActorRun> {
        ow(input, ow.optional.object);
        ow(options, ow.object.exactShape({
            build: ow.optional.string,
            memory: ow.optional.number,
            timeout: ow.optional.number.not.negative,
            waitSecs: ow.optional.number.not.negative,
            webhooks: ow.optional.array.ofType(ow.object),
        }));

        const { waitSecs, ...startOptions } = options;

        const { id } = await this.start(input, startOptions);

        // Calling root client because we need access to top level API.
        // Creating a new instance of RunClient here would only allow
        // setting it up as a nested route under task API.
        return this.apifyClient.run(id).waitForFinish({ waitSecs });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-tasks/task-input-object/get-task-input
     */
    async getInput(): Promise<Dictionary | Dictionary[] | undefined> {
        const requestOpts: ApifyRequestConfig = {
            url: this._url('input'),
            method: 'GET',
            params: this._params(),
        };
        try {
            const response = await this.httpClient.call(requestOpts);
            return cast(response.data);
        } catch (err) {
            catchNotFoundOrThrow(err as ApifyApiError);
        }

        return undefined;
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-tasks/task-input-object/update-task-input
     */
    async updateInput(newFields: Dictionary | Dictionary[]): Promise<Dictionary | Dictionary[]> {
        const response = await this.httpClient.call({
            url: this._url('input'),
            method: 'PUT',
            params: this._params(),
            data: newFields,
        });

        return cast(response.data);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-tasks/last-run-object-and-its-storages
     */
    lastRun(options: TaskLastRunOptions = {}): RunClient {
        ow(options, ow.object.exactShape({
            status: ow.optional.string.oneOf(Object.values(ACT_JOB_STATUSES)),
        }));

        return new RunClient(this._subResourceOptions({
            id: 'last',
            params: this._params(options),
            resourcePath: 'runs',
        }));
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-tasks/run-collection
     */
    runs(): RunCollectionClient {
        return new RunCollectionClient(this._subResourceOptions({
            resourcePath: 'runs',
        }));
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-tasks/webhook-collection
     */
    webhooks(): WebhookCollectionClient {
        return new WebhookCollectionClient(this._subResourceOptions());
    }
}

export interface Task {
    id: string;
    userId: string;
    actId: string;
    name: string;
    description?: string;
    username?: string;
    createdAt: string;
    modifiedAt: string;
    stats: TaskStats;
    options?: TaskOptions;
    input?: Dictionary | Dictionary[];
}

export interface TaskStats {
    totalRuns: number;
}

export interface TaskOptions {
    build?: string;
    timeoutSecs?: number;
    memoryMbytes?: number;
}

export type TaskUpdateData = Partial<
    Pick<
        Task,
        | 'name'
        | 'description'
        | 'options'
        | 'input'
    >
>;

export interface TaskLastRunOptions {
    status?: keyof typeof ACT_JOB_STATUSES;
}

export type TaskStartOptions = Omit<ActorStartOptions, 'contentType'>;
