import { ACT_JOB_TERMINAL_STATUSES } from '@apify/consts';
import ow from 'ow';

import { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import {
    cast,
    parseDateFields,
    pluckData,
} from '../utils';

export class BuildClient extends ResourceClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'actor-builds',
            ...options,
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-builds/build-object/get-build
     */
    async get(options: BuildClientGetOptions = {}): Promise<Build | undefined> {
        ow(options, ow.object.exactShape({
            waitForFinish: ow.optional.number,
        }));

        return this._get(options);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-builds/abort-build/abort-build
     */
    async abort(): Promise<Build> {
        const response = await this.httpClient.call({
            url: this._url('abort'),
            method: 'POST',
            params: this._params(),
        });

        return cast(parseDateFields(pluckData(response.data)));
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-builds/delete-build/delete-build
     */
    async delete(): Promise<void> {
        return this._delete();
    }

    /**
     * Returns a promise that resolves with the finished Build object when the provided actor build finishes
     * or with the unfinished Build object when the `waitSecs` timeout lapses. The promise is NOT rejected
     * based on run status. You can inspect the `status` property of the Build object to find out its status.
     *
     * The difference between this function and the `waitForFinish` parameter of the `get` method
     * is the fact that this function can wait indefinitely. Its use is preferable to the
     * `waitForFinish` parameter alone, which it uses internally.
     *
     * This is useful when you need to immediately start a run after a build finishes.
     */
    async waitForFinish(options: BuildClientWaitForFinishOptions = {}): Promise<Build> {
        ow(options, ow.object.exactShape({
            waitSecs: ow.optional.number,
        }));

        return this._waitForFinish(options);
    }
}

export interface BuildClientGetOptions {
    waitForFinish?: number
}

export interface BuildClientWaitForFinishOptions {
    /**
     * Maximum time to wait for the build to finish, in seconds.
     * If the limit is reached, the returned promise is resolved to a build object that will have
     * status `READY` or `RUNNING`. If `waitSecs` omitted, the function waits indefinitely.
     */
    waitSecs?: number;
}

export interface BuildMeta {
    origin: string;
    clientIp: string;
    userAgent: string;
}

export interface Build {
    id: string;
    actId: string;
    userId: string;
    startedAt: Date;
    finishedAt?: Date;
    status: typeof ACT_JOB_TERMINAL_STATUSES[number];
    meta: BuildMeta;
    stats?: BuildStats;
    options?: BuildOptions;
    inputSchema?: string;
    readme?: string;
    buildNumber: string;
    usage?: BuildUsage;
    usageTotalUsd?: number;
    usageUsd?: BuildUsage;
}

export interface BuildUsage {
    ACTOR_COMPUTE_UNITS?: number;
}

export interface BuildStats {
    durationMillis: number;
    runTimeSecs: number;
    computeUnits: number;
}

export interface BuildOptions {
    useCache?: boolean;
    betaPackages?: boolean;
    memoryMbytes?: number;
    diskMbytes?: number;
}
