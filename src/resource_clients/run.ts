import { AxiosRequestConfig } from 'axios';
import ow from 'ow';

import { ActorRun } from './actor';
import { DatasetClient } from './dataset';
import { KeyValueStoreClient } from './key_value_store';
import { LogClient } from './log';
import { RequestQueueClient } from './request_queue';
import { ApiClientOptionsWithOptionalResourcePath } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import {
    pluckData,
    parseDateFields,
    cast,
} from '../utils';

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
        ow(options, ow.object.exactShape({
            waitForFinish: ow.optional.number,
        }));

        return this._get(options);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-runs/abort-run/abort-run
     */
    async abort(options: RunAbortOptions = {}): Promise<ActorRun> {
        ow(options, ow.object.exactShape({
            gracefully: ow.optional.boolean,
        }));

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
        ow(options, ow.object.exactShape({
            contentType: ow.optional.string,
            build: ow.optional.string,
        }));

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

    async update(newFields: RunUpdateOptions) : Promise<ActorRun> {
        ow(newFields, ow.object);

        return this._update(newFields);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-runs/resurrect-run/resurrect-run
     */
    async resurrect(options: RunResurrectOptions = {}): Promise<ActorRun> {
        ow(options, ow.object.exactShape({
            build: ow.optional.string,
            memory: ow.optional.number,
            timeout: ow.optional.number,
        }));

        const response = await this.httpClient.call({
            url: this._url('resurrect'),
            method: 'POST',
            params: this._params(options),
        });

        return cast(parseDateFields(pluckData(response.data)));
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
        ow(options, ow.object.exactShape({
            waitSecs: ow.optional.number,
        }));

        return this._waitForFinish(options);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-runs/run-object-and-its-storages
     *
     * This also works through `actorClient.lastRun().dataset()`.
     * https://docs.apify.com/api/v2#/reference/actors/last-run-object-and-its-storages
     */
    dataset(): DatasetClient {
        return new DatasetClient(this._subResourceOptions({
            resourcePath: 'dataset',
        }));
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-runs/run-object-and-its-storages
     *
     * This also works through `actorClient.lastRun().keyValueStore()`.
     * https://docs.apify.com/api/v2#/reference/actors/last-run-object-and-its-storages
     */
    keyValueStore(): KeyValueStoreClient {
        return new KeyValueStoreClient(this._subResourceOptions({
            resourcePath: 'key-value-store',
        }));
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-runs/run-object-and-its-storages
     *
     * This also works through `actorClient.lastRun().requestQueue()`.
     * https://docs.apify.com/api/v2#/reference/actors/last-run-object-and-its-storages
     */
    requestQueue(): RequestQueueClient {
        return new RequestQueueClient(this._subResourceOptions({
            resourcePath: 'request-queue',
        }));
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-runs/run-object-and-its-storages
     *
     * This also works through `actorClient.lastRun().log()`.
     * https://docs.apify.com/api/v2#/reference/actors/last-run-object-and-its-storages
     */
    log(): LogClient {
        return new LogClient(this._subResourceOptions({
            resourcePath: 'log',
        }));
    }
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
    isStatusMessageTerminal? : boolean;
}

export interface RunResurrectOptions {
    build?: string;
    memory?: number;
    timeout?: number;
}

export interface RunWaitForFinishOptions {
    /**
     * Maximum time to wait for the run to finish, in seconds.
     * If the limit is reached, the returned promise is resolved to a run object that will have
     * status `READY` or `RUNNING`. If `waitSecs` omitted, the function waits indefinitely.
     */
    waitSecs?: number;
}
