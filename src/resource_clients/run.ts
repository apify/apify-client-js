import type { AxiosRequestConfig } from 'axios';
import ow from 'ow';

import type { RUN_GENERAL_ACCESS } from '@apify/consts';
import { LEVELS, Log } from '@apify/log';

import type { ApiClientOptionsWithOptionalResourcePath } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import type { ApifyResponse } from '../http_client';
import { cast, parseDateFields, pluckData } from '../utils';
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
     * https://docs.apify.com/api/v2#/reference/actor-runs/run-object/get-run
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
     * https://docs.apify.com/api/v2#/reference/actor-runs/abort-run/abort-run
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
     * https://docs.apify.com/api/v2#/reference/actor-runs/delete-run/delete-run
     */
    async delete(): Promise<void> {
        return this._delete();
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-runs/metamorph-run/metamorph-run
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
     * https://docs.apify.com/api/v2#/reference/actor-runs/reboot-run/reboot-run
     */
    async reboot(): Promise<ActorRun> {
        const request: AxiosRequestConfig = {
            url: this._url('reboot'),
            method: 'POST',
        };

        const response = await this.httpClient.call(request);
        return cast(parseDateFields(pluckData(response.data)));
    }

    async update(newFields: RunUpdateOptions): Promise<ActorRun> {
        ow(newFields, ow.object);

        return this._update(newFields);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-runs/resurrect-run/resurrect-run
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
     * Returns a promise that resolves with the finished Run object when the provided actor run finishes
     * or with the unfinished Run object when the `waitSecs` timeout lapses. The promise is NOT rejected
     * based on run status. You can inspect the `status` property of the Run object to find out its status.
     *
     * The difference between this function and the `waitForFinish` parameter of the `get` method
     * is the fact that this function can wait indefinitely. Its use is preferable to the
     * `waitForFinish` parameter alone, which it uses internally.
     *
     * This is useful when you need to chain actor executions. Similar effect can be achieved
     * by using webhooks, so be sure to review which technique fits your use-case better.
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
     * https://docs.apify.com/api/v2#/reference/actor-runs/run-object-and-its-storages
     *
     * This also works through `actorClient.lastRun().dataset()`.
     * https://docs.apify.com/api/v2#/reference/actors/last-run-object-and-its-storages
     */
    dataset(): DatasetClient {
        return new DatasetClient(
            this._subResourceOptions({
                resourcePath: 'dataset',
            }),
        );
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-runs/run-object-and-its-storages
     *
     * This also works through `actorClient.lastRun().keyValueStore()`.
     * https://docs.apify.com/api/v2#/reference/actors/last-run-object-and-its-storages
     */
    keyValueStore(): KeyValueStoreClient {
        return new KeyValueStoreClient(
            this._subResourceOptions({
                resourcePath: 'key-value-store',
            }),
        );
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-runs/run-object-and-its-storages
     *
     * This also works through `actorClient.lastRun().requestQueue()`.
     * https://docs.apify.com/api/v2#/reference/actors/last-run-object-and-its-storages
     */
    requestQueue(): RequestQueueClient {
        return new RequestQueueClient(
            this._subResourceOptions({
                resourcePath: 'request-queue',
            }),
        );
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-runs/run-object-and-its-storages
     *
     * This also works through `actorClient.lastRun().log()`.
     * https://docs.apify.com/api/v2#/reference/actors/last-run-object-and-its-storages
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
    async getStreamedLog(options: GetStreamedLogOptions = {}): Promise<StreamedLog> {
        const { fromStart = true } = options;
        let { toLog } = options;
        if (!toLog) {
            // Get actor name and run id
            const runData = await this.get();
            const runId = runData ? `${runData.id ?? ''}` : '';

            const actorId = runData?.actId ?? '';
            const actorData = (await this.apifyClient.actor(actorId).get()) || { name: '' };

            const actorName = runData ? (actorData.name ?? '') : '';
            const name = [actorName, `runId:${runId}`].filter(Boolean).join(' ');

            toLog = new Log({ level: LEVELS.DEBUG, prefix: `${name} -> `, logger: new LoggerActorRedirect() });
        }

        return new StreamedLog(this.log(), toLog, fromStart);
    }
}

export interface GetStreamedLogOptions {
    toLog?: Log;
    fromStart?: boolean;
}

export interface RunGetOptions {
    waitForFinish?: number;
}

export interface RunAbortOptions {
    gracefully?: boolean;
}

export interface RunMetamorphOptions {
    contentType?: string;
    build?: string;
}
export interface RunUpdateOptions {
    statusMessage?: string;
    isStatusMessageTerminal?: boolean;
    generalAccess?: RUN_GENERAL_ACCESS | null;
}

export interface RunResurrectOptions {
    build?: string;
    memory?: number;
    timeout?: number;
    maxItems?: number;
    maxTotalChargeUsd?: number;
    restartOnError?: boolean;
}

export interface RunChargeOptions {
    /** Name of the event to charge. Must be defined in the Actor's pricing info else the API will throw. */
    eventName: string;
    /** Defaults to 1 */
    count?: number;
    /** Defaults to runId-eventName-timestamp */
    idempotencyKey?: string;
}

export interface RunWaitForFinishOptions {
    /**
     * Maximum time to wait for the run to finish, in seconds.
     * If the limit is reached, the returned promise is resolved to a run object that will have
     * status `READY` or `RUNNING`. If `waitSecs` omitted, the function waits indefinitely.
     */
    waitSecs?: number;
}
