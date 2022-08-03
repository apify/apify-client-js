import { ACT_JOB_STATUSES, META_ORIGINS } from '@apify/consts';
import { AxiosRequestConfig } from 'axios';
import ow from 'ow';
import { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import {
    cast,
    parseDateFields,
    pluckData,
    stringifyWebhooksToBase64,
} from '../utils';
import { ActorVersion, ActorVersionClient } from './actor_version';
import { ActorVersionCollectionClient } from './actor_version_collection';
import { Build } from './build';
import { BuildCollectionClient } from './build_collection';
import { RunClient } from './run';
import { RunCollectionClient } from './run_collection';
import { WebhookUpdateData } from './webhook';
import { WebhookCollectionClient } from './webhook_collection';

/**
 * @hideconstructor
 */
export class ActorClient extends ResourceClient {
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'acts',
            ...options,
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/actor-object/get-actor
     */
    async get(): Promise<Actor | undefined> {
        return this._get();
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/actor-object/update-actor
     */
    async update(newFields: ActorUpdateOptions): Promise<Actor> {
        ow(newFields, ow.object);

        return this._update(newFields);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/actor-object/delete-actor
     */
    async delete(): Promise<void> {
        return this._delete();
    }

    /**
     * Starts an actor and immediately returns the Run object.
     * https://docs.apify.com/api/v2#/reference/actors/run-collection/run-actor
     */
    async start(input?: unknown, options: ActorStartOptions = {}): Promise<ActorRun> {
        // input can be anything, so no point in validating it. E.g. if you set content-type to application/pdf
        // then it will process input as a buffer.
        ow(options, ow.object.exactShape({
            build: ow.optional.string,
            contentType: ow.optional.string,
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

        const request: AxiosRequestConfig = {
            url: this._url('runs'),
            method: 'POST',
            data: input,
            params: this._params(params),
            // Apify internal property. Tells the request serialization interceptor
            // to stringify functions to JSON, instead of omitting them.
            // TODO: remove this ts-expect-error once we migrate HttpClient to TS and define Apify
            // extension of Axios configs
            // @ts-expect-error Apify extension
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
     * Starts an actor and waits for it to finish before returning the Run object.
     * It waits indefinitely, unless the `waitSecs` option is provided.
     * https://docs.apify.com/api/v2#/reference/actors/run-collection/run-actor
     */
    async call(input?: unknown, options: ActorStartOptions = {}): Promise<ActorRun> {
        // input can be anything, so no point in validating it. E.g. if you set content-type to application/pdf
        // then it will process input as a buffer.
        ow(options, ow.object.exactShape({
            build: ow.optional.string,
            contentType: ow.optional.string,
            memory: ow.optional.number,
            timeout: ow.optional.number.not.negative,
            waitSecs: ow.optional.number.not.negative,
            webhooks: ow.optional.array.ofType(ow.object),
        }));

        const { waitSecs, ...startOptions } = options;
        const { id } = await this.start(input, startOptions);

        // Calling root client because we need access to top level API.
        // Creating a new instance of RunClient here would only allow
        // setting it up as a nested route under actor API.
        return this.apifyClient.run(id).waitForFinish({ waitSecs });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/build-collection/build-actor
     * @return {Promise<Build>}
     */
    async build(versionNumber: string, options: ActorBuildOptions = {}): Promise<Build> {
        ow(versionNumber, ow.string);
        ow(options, ow.object.exactShape({
            betaPackages: ow.optional.boolean,
            tag: ow.optional.string,
            useCache: ow.optional.boolean,
            waitForFinish: ow.optional.number,
        }));

        const response = await this.httpClient.call({
            url: this._url('builds'),
            method: 'POST',
            params: this._params({
                version: versionNumber,
                ...options,
            }),
        });

        return cast(parseDateFields(pluckData(response.data)));
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/last-run-object-and-its-storages
     */
    lastRun(options: ActorLastRunOptions = {}): RunClient {
        ow(options, ow.object.exactShape({
            status: ow.optional.string.oneOf(Object.values(ACT_JOB_STATUSES)),
            origin: ow.optional.string.oneOf(Object.values(META_ORIGINS)),
        }));

        return new RunClient(this._subResourceOptions({
            id: 'last',
            params: this._params(options),
            resourcePath: 'runs',
        }));
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/build-collection
     */
    builds(): BuildCollectionClient {
        return new BuildCollectionClient(this._subResourceOptions({
            resourcePath: 'builds',
        }));
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/run-collection
     */
    runs(): RunCollectionClient {
        return new RunCollectionClient(this._subResourceOptions({
            resourcePath: 'runs',
        }));
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/version-object
     */
    version(versionNumber: string): ActorVersionClient {
        ow(versionNumber, ow.string);
        return new ActorVersionClient(this._subResourceOptions({
            id: versionNumber,
        }));
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/version-collection
     * @return {ActorVersionCollectionClient}
     */
    versions(): ActorVersionCollectionClient {
        return new ActorVersionCollectionClient(this._subResourceOptions());
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/webhook-collection
     * @return {WebhookCollectionClient}
     */
    webhooks(): WebhookCollectionClient {
        return new WebhookCollectionClient(this._subResourceOptions());
    }
}

export interface Actor {
    id: string;
    userId: string;
    name: string;
    username: string;
    description?: string;
    restartOnError?: boolean;
    isPublic: boolean;
    isAnonymouslyRunnable?: boolean;
    createdAt: Date;
    modifiedAt: Date;
    stats: ActorStats;
    versions: ActorVersion[];
    defaultRunOptions: ActorDefaultRunOptions;
    exampleRunInput?: ActorExampleRunInput;
    isDeprecated?: boolean;
    deploymentKey: string;
    title?: string;
    taggedBuilds?: ActorTaggedBuilds;
    issuesEnabled?: boolean;
    seoTitle?: string;
    seoDescription?: string;
    categories?: string[];
}

export interface ActorStats {
    totalBuilds: number;
    totalRuns: number;
    totalUsers: number;
    totalUsers7Days: number;
    totalUsers30Days: number;
    totalUsers90Days: number;
    totalMetamorphs: number;
    lastRunStartedAt: Date;
}

export interface ActorDefaultRunOptions {
    build: string;
    timeoutSecs: number;
    memoryMbytes: number;
}

export interface ActorExampleRunInput {
    body: string;
    contentType: string;
}

export interface ActorTaggedBuilds {
    latest: ActorTaggedBuild;
}

export interface ActorTaggedBuild {
    buildId?: string;
    buildNumber?: string;
    finishedAt?: Date;
}

export type ActorUpdateOptions = Pick<
    Actor,
    | 'name'
    | 'description'
    | 'isPublic'
    | 'seoTitle'
    | 'seoDescription'
    | 'issuesEnabled'
    | 'title'
    | 'restartOnError'
    | 'versions'
    | 'categories'
    | 'defaultRunOptions'
    >

export interface ActorStartOptions {
    /**
     * Tag or number of the actor build to run (e.g. `beta` or `1.2.345`).
     * If not provided, the run uses build tag or number from the default actor run configuration (typically `latest`).
     */
    build?: string;

    /**
     * Content type for the `input`. If not specified,
     * `input` is expected to be an object that will be stringified to JSON and content type set to
     * `application/json; charset=utf-8`. If `options.contentType` is specified, then `input` must be a
     * `String` or `Buffer`.
     */
    contentType?: string;

    /**
     * Memory in megabytes which will be allocated for the new actor run.
     * If not provided, the run uses memory of the default actor run configuration.
     */
    memory?: number;
    /**
     * Timeout for the actor run in seconds. Zero value means there is no timeout.
     * If not provided, the run uses timeout of the default actor run configuration.
     */
    timeout?: number;

    /**
     * Maximum time to wait for the actor run to finish, in seconds.
     * If the limit is reached, the returned promise is resolved to a run object that will have
     * status `READY` or `RUNNING` and it will not contain the actor run output.
     * If `waitSecs` is null or undefined, the function waits for the actor to finish (default behavior).
     */
    waitForFinish?: number;

    /**
     * Specifies optional webhooks associated with the actor run, which can be used
     * to receive a notification e.g. when the actor finished or failed, see
     * [ad hook webhooks documentation](https://docs.apify.com/webhooks/ad-hoc-webhooks) for detailed description.
     */
    webhooks?: readonly WebhookUpdateData[];
}

export interface ActorRun {
    id: string;
    actId: string;
    userId: string;
    actorTaskId?: string;
    startedAt: Date;
    finishedAt: Date;
    status: typeof ACT_JOB_STATUSES[keyof typeof ACT_JOB_STATUSES];
    statusMessage?: string;
    meta: ActorRunMeta;
    stats: ActorRunStats;
    options: ActorRunOptions;
    buildId: string;
    exitCode?: number;
    defaultKeyValueStoreId: string;
    defaultDatasetId: string;
    buildNumber: string;
    containerUrl: string;
}

export interface ActorRunMeta {
    origin: string;
    clientIp?: string;
    userAgent: string;
}

export interface ActorRunStats {
    inputBodyLen: number;
    restartCount: number;
    resurrectCount: number;
    memAvgBytes: number;
    memMaxBytes: number;
    memCurrentBytes: number;
    cpuAvgUsage: number;
    cpuMaxUsage: number;
    cpuCurrentUsage: number;
    netRxBytes: number;
    netTxBytes: number;
    durationMillis: number;
    runTimeSecs: number;
    metamorph: number;
    computeUnits: number;
}

export interface ActorRunOptions {
    build: string;
    timeoutSecs: number;
    memoryMbytes: number;
    diskMbytes: number;
}

export interface ActorBuildOptions {
    betaPackages?: boolean;
    tag?: string;
    useCache?: boolean;
    waitForFinish?: number;
}

export interface ActorLastRunOptions {
    status?: keyof typeof ACT_JOB_STATUSES;
}
