import ow from 'ow';

import { ACT_JOB_STATUSES, META_ORIGINS } from '@apify/consts';

import type { ApifyApiError } from '../apify_api_error';
import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import type { ApifyRequestConfig } from '../http_client';
import type { Dictionary } from '../utils';
import { cast, catchNotFoundOrThrow, parseDateFields, pluckData, stringifyWebhooksToBase64 } from '../utils';
import type { ActorRun, ActorStandby, ActorStartOptions } from './actor';
import { RunClient } from './run';
import { RunCollectionClient } from './run_collection';
import { WebhookCollectionClient } from './webhook_collection';

/**
 * Client for managing a specific Actor task.
 *
 * Tasks are pre-configured Actor runs with saved input and options. This client provides methods
 * to start, call, update, and delete tasks, as well as manage their runs and webhooks.
 *
 * @example
 * ```javascript
 * const client = new ApifyClient({ token: 'my-token' });
 * const taskClient = client.task('my-task-id');
 *
 * // Start a task
 * const run = await taskClient.start();
 *
 * // Call a task and wait for it to finish
 * const finishedRun = await taskClient.call();
 * ```
 *
 * @see https://docs.apify.com/platform/actors/running/tasks
 */
export class TaskClient extends ResourceClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'actor-tasks',
            ...options,
        });
    }

    /**
     * Retrieves the Actor task.
     *
     * @returns The task object, or `undefined` if it does not exist.
     * @see https://docs.apify.com/api/v2/actor-task-get
     */
    async get(): Promise<Task | undefined> {
        return this._get();
    }

    /**
     * Updates the task with the specified fields.
     *
     * @param newFields - Fields to update.
     * @returns The updated task object.
     * @see https://docs.apify.com/api/v2/actor-task-put
     */
    async update(newFields: TaskUpdateData): Promise<Task> {
        ow(newFields, ow.object);

        return this._update(newFields);
    }

    /**
     * Deletes the Task.
     *
     * @see https://docs.apify.com/api/v2/actor-task-delete
     */
    async delete(): Promise<void> {
        return this._delete();
    }

    /**
     * Starts an Actor task and immediately returns the Run object.
     *
     * @param input - Input overrides for the task. If not provided, the task's saved input is used.
     * @param options - Run options.
     * @param options.build - Tag or number of the Actor build to run (e.g., `'beta'` or `'1.2.345'`).
     * @param options.memory - Memory in megabytes allocated for the run.
     * @param options.timeout - Timeout for the run in seconds. Zero means no timeout.
     * @param options.waitForFinish - Maximum time to wait (in seconds, max 60s) for the run to finish before returning.
     * @param options.webhooks - Webhooks to trigger for specific Actor run events.
     * @param options.maxItems - Maximum number of dataset items (for pay-per-result Actors).
     * @param options.maxTotalChargeUsd - Maximum cost in USD (for pay-per-event Actors).
     * @param options.restartOnError - Whether to restart the run on error.
     * @returns The Actor Run object.
     * @see https://docs.apify.com/api/v2/actor-task-runs-post
     */
    async start(input?: Dictionary, options: TaskStartOptions = {}): Promise<ActorRun> {
        ow(input, ow.optional.object);
        ow(
            options,
            ow.object.exactShape({
                build: ow.optional.string,
                memory: ow.optional.number,
                timeout: ow.optional.number,
                waitForFinish: ow.optional.number,
                webhooks: ow.optional.array.ofType(ow.object),
                maxItems: ow.optional.number.not.negative,
                maxTotalChargeUsd: ow.optional.number.not.negative,
                restartOnError: ow.optional.boolean,
            }),
        );

        const { waitForFinish, timeout, memory, build, maxItems, maxTotalChargeUsd, restartOnError } = options;

        const params = {
            waitForFinish,
            timeout,
            memory,
            build,
            webhooks: stringifyWebhooksToBase64(options.webhooks),
            maxItems,
            maxTotalChargeUsd,
            restartOnError,
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
     *
     * @param input - Input overrides for the task. If not provided, the task's saved input is used.
     * @param options - Run and wait options.
     * @param options.build - Tag or number of the Actor build to run.
     * @param options.memory - Memory in megabytes allocated for the run.
     * @param options.timeout - Timeout for the run in seconds.
     * @param options.waitSecs - Maximum time to wait for the run to finish, in seconds. If omitted, waits indefinitely.
     * @param options.webhooks - Webhooks to trigger for specific Actor run events.
     * @param options.maxItems - Maximum number of dataset items (for pay-per-result Actors).
     * @param options.maxTotalChargeUsd - Maximum cost in USD (for pay-per-event Actors).
     * @param options.restartOnError - Whether to restart the run on error.
     * @returns The Actor run object.
     * @see https://docs.apify.com/api/v2/actor-task-runs-post
     */
    async call(input?: Dictionary, options: TaskCallOptions = {}): Promise<ActorRun> {
        ow(input, ow.optional.object);
        ow(
            options,
            ow.object.exactShape({
                build: ow.optional.string,
                memory: ow.optional.number,
                timeout: ow.optional.number.not.negative,
                waitSecs: ow.optional.number.not.negative,
                webhooks: ow.optional.array.ofType(ow.object),
                maxItems: ow.optional.number.not.negative,
                maxTotalChargeUsd: ow.optional.number.not.negative,
                restartOnError: ow.optional.boolean,
            }),
        );

        const { waitSecs, ...startOptions } = options;

        const { id } = await this.start(input, startOptions);

        // Calling root client because we need access to top level API.
        // Creating a new instance of RunClient here would only allow
        // setting it up as a nested route under task API.
        return this.apifyClient.run(id).waitForFinish({ waitSecs });
    }

    /**
     * Retrieves the Actor task's input object.
     *
     * @returns The Task's input, or `undefined` if it does not exist.
     * @see https://docs.apify.com/api/v2/actor-task-input-get
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
     * Updates the Actor task's input object.
     *
     * @param newFields - New input data for the task.
     * @returns The updated task input.
     * @see https://docs.apify.com/api/v2/actor-task-input-put
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
     * Returns a client for the last run of this task.
     *
     * @param options - Filter options for the last run.
     * @param options.status - Filter by run status (e.g., `'SUCCEEDED'`, `'FAILED'`, `'RUNNING'`).
     * @param options.origin - Filter by run origin (e.g., `'WEB'`, `'API'`, `'SCHEDULE'`).
     * @returns A client for the last run.
     * @see https://docs.apify.com/api/v2/actor-task-runs-last-get
     */
    lastRun(options: TaskLastRunOptions = {}): RunClient {
        ow(
            options,
            ow.object.exactShape({
                status: ow.optional.string.oneOf(Object.values(ACT_JOB_STATUSES)),
                origin: ow.optional.string.oneOf(Object.values(META_ORIGINS)),
            }),
        );

        return new RunClient(
            this._subResourceOptions({
                id: 'last',
                params: this._params(options),
                resourcePath: 'runs',
            }),
        );
    }

    /**
     * Returns a client for the Runs of this Task.
     *
     * @returns A client for the task's runs.
     * @see https://docs.apify.com/api/v2/actor-task-runs-get
     */
    runs(): RunCollectionClient {
        return new RunCollectionClient(
            this._subResourceOptions({
                resourcePath: 'runs',
            }),
        );
    }

    /**
     * Returns a client for the Webhooks of this Task.
     *
     * @returns A client for the task's webhooks.
     * @see https://docs.apify.com/api/v2/actor-task-webhooks-get
     */
    webhooks(): WebhookCollectionClient {
        return new WebhookCollectionClient(this._subResourceOptions());
    }
}

/**
 * Represents an Actor task.
 *
 * Tasks are saved Actor configurations with input and settings that can be executed
 * repeatedly without having to specify the full input each time.
 */
export interface Task {
    id: string;
    userId: string;
    actId: string;
    name: string;
    title?: string;
    description?: string;
    username?: string;
    createdAt: Date;
    modifiedAt: Date;
    stats: TaskStats;
    options?: TaskOptions;
    input?: Dictionary | Dictionary[];
    actorStandby?: Partial<ActorStandby>;
}

/**
 * Statistics about Actor task usage.
 */
export interface TaskStats {
    totalRuns: number;
}

/**
 * Configuration options for an Actor task.
 */
export interface TaskOptions {
    build?: string;
    timeoutSecs?: number;
    memoryMbytes?: number;
    restartOnError?: boolean;
}

/**
 * Fields that can be updated when modifying a Task.
 */
export type TaskUpdateData = Partial<
    Pick<Task, 'name' | 'title' | 'description' | 'options' | 'input' | 'actorStandby'>
>;

/**
 * Options for filtering the last run of a Task.
 */
export interface TaskLastRunOptions {
    status?: keyof typeof ACT_JOB_STATUSES;
}

/**
 * Options for starting a Task.
 *
 * Similar to {@link ActorStartOptions} but without contentType (Task input is predefined)
 * and forcePermissionLevel.
 */
export type TaskStartOptions = Omit<ActorStartOptions, 'contentType' | 'forcePermissionLevel'>;

/**
 * Options for calling a Task and waiting for it to finish.
 */
export interface TaskCallOptions extends Omit<TaskStartOptions, 'waitForFinish'> {
    waitSecs?: number;
}
