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
     * Gets the Actor object from the Apify API.
     * 
     * @returns The Actor object, or `undefined` if it does not exist
     * @see https://docs.apify.com/api/v2#/reference/actors/actor-object/get-actor
     */
    async get(): Promise<Actor | undefined> {
        return this._get();
    }

    /**
     * Updates the Actor with specified fields.
     * 
     * @param newFields - Fields to update in the Actor
     * @returns The updated Actor object
     * @see https://docs.apify.com/api/v2#/reference/actors/actor-object/update-actor
     */
    async update(newFields: ActorUpdateOptions): Promise<Actor> {
        ow(newFields, ow.object);

        return this._update(newFields);
    }

    /**
     * Deletes the Actor.
     * 
     * @see https://docs.apify.com/api/v2#/reference/actors/actor-object/delete-actor
     */
    async delete(): Promise<void> {
        return this._delete();
    }

    /**
     * Starts the Actor and immediately returns the Run object.
     * 
     * The Actor run can be configured with optional input and various options. The run starts
     * asynchronously and this method returns immediately without waiting for completion.
     * Use the {@link call} method if you want to wait for the Actor to finish.
     * 
     * @param input - Input for the Actor. Can be any JSON-serializable value (object, array, string, number).
     *                If `contentType` is specified in options, input should be a string or Buffer.
     * @param options - Run configuration options
     * @param options.build - Tag or number of the build to run (e.g., `'beta'` or `'1.2.345'`). If not provided, uses the default build.
     * @param options.memory - Memory in megabytes allocated for the run. If not provided, uses the Actor's default memory setting.
     * @param options.timeout - Timeout for the run in seconds. Zero means no timeout. If not provided, uses the Actor's default timeout.
     * @param options.waitForFinish - Maximum time to wait (in seconds, max 60s) for the run to finish on the API side before returning. Default is 0 (returns immediately).
     * @param options.webhooks - Webhooks to trigger when the Actor run reaches a specific state (e.g., SUCCEEDED, FAILED).
     * @param options.maxItems - Maximum number of dataset items that will be charged (only for pay-per-result Actors).
     * @param options.maxTotalChargeUsd - Maximum cost in USD (only for pay-per-event Actors).
     * @param options.contentType - Content type of the input. If specified, input must be a string or Buffer.
     * @returns The Actor run object with status, usage, and storage IDs
     * @see https://docs.apify.com/api/v2#/reference/actors/run-collection/run-actor
     * 
     * @example
     * ```javascript
     * // Start Actor with simple input
     * const run = await client.actor('my-actor').start({ url: 'https://example.com' });
     * console.log(`Run started with ID: ${run.id}, status: ${run.status}`);
     * 
     * // Start Actor with specific build and memory
     * const run = await client.actor('my-actor').start(
     *   { url: 'https://example.com' },
     *   { build: '0.1.2', memory: 512, timeout: 300 }
     * );
     * ```
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
     * Starts the Actor and waits for it to finish before returning the Run object.
     * 
     * This is a convenience method that starts the Actor run and waits for its completion
     * by polling the run status. It optionally streams logs to the console or a custom Log instance.
     * By default, it waits indefinitely unless the `waitSecs` option is provided.
     * 
     * @param input - Input for the Actor. Can be any JSON-serializable value (object, array, string, number).
     *                If `contentType` is specified in options, input should be a string or Buffer.
     * @param options - Run configuration options (extends all options from {@link start})
     * @param options.waitSecs - Maximum time to wait for the run to finish, in seconds. If omitted, waits indefinitely.
     * @param options.log - Log instance for streaming run logs. Use `'default'` for console output, `null` to disable logging, or provide a custom Log instance.
     * @param options.build - Tag or number of the build to run (e.g., `'beta'` or `'1.2.345'`).
     * @param options.memory - Memory in megabytes allocated for the run.
     * @param options.timeout - Maximum run duration in seconds.
     * @returns The finished Actor run object with final status (SUCCEEDED, FAILED, ABORTED, or TIMED-OUT)
     * @see https://docs.apify.com/api/v2#/reference/actors/run-collection/run-actor
     * 
     * @example
     * ```javascript
     * // Run an Actor and wait for it to finish
     * const run = await client.actor('my-actor').call({ url: 'https://example.com' });
     * console.log(`Run finished with status: ${run.status}`);
     * console.log(`Dataset ID: ${run.defaultDatasetId}`);
     * 
     * // Run with a timeout and log streaming to console
     * const run = await client.actor('my-actor').call(
     *   { url: 'https://example.com' },
     *   { waitSecs: 300, log: 'default' }
     * );
     * 
     * // Run with custom log instance
     * import { Log } from '@apify/log';
     * const log = new Log({ prefix: 'My Actor' });
     * const run = await client.actor('my-actor').call({ url: 'https://example.com' }, { log });
     * ```
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
                log: ow.optional.any(ow.null, ow.object.instanceOf(Log), ow.string.equals('default')),
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
        streamedLog?.start();
        return this.apifyClient
            .run(id)
            .waitForFinish({ waitSecs })
            .finally(async () => {
                await streamedLog?.stop();
            });
    }

    /**
     * Builds the Actor.
     * 
     * Creates a new build of the specified Actor version. The build compiles the Actor's
     * source code, installs dependencies, and prepares it for execution.
     * 
     * @param versionNumber - Version number or tag to build (e.g., `'0.1'`, `'0.2'`, `'latest'`)
     * @param options - Build configuration options
     * @param options.betaPackages - If `true`, the build uses beta versions of Apify NPM packages.
     * @param options.tag - Tag to be applied to the build (e.g., `'latest'`, `'beta'`). Existing tag with the same name will be replaced.
     * @param options.useCache - If `false`, Docker build cache will be ignored. Default is `true`.
     * @param options.waitForFinish - Maximum time to wait (in seconds, max 60s) for the build to finish on the API side before returning. Default is 0 (returns immediately).
     * @returns The Build object with status and build details
     * @see https://docs.apify.com/api/v2#/reference/actors/build-collection/build-actor
     * 
     * @example
     * ```javascript
     * // Start a build and return immediately
     * const build = await client.actor('my-actor').build('0.1');
     * console.log(`Build ${build.id} started with status: ${build.status}`);
     * 
     * // Build and wait up to 120 seconds for it to finish
     * const build = await client.actor('my-actor').build('0.1', { 
     *   waitForFinish: 120,
     *   tag: 'latest',
     *   useCache: true
     * });
     * ```
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
     * Returns a client for the last run of this Actor.
     * 
     * Provides access to the most recent Actor run, optionally filtered by status or origin.
     * 
     * @param options - Options to filter the last run
     * @returns A client for the last run
     * @see https://docs.apify.com/api/v2#/reference/actors/last-run-object-and-its-storages
     * 
     * @example
     * ```javascript
     * // Get the last successful run
     * const lastRun = await client.actor('my-actor').lastRun({ status: 'SUCCEEDED' }).get();
     * ```
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
     * Returns a client for managing builds of this Actor.
     * 
     * @returns A client for the Actor's build collection
     * @see https://docs.apify.com/api/v2#/reference/actors/build-collection
     */
    builds(): BuildCollectionClient {
        return new BuildCollectionClient(
            this._subResourceOptions({
                resourcePath: 'builds',
            }),
        );
    }

    /**
     * Returns a client for managing runs of this Actor.
     * 
     * @returns A client for the Actor's run collection
     * @see https://docs.apify.com/api/v2#/reference/actors/run-collection
     */
    runs(): RunCollectionClient {
        return new RunCollectionClient(
            this._subResourceOptions({
                resourcePath: 'runs',
            }),
        );
    }

    /**
     * Returns a client for a specific version of this Actor.
     * 
     * @param versionNumber - Version number (e.g., '0.1', '1.2.3')
     * @returns A client for the specified Actor version
     * @see https://docs.apify.com/api/v2#/reference/actors/version-object
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
     * Returns a client for managing versions of this Actor.
     * 
     * @returns A client for the Actor's version collection
     * @see https://docs.apify.com/api/v2#/reference/actors/version-collection
     */
    versions(): ActorVersionCollectionClient {
        return new ActorVersionCollectionClient(this._subResourceOptions());
    }

    /**
     * Returns a client for managing webhooks associated with this Actor.
     * 
     * @returns A client for the Actor's webhook collection
     * @see https://docs.apify.com/api/v2#/reference/actors/webhook-collection
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
     * Specifies the maximum number of dataset items that will be charged for pay-per-result Actors.
     * This does NOT guarantee that the Actor will return only this many items.
     * It only ensures you won't be charged for more than this number of items.
     * Only works for pay-per-result Actors.
     * Value can be accessed in the Actor run using `ACTOR_MAX_PAID_DATASET_ITEMS` environment variable.
     */
    maxItems?: number;

    /**
     * Specifies the maximum cost of the Actor run. This parameter is
     * used only for pay-per-event Actors. It allows you to limit the amount
     * charged to your subscription. You can access the maximum cost in your
     * Actor by using the `ACTOR_MAX_TOTAL_CHARGE_USD` environment variable.
     */
    maxTotalChargeUsd?: number;

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
    /**
     * Wait time in seconds for the actor run to finish.
     */
    waitSecs?: number;
    /**
     * `Log` instance that should be used to redirect actor run logs to.
     * If `undefined` or `'default'` the pre-defined `Log` will be created and used.
     * If `null`, no log redirection will occur.
     */
    log?: Log | null | 'default';
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
    maxItems?: number;
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
