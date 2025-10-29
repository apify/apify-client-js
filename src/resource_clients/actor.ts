import type { AxiosRequestConfig } from 'axios';
import ow from 'ow';

import type { RUN_GENERAL_ACCESS } from '@apify/consts';
import { ACT_JOB_STATUSES, ACTOR_PERMISSION_LEVEL, META_ORIGINS } from '@apify/consts';
import { Log } from '@apify/log';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import { cast, parseDateFields, pluckData, stringifyWebhooksToBase64 } from '../utils';
import type { ActorVersion } from './actor_version';
import { ActorVersionClient } from './actor_version';
import { ActorVersionCollectionClient } from './actor_version_collection';
import type { Build, BuildClientGetOptions } from './build';
import { BuildClient } from './build';
import { BuildCollectionClient } from './build_collection';
import { RunClient } from './run';
import { RunCollectionClient } from './run_collection';
import type { WebhookUpdateData } from './webhook';
import { WebhookCollectionClient } from './webhook_collection';

export class ActorClient extends ResourceClient {
    /**
     * @hidden
     */
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
        ow(
            options,
            ow.object.exactShape({
                build: ow.optional.string,
                contentType: ow.optional.string,
                memory: ow.optional.number,
                timeout: ow.optional.number,
                waitForFinish: ow.optional.number,
                webhooks: ow.optional.array.ofType(ow.object),
                maxItems: ow.optional.number.not.negative,
                maxTotalChargeUsd: ow.optional.number.not.negative,
                restartOnError: ow.optional.boolean,
                forcePermissionLevel: ow.optional.string.oneOf(Object.values(ACTOR_PERMISSION_LEVEL)),
            }),
        );

        const {
            waitForFinish,
            timeout,
            memory,
            build,
            maxItems,
            maxTotalChargeUsd,
            restartOnError,
            forcePermissionLevel,
        } = options;

        const params = {
            waitForFinish,
            timeout,
            memory,
            build,
            webhooks: stringifyWebhooksToBase64(options.webhooks),
            maxItems,
            maxTotalChargeUsd,
            restartOnError,
            forcePermissionLevel,
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
    async call(input?: unknown, options: ActorCallOptions = {}): Promise<ActorRun> {
        // input can be anything, so no point in validating it. E.g. if you set content-type to application/pdf
        // then it will process input as a buffer.
        ow(
            options,
            ow.object.exactShape({
                build: ow.optional.string,
                contentType: ow.optional.string,
                memory: ow.optional.number,
                timeout: ow.optional.number.not.negative,
                waitSecs: ow.optional.number.not.negative,
                webhooks: ow.optional.array.ofType(ow.object),
                maxItems: ow.optional.number.not.negative,
                maxTotalChargeUsd: ow.optional.number.not.negative,
                log: ow.optional.any(ow.null, ow.object.instanceOf(Log)),
                restartOnError: ow.optional.boolean,
                forcePermissionLevel: ow.optional.string.oneOf(Object.values(ACTOR_PERMISSION_LEVEL)),
            }),
        );

        const { waitSecs, log, ...startOptions } = options;
        const { id } = await this.start(input, startOptions);

        // Calling root client because we need access to top level API.
        // Creating a new instance of RunClient here would only allow
        // setting it up as a nested route under actor API.
        const newRunClient = this.apifyClient.run(id);

        const streamedLog = await newRunClient.getStreamedLog({ toLog: options?.log });
        let streamingPromise: Promise<void> | undefined;
        try {
            streamingPromise = streamedLog?.start();
            return this.apifyClient.run(id).waitForFinish({ waitSecs });
        } finally {
            await streamedLog?.stop();
            await streamingPromise;
        }
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/build-collection/build-actor
     * @return {Promise<Build>}
     */
    async build(versionNumber: string, options: ActorBuildOptions = {}): Promise<Build> {
        ow(versionNumber, ow.string);
        ow(
            options,
            ow.object.exactShape({
                betaPackages: ow.optional.boolean,
                tag: ow.optional.string,
                useCache: ow.optional.boolean,
                waitForFinish: ow.optional.number,
            }),
        );

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
     * https://docs.apify.com/api/v2/act-build-default-get
     */
    async defaultBuild(options: BuildClientGetOptions = {}): Promise<BuildClient> {
        const response = await this.httpClient.call({
            url: this._url('builds/default'),
            method: 'GET',
            params: this._params(options),
        });

        const { id } = pluckData<Build>(response.data);

        return new BuildClient({
            baseUrl: this.apifyClient.baseUrl,
            publicBaseUrl: this.apifyClient.publicBaseUrl,
            httpClient: this.httpClient,
            apifyClient: this.apifyClient,
            id,
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/last-run-object-and-its-storages
     */
    lastRun(options: ActorLastRunOptions = {}): RunClient {
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
     * https://docs.apify.com/api/v2#/reference/actors/build-collection
     */
    builds(): BuildCollectionClient {
        return new BuildCollectionClient(
            this._subResourceOptions({
                resourcePath: 'builds',
            }),
        );
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/run-collection
     */
    runs(): RunCollectionClient {
        return new RunCollectionClient(
            this._subResourceOptions({
                resourcePath: 'runs',
            }),
        );
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/version-object
     */
    version(versionNumber: string): ActorVersionClient {
        ow(versionNumber, ow.string);
        return new ActorVersionClient(
            this._subResourceOptions({
                id: versionNumber,
            }),
        );
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
    /** @deprecated Use defaultRunOptions.restartOnError instead */
    restartOnError?: boolean;
    isPublic: boolean;
    isAnonymouslyRunnable?: boolean;
    createdAt: Date;
    modifiedAt: Date;
    stats: ActorStats;
    versions: ActorVersion[];
    pricingInfos?: ActorRunPricingInfo[];
    defaultRunOptions: ActorDefaultRunOptions;
    exampleRunInput?: ActorExampleRunInput;
    isDeprecated?: boolean;
    deploymentKey: string;
    title?: string;
    taggedBuilds?: ActorTaggedBuilds;
    seoTitle?: string;
    seoDescription?: string;
    categories?: string[];
    actorStandby?: ActorStandby & {
        isEnabled: boolean;
    };
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
    restartOnError?: boolean;
}

export interface ActorExampleRunInput {
    body: string;
    contentType: string;
}

export type ActorTaggedBuilds = Record<string, ActorTaggedBuild>;

export interface ActorTaggedBuild {
    buildId?: string;
    buildNumber?: string;
    finishedAt?: Date;
}

export type ActorUpdateOptions = Partial<
    Pick<
        Actor,
        | 'name'
        | 'description'
        | 'isPublic'
        | 'isDeprecated'
        | 'seoTitle'
        | 'seoDescription'
        | 'title'
        | 'restartOnError'
        | 'versions'
        | 'categories'
        | 'defaultRunOptions'
        | 'actorStandby'
    >
>;

export interface ActorStandby {
    desiredRequestsPerActorRun: number;
    maxRequestsPerActorRun: number;
    idleTimeoutSecs: number;
    build: string;
    memoryMbytes: number;
}

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
     * By default (or when `waitForFinish` is set to `0`), the function resolves immediately without waiting.
     * The wait is limited to 60s and happens on the API directly, as opposed to the `call` method and its
     * `waitSecs` option, which is implemented via polling on the client side instead (and has no limit like that).
     */
    waitForFinish?: number;

    /**
     * Specifies optional webhooks associated with the actor run, which can be used
     * to receive a notification e.g. when the actor finished or failed, see
     * [ad hook webhooks documentation](https://docs.apify.com/webhooks/ad-hoc-webhooks) for detailed description.
     */
    webhooks?: readonly WebhookUpdateData[];

    /**
     * Specifies maximum number of items that the actor run should return.
     * This is used by pay per result actors to limit the maximum number of results that will be charged to customer.
     * Value can be accessed in actor run using `ACTOR_MAX_PAID_DATASET_ITEMS` environment variable.
     */
    maxItems?: number;

    /**
     * Determines whether the run will be restarted if it fails.
     */
    restartOnError?: boolean;

    // TODO(PPE): add maxTotalChargeUsd after finished

    /**
     * Override the Actor's permissions for this run. If not set, the Actor will run with permissions configured in the
     * Actor settings.
     */
    forcePermissionLevel?: ACTOR_PERMISSION_LEVEL;
}

export interface ActorCallOptions extends Omit<ActorStartOptions, 'waitForFinish'> {
    waitSecs?: number;
    log?: Log | null;
}

export interface ActorRunListItem {
    id: string;
    actId: string;
    actorTaskId?: string;
    startedAt: Date;
    finishedAt: Date;
    status: (typeof ACT_JOB_STATUSES)[keyof typeof ACT_JOB_STATUSES];
    meta: ActorRunMeta;
    buildId: string;
    buildNumber: string;
    defaultKeyValueStoreId: string;
    defaultDatasetId: string;
    defaultRequestQueueId: string;
    usageTotalUsd?: number;
}

export interface ActorRun extends ActorRunListItem {
    userId: string;
    statusMessage?: string;
    stats: ActorRunStats;
    options: ActorRunOptions;
    exitCode?: number;
    containerUrl: string;
    isContainerServerReady?: boolean;
    gitBranchName?: string;
    usage?: ActorRunUsage;
    usageUsd?: ActorRunUsage;
    pricingInfo?: ActorRunPricingInfo;
    chargedEventCounts?: Record<string, number>;
    generalAccess?: RUN_GENERAL_ACCESS | null;
}

export interface ActorRunUsage {
    ACTOR_COMPUTE_UNITS?: number;
    DATASET_READS?: number;
    DATASET_WRITES?: number;
    KEY_VALUE_STORE_READS?: number;
    KEY_VALUE_STORE_WRITES?: number;
    KEY_VALUE_STORE_LISTS?: number;
    REQUEST_QUEUE_READS?: number;
    REQUEST_QUEUE_WRITES?: number;
    DATA_TRANSFER_INTERNAL_GBYTES?: number;
    DATA_TRANSFER_EXTERNAL_GBYTES?: number;
    PROXY_RESIDENTIAL_TRANSFER_GBYTES?: number;
    PROXY_SERPS?: number;
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
    maxTotalChargeUsd?: number;
    restartOnError?: boolean;
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

export interface ActorDefinition {
    actorSpecification: number;
    name: string;
    version: string;
    buildTag?: string;
    environmentVariables?: Record<string, string>;
    dockerfile?: string;
    dockerContextDir?: string;
    readme?: string | null;
    input?: object | null;
    changelog?: string | null;
    storages?: {
        dataset?: object;
    };
    minMemoryMbytes?: number;
    maxMemoryMbytes?: number;
    usesStandbyMode?: boolean;
}

interface CommonActorPricingInfo {
    /** In [0, 1], fraction of pricePerUnitUsd that goes to Apify */
    apifyMarginPercentage: number;
    /** When this pricing info record has been created */
    createdAt: Date;
    /** Since when is this pricing info record effective for a given Actor */
    startedAt: Date;
    notifiedAboutFutureChangeAt?: Date;
    notifiedAboutChangeAt?: Date;
    reasonForChange?: string;
}

export interface FreeActorPricingInfo extends CommonActorPricingInfo {
    pricingModel: 'FREE';
}

export interface FlatPricePerMonthActorPricingInfo extends CommonActorPricingInfo {
    pricingModel: 'FLAT_PRICE_PER_MONTH';
    /** For how long this Actor can be used for free in trial period */
    trialMinutes?: number;
    /** Monthly flat price in USD */
    pricePerUnitUsd: number;
}

export interface PricePerDatasetItemActorPricingInfo extends CommonActorPricingInfo {
    pricingModel: 'PRICE_PER_DATASET_ITEM';
    /** Name of the unit that is being charged */
    unitName?: string;
    pricePerUnitUsd: number;
}

export interface ActorChargeEvent {
    eventPriceUsd: number;
    eventTitle: string;
    eventDescription?: string;
}

export type ActorChargeEvents = Record<string, ActorChargeEvent>;

export interface PricePerEventActorPricingInfo extends CommonActorPricingInfo {
    pricingModel: 'PAY_PER_EVENT';
    pricingPerEvent: {
        actorChargeEvents: ActorChargeEvents;
    };
    minimalMaxTotalChargeUsd?: number;
}

export type ActorRunPricingInfo =
    | PricePerEventActorPricingInfo
    | PricePerDatasetItemActorPricingInfo
    | FlatPricePerMonthActorPricingInfo
    | FreeActorPricingInfo;
