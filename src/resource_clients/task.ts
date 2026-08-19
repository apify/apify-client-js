import { z } from 'zod';

import { ACT_JOB_STATUSES, META_ORIGINS } from '@apify/consts';

import type { ApifyApiError } from '../apify_api_error';
import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import type { ApifyRequestConfig } from '../http_client';
import type { Dictionary } from '../utils';
import {
    anyObjectSchema,
    cast,
    catchNotFoundOrThrow,
    parseDateFields,
    pluckData,
    stringifyWebhooksToBase64,
    validate,
} from '../utils';
import type { ActorLastRunOptions, ActorRun, ActorStandby, ActorStartOptions } from './actor';
import { RunClient } from './run';
import { RunCollectionClient } from './run_collection';
import { WebhookCollectionClient } from './webhook_collection';

const inputSchema = anyObjectSchema.optional();
const startOptionsSchema = z.strictObject({
    build: z.string().optional(),
    memory: z.number().optional(),
    timeout: z.number().optional(),
    waitForFinish: z.number().optional(),
    webhooks: z.array(anyObjectSchema).optional(),
    maxItems: z.number().min(0).optional(),
    maxTotalChargeUsd: z.number().min(0).optional(),
    restartOnError: z.boolean().optional(),
});
const callOptionsSchema = z.strictObject({
    build: z.string().optional(),
    memory: z.number().optional(),
    timeout: z.number().min(0).optional(),
    waitSecs: z.number().min(0).optional(),
    webhooks: z.array(anyObjectSchema).optional(),
    maxItems: z.number().min(0).optional(),
    maxTotalChargeUsd: z.number().min(0).optional(),
    restartOnError: z.boolean().optional(),
});
const lastRunOptionsSchema = z.strictObject({
    status: z.enum(ACT_JOB_STATUSES).optional(),
    origin: z.enum(META_ORIGINS).optional(),
});

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
        validate(anyObjectSchema, newFields);

        return this._update(newFields);
    }

    /**
     * Publishes the task on its public landing page, by setting `isPublic` through
     * {@apilink TaskClient.update}.
     *
     * The task's Actor must be public and the task must have its public display configuration
     * (`publicConfig`) set up first. Requires write permission to both the task and its Actor.
     * Publishing an already published task does nothing.
     *
     * @returns The task object.
     * @see https://docs.apify.com/api/v2/actor-task-put
     * @since Added in 2.25.0
     */
    async publish(): Promise<Task> {
        return this.update({ isPublic: true });
    }

    /**
     * Unpublishes the task from its public landing page, by setting `isPublic` through
     * {@apilink TaskClient.update}.
     *
     * The public display configuration (`publicConfig`) is preserved, so the task can be
     * published again without re-entering it. Requires write permission to both the task and its
     * Actor. Unpublishing a task that is not published does nothing.
     *
     * @returns The task object.
     * @see https://docs.apify.com/api/v2/actor-task-put
     * @since Added in 2.25.0
     */
    async unpublish(): Promise<Task> {
        return this.update({ isPublic: false });
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
        validate(inputSchema, input);
        validate(startOptionsSchema, options);

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
        validate(inputSchema, input);
        validate(callOptionsSchema, options);

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
        validate(lastRunOptionsSchema, options);

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
    /**
     * @since Added in 2.6.1
     */
    title?: string;
    description?: string;
    username?: string;
    createdAt: Date;
    modifiedAt: Date;
    stats: TaskStats;
    options?: TaskOptions;
    input?: Dictionary | Dictionary[];
    /**
     * @since Added in 2.9.5
     */
    actorStandby?: Partial<ActorStandby>;
    /**
     * Whether the task is published on its public landing page. Derived from
     * `publicConfig.publishedAt` — set it on update to publish or unpublish the task.
     * @since Added in 2.25.0
     */
    isPublic?: boolean;
    /**
     * @since Added in 2.25.0
     */
    publicConfig?: TaskPublicConfig | null;
}

/**
 * Public-facing display configuration of a task's public landing page.
 *
 * The task is published when `publishedAt` is set and unpublished when it is `null`. The
 * `publishedAt` field is read-only - use {@apilink TaskClient.publish} and
 * {@apilink TaskClient.unpublish} to change the publication state.
 * @since Added in 2.25.0
 */
export interface TaskPublicConfig {
    publishedAt: Date | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    categorization?: string | null;
    inputSchemaFields?: string[] | null;
    datasetName?: string | null;
    datasetView?: string | null;
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
    /**
     * @since Added in 2.19.0
     */
    restartOnError?: boolean;
}

/**
 * Fields that can be updated when modifying a Task.
 */
export type TaskUpdateData = Partial<
    Pick<Task, 'name' | 'title' | 'description' | 'options' | 'input' | 'actorStandby' | 'isPublic'>
> & { publicConfig?: Omit<TaskPublicConfig, 'publishedAt'> };

/**
 * Options for filtering the last run of a Task.
 */
export interface TaskLastRunOptions extends ActorLastRunOptions {}

/**
 * Options for starting a Task.
 *
 * Similar to {@link ActorStartOptions} but without contentType (Task input is predefined)
 * and forcePermissionLevel.
 * @since Added in 2.0.4
 */
export type TaskStartOptions = Omit<ActorStartOptions, 'contentType' | 'forcePermissionLevel'>;

/**
 * Options for calling a Task and waiting for it to finish.
 * @since Added in 2.6.2
 */
export interface TaskCallOptions extends Omit<TaskStartOptions, 'waitForFinish'> {
    waitSecs?: number;
}
