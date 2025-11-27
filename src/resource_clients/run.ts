import type { AxiosRequestConfig } from 'axios';
import ow from 'ow';

import type { RUN_GENERAL_ACCESS } from '@apify/consts';
import { LEVELS, Log } from '@apify/log';

import type { ApiClientOptionsWithOptionalResourcePath } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import type { ApifyResponse } from '../http_client';
import { cast, isNode, parseDateFields, pluckData } from '../utils';
import type { ActorRun } from './actor';
import { DatasetClient } from './dataset';
import { KeyValueStoreClient } from './key_value_store';
import { LogClient, LoggerActorRedirect, StreamedLog } from './log';
import { RequestQueueClient } from './request_queue';

const RUN_CHARGE_IDEMPOTENCY_HEADER = 'idempotency-key';

export class RunClient extends ResourceClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientOptionsWithOptionalResourcePath) {
        super({
            ...options,
            resourcePath: options.resourcePath || 'actor-runs',
        });
    }

    /**
     * Gets the Actor run object from the Apify API.
     *
     * @param options - Get options
     * @param options.waitForFinish - Maximum time to wait (in seconds, max 60s) for the run to finish on the API side before returning. Default is 0 (returns immediately).
     * @returns The ActorRun object, or `undefined` if it does not exist
     * @see https://docs.apify.com/api/v2#/reference/actor-runs/run-object/get-run
     *
     * @example
     * ```javascript
     * // Get run status immediately
     * const run = await client.run('run-id').get();
     * console.log(`Status: ${run.status}`);
     *
     * // Wait up to 60 seconds for run to finish
     * const run = await client.run('run-id').get({ waitForFinish: 60 });
     * ```
     */
    async get(options: RunGetOptions = {}): Promise<ActorRun | undefined> {
        ow(
            options,
            ow.object.exactShape({
                waitForFinish: ow.optional.number,
            }),
        );

        return this._get(options);
    }

    /**
     * Aborts the Actor run.
     *
     * @param options - Abort options
     * @param options.gracefully - If `true`, the Actor run will abort gracefully - it can send status messages and perform cleanup. Default is `false` (immediate abort).
     * @returns The updated ActorRun object with ABORTING or ABORTED status
     * @see https://docs.apify.com/api/v2#/reference/actor-runs/abort-run/abort-run
     *
     * @example
     * ```javascript
     * // Abort immediately
     * await client.run('run-id').abort();
     *
     * // Abort gracefully (allows cleanup)
     * await client.run('run-id').abort({ gracefully: true });
     * ```
     */
    async abort(options: RunAbortOptions = {}): Promise<ActorRun> {
        ow(
            options,
            ow.object.exactShape({
                gracefully: ow.optional.boolean,
            }),
        );

        const response = await this.httpClient.call({
            url: this._url('abort'),
            method: 'POST',
            params: this._params(options),
        });

        return cast(parseDateFields(pluckData(response.data)));
    }

    /**
     * Deletes the Actor run.
     *
     * @see https://docs.apify.com/api/v2#/reference/actor-runs/delete-run/delete-run
     */
    async delete(): Promise<void> {
        return this._delete();
    }

    /**
     * Transforms the Actor run into a run of another Actor (metamorph).
     *
     * This operation preserves the run ID, storages (dataset, key-value store, request queue),
     * and resource allocation. The run effectively becomes a run of the target Actor with new input.
     * This is useful for chaining Actor executions or implementing complex workflows.
     *
     * @param targetActorId - ID or username/name of the target Actor
     * @param input - Input for the target Actor. Can be any JSON-serializable value.
     * @param options - Metamorph options
     * @param options.build - Tag or number of the target Actor's build to run. Default is the target Actor's default build.
     * @param options.contentType - Content type of the input. If specified, input must be a string or Buffer.
     * @returns The metamorphed ActorRun object (same ID, but now running the target Actor)
     * @see https://docs.apify.com/api/v2#/reference/actor-runs/metamorph-run/metamorph-run
     *
     * @example
     * ```javascript
     * // Transform current run into another Actor
     * const metamorphedRun = await client.run('original-run-id').metamorph(
     *   'target-actor-id',
     *   { url: 'https://example.com' }
     * );
     * console.log(`Run ${metamorphedRun.id} is now running ${metamorphedRun.actId}`);
     * ```
     */
    async metamorph(targetActorId: string, input: unknown, options: RunMetamorphOptions = {}): Promise<ActorRun> {
        ow(targetActorId, ow.string);
        // input can be anything, pointless to validate
        ow(
            options,
            ow.object.exactShape({
                contentType: ow.optional.string,
                build: ow.optional.string,
            }),
        );

        const safeTargetActorId = this._toSafeId(targetActorId);

        const params = {
            targetActorId: safeTargetActorId,
            build: options.build,
        };

        const request: AxiosRequestConfig = {
            url: this._url('metamorph'),
            method: 'POST',
            data: input,
            params: this._params(params),
            // Apify internal property. Tells the request serialization interceptor
            // to stringify functions to JSON, instead of omitting them.
            // TODO: remove this ts-expect-error once we have defined custom Apify axios configs
            // @ts-expect-error Custom Apify property
            stringifyFunctions: true,
        };

        if (options.contentType) {
            request.headers = {
                'content-type': options.contentType,
            };
        }

        const response = await this.httpClient.call(request);
        return cast(parseDateFields(pluckData(response.data)));
    }

    /**
     * Reboots the Actor run.
     *
     * Rebooting restarts the Actor's Docker container while preserving the run ID and storages.
     * This can be useful to recover from certain errors or to force the Actor to restart
     * with a fresh environment.
     *
     * @returns The updated ActorRun object
     * @see https://docs.apify.com/api/v2#/reference/actor-runs/reboot-run/reboot-run
     *
     * @example
     * ```javascript
     * const run = await client.run('run-id').reboot();
     * ```
     */
    async reboot(): Promise<ActorRun> {
        const request: AxiosRequestConfig = {
            url: this._url('reboot'),
            method: 'POST',
        };

        const response = await this.httpClient.call(request);
        return cast(parseDateFields(pluckData(response.data)));
    }

    /**
     * Updates the Actor run with specified fields.
     *
     * @param newFields - Fields to update
     * @param newFields.statusMessage - Custom status message to display (e.g., "Processing page 10/100")
     * @param newFields.isStatusMessageTerminal - If `true`, the status message is final and won't be overwritten. Default is `false`.
     * @param newFields.generalAccess - General access level (PUBLIC or PRIVATE)
     * @returns The updated ActorRun object
     *
     * @example
     * ```javascript
     * // Set a status message
     * await client.run('run-id').update({
     *   statusMessage: 'Processing items: 50/100'
     * });
     * ```
     */
    async update(newFields: RunUpdateOptions): Promise<ActorRun> {
        ow(newFields, ow.object);

        return this._update(newFields);
    }

    /**
     * Resurrects a finished Actor run, starting it again with the same settings.
     *
     * This creates a new run with the same configuration as the original run. The original
     * run's storages (dataset, key-value store, request queue) are preserved and reused.
     *
     * @param options - Resurrection options (override original run settings)
     * @param options.build - Tag or number of the build to use. If not provided, uses the original run's build.
     * @param options.memory - Memory in megabytes. If not provided, uses the original run's memory.
     * @param options.timeout - Timeout in seconds. If not provided, uses the original run's timeout.
     * @param options.maxItems - Maximum number of dataset items (pay-per-result Actors).
     * @param options.maxTotalChargeUsd - Maximum cost in USD (pay-per-event Actors).
     * @param options.restartOnError - Whether to restart on error.
     * @returns The new (resurrected) ActorRun object
     * @see https://docs.apify.com/api/v2#/reference/actor-runs/resurrect-run/resurrect-run
     *
     * @example
     * ```javascript
     * // Resurrect a failed run with more memory
     * const newRun = await client.run('failed-run-id').resurrect({ memory: 2048 });
     * console.log(`New run started: ${newRun.id}`);
     * ```
     */
    async resurrect(options: RunResurrectOptions = {}): Promise<ActorRun> {
        ow(
            options,
            ow.object.exactShape({
                build: ow.optional.string,
                memory: ow.optional.number,
                timeout: ow.optional.number,
                maxItems: ow.optional.number,
                maxTotalChargeUsd: ow.optional.number,
                restartOnError: ow.optional.boolean,
            }),
        );

        const response = await this.httpClient.call({
            url: this._url('resurrect'),
            method: 'POST',
            params: this._params(options),
        });

        return cast(parseDateFields(pluckData(response.data)));
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-runs/charge-events-in-run
     */
    async charge(options: RunChargeOptions): Promise<ApifyResponse<Record<string, never>>> {
        ow(
            options,
            ow.object.exactShape({
                eventName: ow.string,
                count: ow.optional.number,
                idempotencyKey: ow.optional.string,
            }),
        );

        const count = options.count ?? 1;
        /** To avoid duplicates during the same milisecond, doesn't need to by crypto-secure. */
        const randomSuffix = (Math.random() + 1).toString(36).slice(3, 8);
        const idempotencyKey =
            options.idempotencyKey ?? `${this.id}-${options.eventName}-${Date.now()}-${randomSuffix}`;

        const request: AxiosRequestConfig = {
            url: this._url('charge'),
            method: 'POST',
            data: {
                eventName: options.eventName,
                count,
            },
            headers: {
                [RUN_CHARGE_IDEMPOTENCY_HEADER]: idempotencyKey,
            },
        };
        const response = await this.httpClient.call(request);
        return response;
    }

    /**
     * Waits for the Actor run to finish and returns the finished Run object.
     *
     * The promise resolves when the run reaches a terminal state (SUCCEEDED, FAILED, ABORTED, or TIMED-OUT).
     * If `waitSecs` is provided and the timeout is reached, the promise resolves with the unfinished
     * Run object (status will be RUNNING or READY). The promise is NOT rejected based on run status.
     *
     * Unlike the `waitForFinish` parameter in {@link get}, this method can wait indefinitely
     * by polling the run status. It uses the `waitForFinish` parameter internally (max 60s per call)
     * and continuously polls until the run finishes or the timeout is reached.
     *
     * @param options - Wait options
     * @param options.waitSecs - Maximum time to wait for the run to finish, in seconds. If omitted, waits indefinitely.
     * @returns The ActorRun object (finished or still running if timeout was reached)
     *
     * @example
     * ```javascript
     * // Wait indefinitely for run to finish
     * const run = await client.run('run-id').waitForFinish();
     * console.log(`Run finished with status: ${run.status}`);
     *
     * // Wait up to 5 minutes
     * const run = await client.run('run-id').waitForFinish({ waitSecs: 300 });
     * if (run.status === 'SUCCEEDED') {
     *   console.log('Run succeeded!');
     * }
     * ```
     */
    async waitForFinish(options: RunWaitForFinishOptions = {}): Promise<ActorRun> {
        ow(
            options,
            ow.object.exactShape({
                waitSecs: ow.optional.number,
            }),
        );

        return this._waitForFinish(options);
    }

    /**
     * Returns a client for the default dataset of this Actor run.
     *
     * @returns A client for accessing the run's default dataset
     * @see https://docs.apify.com/api/v2#/reference/actor-runs/run-object-and-its-storages
     *
     * @example
     * ```javascript
     * // Access run's dataset
     * const { items } = await client.run('run-id').dataset().listItems();
     * ```
     */
    dataset(): DatasetClient {
        return new DatasetClient(
            this._subResourceOptions({
                resourcePath: 'dataset',
            }),
        );
    }

    /**
     * Returns a client for the default key-value store of this Actor run.
     *
     * @returns A client for accessing the run's default key-value store
     * @see https://docs.apify.com/api/v2#/reference/actor-runs/run-object-and-its-storages
     *
     * @example
     * ```javascript
     * // Access run's key-value store
     * const output = await client.run('run-id').keyValueStore().getRecord('OUTPUT');
     * ```
     */
    keyValueStore(): KeyValueStoreClient {
        return new KeyValueStoreClient(
            this._subResourceOptions({
                resourcePath: 'key-value-store',
            }),
        );
    }

    /**
     * Returns a client for the default request queue of this Actor run.
     *
     * @returns A client for accessing the run's default request queue
     * @see https://docs.apify.com/api/v2#/reference/actor-runs/run-object-and-its-storages
     *
     * @example
     * ```javascript
     * // Access run's request queue
     * const { items } = await client.run('run-id').requestQueue().listHead();
     * ```
     */
    requestQueue(): RequestQueueClient {
        return new RequestQueueClient(
            this._subResourceOptions({
                resourcePath: 'request-queue',
            }),
        );
    }

    /**
     * Returns a client for accessing the log of this Actor run.
     *
     * @returns A client for accessing the run's log
     * @see https://docs.apify.com/api/v2#/reference/actor-runs/run-object-and-its-storages
     *
     * @example
     * ```javascript
     * // Get run log
     * const log = await client.run('run-id').log().get();
     * console.log(log);
     * ```
     */
    log(): LogClient {
        return new LogClient(
            this._subResourceOptions({
                resourcePath: 'log',
            }),
        );
    }

    /**
     * Get StreamedLog for convenient streaming of the run log and their redirection.
     */
    async getStreamedLog(options: GetStreamedLogOptions = {}): Promise<StreamedLog | undefined> {
        const { fromStart = true } = options;
        let { toLog } = options;
        if (toLog === null || !isNode()) {
            // Explicitly no logging or not in Node.js
            return undefined;
        }
        if (toLog === undefined || toLog === 'default') {
            // Create default StreamedLog
            // Get actor name and run id
            const runData = await this.get();
            const runId = runData?.id ?? '';

            const actorId = runData?.actId ?? '';
            const actorData = (await this.apifyClient.actor(actorId).get()) || { name: '' };

            const actorName = actorData?.name ?? '';
            const name = [actorName, `runId:${runId}`].filter(Boolean).join(' ');

            toLog = new Log({ level: LEVELS.DEBUG, prefix: `${name} -> `, logger: new LoggerActorRedirect() });
        }

        return new StreamedLog({ logClient: this.log(), toLog, fromStart });
    }
}

/**
 * Options for getting a streamed log.
 */
export interface GetStreamedLogOptions {
    toLog?: Log | null | 'default';
    fromStart?: boolean;
}

/**
 * Options for getting a Run.
 */
export interface RunGetOptions {
    waitForFinish?: number;
}

/**
 * Options for aborting a Run.
 */
export interface RunAbortOptions {
    gracefully?: boolean;
}

/**
 * Options for metamorphing a Run into another Actor.
 */
export interface RunMetamorphOptions {
    contentType?: string;
    build?: string;
}

/**
 * Options for updating a Run.
 */
export interface RunUpdateOptions {
    statusMessage?: string;
    isStatusMessageTerminal?: boolean;
    generalAccess?: RUN_GENERAL_ACCESS | null;
}

/**
 * Options for resurrecting a finished Run.
 */
export interface RunResurrectOptions {
    build?: string;
    memory?: number;
    timeout?: number;
    maxItems?: number;
    maxTotalChargeUsd?: number;
    restartOnError?: boolean;
}

/**
 * Options for charging events in a pay-per-event Actor run.
 */
export interface RunChargeOptions {
    /** Name of the event to charge. Must be defined in the Actor's pricing info else the API will throw. */
    eventName: string;
    /** Defaults to 1 */
    count?: number;
    /** Defaults to runId-eventName-timestamp */
    idempotencyKey?: string;
}

/**
 * Options for waiting for a Run to finish.
 */
export interface RunWaitForFinishOptions {
    /**
     * Maximum time to wait for the run to finish, in seconds.
     * If the limit is reached, the returned promise is resolved to a run object that will have
     * status `READY` or `RUNNING`. If `waitSecs` omitted, the function waits indefinitely.
     */
    waitSecs?: number;
}
