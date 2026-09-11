import { z } from 'zod';

import { ACTOR_JOB_STATUSES, ACTOR_PERMISSION_LEVEL, META_ORIGINS } from '@apify/consts';
import { Log } from '@apify/log';

import type { ApiClientSubResourceOptions } from '../base/api_client.js';
import { ResourceClient } from '../base/resource_client.js';
import type { ApifyRequestConfig } from '../http_client.js';
import type { Actor, ActorRun } from '../models.js';
import type { TimeoutOptions } from '../timeouts.js';
import * as schemas from '../schemas.js';
import { timeoutOptionsSchema, timeoutOptionsShape } from '../timeouts.js';
import { anyObjectSchema, parseArgument, parseResponse, stringifyWebhooksToBase64 } from '../utils.js';
import { ActorVersionClient } from './actor_version.js';
import { ActorVersionCollectionClient } from './actor_version_collection.js';
import type { Build, BuildClientGetOptions } from './build.js';
import { BuildClient } from './build.js';
import { BuildCollectionClient } from './build_collection.js';
import { RunClient } from './run.js';
import { RunCollectionClient } from './run_collection.js';
import type { WebhookUpdateData } from './webhook.js';
import { WebhookCollectionClient } from './webhook_collection.js';
import type { ValueOf } from 'type-fest';

const startOptionsSchema = z.strictObject({
    build: z.string().optional(),
    contentType: z.string().optional(),
    memory: z.number().optional(),
    runTimeoutSecs: z.number().min(0).optional(),
    waitForFinish: z.number().optional(),
    webhooks: z.array(anyObjectSchema).optional(),
    maxItems: z.number().min(0).optional(),
    maxTotalChargeUsd: z.number().min(0).optional(),
    restartOnError: z.boolean().optional(),
    forcePermissionLevel: z.enum(ACTOR_PERMISSION_LEVEL).optional(),
    ...timeoutOptionsShape,
});
const callOptionsSchema = z.strictObject({
    build: z.string().optional(),
    contentType: z.string().optional(),
    memory: z.number().optional(),
    runTimeoutSecs: z.number().min(0).optional(),
    waitSecs: z.number().min(0).optional(),
    webhooks: z.array(anyObjectSchema).optional(),
    maxItems: z.number().min(0).optional(),
    maxTotalChargeUsd: z.number().min(0).optional(),
    log: z.union([z.null(), z.instanceof(Log), z.literal('default')]).optional(),
    restartOnError: z.boolean().optional(),
    forcePermissionLevel: z.enum(ACTOR_PERMISSION_LEVEL).optional(),
    ...timeoutOptionsShape,
});
const validateInputOptionsSchema = z.strictObject({
    build: z.string().optional(),
    contentType: z.string().optional(),
    ...timeoutOptionsShape,
});
const versionNumberSchema = z.string().min(1);
const buildOptionsSchema = z.strictObject({
    betaPackages: z.boolean().optional(),
    tag: z.string().optional(),
    useCache: z.boolean().optional(),
    waitForFinish: z.number().optional(),
    ...timeoutOptionsShape,
});
const defaultBuildOptionsSchema = z.strictObject({ waitForFinish: z.number().optional(), ...timeoutOptionsShape });
const lastRunOptionsSchema = z.strictObject({
    status: z.enum(ACTOR_JOB_STATUSES).optional(),
    origin: z.enum(META_ORIGINS).optional(),
});

export type {
    Actor,
    ActorChargeEvent,
    ActorChargeEvents,
    ActorDefaultRunOptions,
    ActorDefinition,
    ActorExampleRunInput,
    ActorRun,
    ActorRunListItem,
    ActorRunMeta,
    ActorRunMetamorph,
    ActorRunOptions,
    ActorRunPricingInfo,
    ActorRunStats,
    ActorRunStorageIds,
    ActorRunUsage,
    ActorStandby,
    ActorStats,
    ActorTaggedBuild,
    ActorTaggedBuilds,
    FlatPricePerMonthActorPricingInfo,
    FreeActorPricingInfo,
    PricePerDatasetItemActorPricingInfo,
    PricePerEventActorPricingInfo,
    TieredPricingPerDatasetItem,
    TieredPricingPerDatasetItemEntry,
    TieredPricingPerEvent,
    TieredPricingPerEventEntry,
} from '../models.js';

/**
 * Client for managing a specific Actor.
 *
 * Provides methods to start, call, build, update, and delete an Actor, as well as manage its
 * versions, builds, runs, and webhooks.
 *
 * @example
 * ```javascript
 * const client = new ApifyClient({ token: 'my-token' });
 * const actorClient = client.actor('my-actor-id');
 *
 * // Start an Actor
 * const run = await actorClient.start(input, { memory: 256 });
 *
 * // Call an Actor and wait for it to finish
 * const finishedRun = await actorClient.call({ url: 'https://example.com' });
 * ```
 *
 * @see https://docs.apify.com/platform/actors
 */
export class ActorClient extends ResourceClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'actors',
            ...options,
        });
    }

    /**
     * Gets the Actor object from the Apify API.
     *
     * @param options - Request options
     * @param options.timeoutSecs - Timeout for the API request. Default is `'short'`.
     * @returns The Actor object, or `undefined` if it does not exist
     * @see https://docs.apify.com/api/v2/act-get
     */
    async get(options: TimeoutOptions = {}): Promise<Actor | undefined> {
        const { timeoutSecs = 'short' } = parseArgument(options, timeoutOptionsSchema, 'TimeoutOptions');

        return this.getResource(schemas.Actor(), {}, timeoutSecs);
    }

    /**
     * Updates the Actor with specified fields.
     *
     * @param newFields - Fields to update in the Actor
     * @param options - Request options
     * @param options.timeoutSecs - Timeout for the API request. Default is `'short'`.
     * @returns The updated Actor object
     * @see https://docs.apify.com/api/v2/act-put
     */
    async update(newFields: ActorUpdateOptions, options: TimeoutOptions = {}): Promise<Actor> {
        parseArgument(newFields, anyObjectSchema);
        const { timeoutSecs = 'short' } = parseArgument(options, timeoutOptionsSchema, 'TimeoutOptions');

        return this.updateResource(schemas.Actor(), newFields, timeoutSecs);
    }

    /**
     * Deletes the Actor.
     *
     * @param options - Request options
     * @param options.timeoutSecs - Timeout for the API request. Default is `'short'`.
     * @see https://docs.apify.com/api/v2/act-delete
     */
    async delete(options: TimeoutOptions = {}): Promise<void> {
        const { timeoutSecs = 'short' } = parseArgument(options, timeoutOptionsSchema, 'TimeoutOptions');

        return this.deleteResource(timeoutSecs);
    }

    /**
     * Starts the Actor and immediately returns the Run object.
     *
     * The Actor run can be configured with optional input and various options. The run starts
     * asynchronously and this method returns immediately without waiting for completion.
     * Use the {@link call} method if you want to wait for the Actor to finish.
     *
     * @param input - Input for the Actor, serialized to JSON. Omit it to run the Actor without input.
     * @param options - Run configuration options
     * @param options.build - Tag or number of the build to run (e.g., `'beta'` or `'1.2.345'`). If not provided, uses the default build.
     * @param options.memory - Memory in megabytes allocated for the run. If not provided, uses the Actor's default memory setting.
     * @param options.runTimeoutSecs - Timeout for the run in seconds. Zero means no timeout. If not provided, uses the Actor's default timeout.
     * @param options.waitForFinish - Maximum time to wait (in seconds, max 60s) for the run to finish on the API side before returning. Default is 0 (returns immediately).
     * @param options.webhooks - Webhooks to trigger when the Actor run reaches a specific state (e.g., `SUCCEEDED`, `FAILED`).
     * @param options.maxItems - Maximum number of dataset items that will be charged (only for pay-per-result Actors).
     * @param options.maxTotalChargeUsd - Maximum cost in USD (only for pay-per-event Actors).
     * @param options.timeoutSecs - Timeout for the API request. Default is `'medium'`, extended to cover `waitForFinish`
     * when the API is asked to hold the response.
     * @returns The Actor run object with status, usage, and storage IDs
     * @see https://docs.apify.com/api/v2/act-runs-post
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
     *   { build: '0.1.2', memory: 512, runTimeoutSecs: 300 }
     * );
     * ```
     */
    async start(input?: ActorInput, options: ActorStartOptions = {}): Promise<ActorRun> {
        const parsed = parseArgument(options, startOptionsSchema, 'ActorStartOptions');

        const {
            waitForFinish,
            runTimeoutSecs,
            memory,
            build,
            maxItems,
            maxTotalChargeUsd,
            restartOnError,
            forcePermissionLevel,
            timeoutSecs,
        } = parsed;

        // The API's `timeout` parameter bounds the run, not the request.
        const params = {
            waitForFinish,
            timeout: runTimeoutSecs,
            memory,
            build,
            webhooks: stringifyWebhooksToBase64(parsed.webhooks),
            maxItems,
            maxTotalChargeUsd,
            restartOnError,
            forcePermissionLevel,
        };

        const request: ApifyRequestConfig = {
            url: this.buildUrl('runs'),
            method: 'POST',
            data: input,
            params: this.buildParams(params),
            // Apify internal property. Tells the request serialization interceptor
            // to stringify functions to JSON, instead of omitting them.
            stringifyFunctions: true,
            timeoutSecs: this.timeoutForWaitForFinish(timeoutSecs, 'medium', waitForFinish),
        };
        if (parsed.contentType) {
            request.headers = {
                'content-type': parsed.contentType,
            };
        }

        const response = await this.httpClient.call(request);
        return parseResponse(response, schemas.Run());
    }

    /**
     * Starts the Actor and waits for it to finish before returning the Run object.
     *
     * This is a convenience method that starts the Actor run and waits for its completion
     * by polling the run status. It optionally streams logs to the console or a custom Log instance.
     * By default, it waits indefinitely unless the `waitSecs` option is provided.
     *
     * @param input - Input for the Actor, serialized to JSON. Omit it to run the Actor without input.
     * @param options - Run configuration options (extends all options from {@link start})
     * @param options.waitSecs - Maximum time to wait for the run to finish, in seconds. If omitted, waits indefinitely.
     * @param options.log - Log instance for streaming run logs. Use `'default'` for console output, `null` to disable logging, or provide a custom Log instance.
     * @param options.build - Tag or number of the build to run (e.g., `'beta'` or `'1.2.345'`).
     * @param options.memory - Memory in megabytes allocated for the run.
     * @param options.runTimeoutSecs - Maximum run duration in seconds.
     * @param options.timeoutSecs - Timeout for each API request, the start and every poll alike. Default is `'noTimeout'`.
     * @returns The finished Actor run object with final status (`SUCCEEDED`, `FAILED`, `ABORTED`, or `TIMED-OUT`)
     * @see https://docs.apify.com/api/v2/act-runs-post
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
    async call(input?: ActorInput, options: ActorCallOptions = {}): Promise<ActorRun> {
        const parsed = parseArgument(options, callOptionsSchema, 'ActorCallOptions');

        const { waitSecs, log, timeoutSecs = 'noTimeout', ...startOptions } = parsed;
        const { id } = await this.start(input, { ...startOptions, timeoutSecs });

        // Calling root client because we need access to top level API.
        // Creating a new instance of RunClient here would only allow
        // setting it up as a nested route under actor API.
        const newRunClient = this.apifyClient.run(id);

        const streamedLog = await newRunClient.getStreamedLog({ toLog: log });
        streamedLog?.start();
        return this.apifyClient
            .run(id)
            .waitForFinish({ waitSecs, timeoutSecs })
            .finally(async () => {
                await streamedLog?.stop();
            });
    }

    /**
     * Validates the provided input for the Actor against its input schema.
     *
     * Sends the input to the API, which validates it against the Actor's input schema without
     * starting a run. If the input is valid, the method resolves with `true`. If the input is
     * invalid, the API responds with an error that is thrown as an `ApifyApiError` describing the
     * validation problem.
     *
     * @param input - Input to validate against the Actor's input schema, serialized to JSON.
     * @param options - Validation options
     * @param options.build - Tag or number of the build whose input schema the input is validated against
     *                         (e.g., `'latest'` or `'1.2.345'`). If not provided, uses the default build.
     * @param options.timeoutSecs - Timeout for the API request. Default is `'short'`.
     * @returns `true` if the input is valid. Invalid input causes the underlying API call to throw an `ApifyApiError`.
     * @see https://docs.apify.com/api/v2/act-validate-input-post
     *
     * @example
     * ```javascript
     * // Validate input against the default build's input schema
     * const isValid = await client.actor('my-actor').validateInput({ url: 'https://example.com' });
     *
     * // Validate against a specific build
     * const isValid = await client.actor('my-actor').validateInput(
     *   { url: 'https://example.com' },
     *   { build: 'beta' },
     * );
     * ```
     * @since Added in 2.24.0
     */
    async validateInput(input?: ActorInput, options: ActorValidateInputOptions = {}): Promise<boolean> {
        const parsed = parseArgument(options, validateInputOptionsSchema, 'ActorValidateInputOptions');

        const request: ApifyRequestConfig = {
            url: this.buildUrl('validate-input'),
            method: 'POST',
            data: input,
            params: this.buildParams({ build: parsed.build }),
            // Apify internal property. Tells the request serialization interceptor
            // to stringify functions to JSON, instead of omitting them.
            stringifyFunctions: true,
            timeoutSecs: parsed.timeoutSecs ?? 'short',
        };
        if (parsed.contentType) {
            request.headers = {
                'content-type': parsed.contentType,
            };
        }

        const response = await this.httpClient.call(request);
        return response.data.valid;
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
     * @param options.timeoutSecs - Timeout for the API request. Default is `'medium'`, extended to cover `waitForFinish`
     * when the API is asked to hold the response.
     * @returns The Build object with status and build details
     * @see https://docs.apify.com/api/v2/act-builds-post
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
        parseArgument(versionNumber, versionNumberSchema);
        const { timeoutSecs, ...params } = parseArgument(options, buildOptionsSchema, 'ActorBuildOptions');

        const response = await this.httpClient.call({
            url: this.buildUrl('builds'),
            method: 'POST',
            params: this.buildParams({
                version: versionNumber,
                ...params,
            }),
            timeoutSecs: this.timeoutForWaitForFinish(timeoutSecs, 'medium', params.waitForFinish),
        });

        return parseResponse(response, schemas.Build());
    }

    /**
     * Returns a client for the default build of this Actor.
     *
     * Makes an API call to resolve the Actor's default build, then returns a {@link BuildClient}
     * for that build. Use the returned client to get build details, wait for the build to finish,
     * or access its logs.
     *
     * @param options - Options for getting the default build
     * @param options.waitForFinish - Maximum time to wait (in seconds, max 60s) for the build to finish on the API side before returning. Default is 0 (returns immediately).
     * @param options.timeoutSecs - Timeout for the API request. Default is `'short'`, extended to cover `waitForFinish`
     * when the API is asked to hold the response.
     * @returns A client for the default build
     * @see https://docs.apify.com/api/v2/act-build-default-get
     *
     * @example
     * ```javascript
     * // Get the default build client, then fetch build details
     * const buildClient = await client.actor('my-actor').defaultBuild();
     * const build = await buildClient.get();
     * console.log(`Default build status: ${build.status}`);
     *
     * // Wait up to 60 seconds for the default build to finish
     * const buildClient = await client.actor('my-actor').defaultBuild({ waitForFinish: 60 });
     * const build = await buildClient.get();
     * ```
     * @since Added in 2.12.2
     */
    async defaultBuild(options: BuildClientGetOptions = {}): Promise<BuildClient> {
        const { timeoutSecs, ...params } = parseArgument(options, defaultBuildOptionsSchema, 'BuildClientGetOptions');

        const response = await this.httpClient.call({
            url: this.buildUrl('builds/default'),
            method: 'GET',
            params: this.buildParams(params),
            timeoutSecs: this.timeoutForWaitForFinish(timeoutSecs, 'short', params.waitForFinish),
        });

        const { id } = parseResponse<Build>(response, schemas.Build());

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
     * @param options.status - Filter by run status (e.g., `'SUCCEEDED'`, `'FAILED'`, `'RUNNING'`, `'ABORTED'`, `'TIMED-OUT'`).
     * @param options.origin - Filter by run origin (e.g., `'DEVELOPMENT'`, `'WEB'`, `'API'`, `'SCHEDULER'`).
     * @returns A client for the last run
     * @see https://docs.apify.com/api/v2/act-runs-last-get
     *
     * @example
     * ```javascript
     * // Get the last successful run
     * const lastRun = await client.actor('my-actor').lastRun({ status: 'SUCCEEDED' }).get();
     * ```
     */
    lastRun(options: ActorLastRunOptions = {}): RunClient {
        const parsed = parseArgument(options, lastRunOptionsSchema, 'ActorLastRunOptions');

        return new RunClient(
            this.subResourceOptions({
                id: 'last',
                params: this.buildParams(parsed),
                resourcePath: 'runs',
            }),
        );
    }

    /**
     * Returns a client for managing builds of this Actor.
     *
     * @returns A client for the Actor's build collection
     * @see https://docs.apify.com/api/v2/act-builds-get
     */
    builds(): BuildCollectionClient {
        return new BuildCollectionClient(
            this.subResourceOptions({
                resourcePath: 'builds',
            }),
        );
    }

    /**
     * Returns a client for managing runs of this Actor.
     *
     * @returns A client for the Actor's run collection
     * @see https://docs.apify.com/api/v2/act-runs-get
     */
    runs(): RunCollectionClient {
        return new RunCollectionClient(
            this.subResourceOptions({
                resourcePath: 'runs',
            }),
        );
    }

    /**
     * Returns a client for a specific version of this Actor.
     *
     * @param versionNumber - Version number (e.g., '0.1', '1.2.3')
     * @returns A client for the specified Actor version
     * @see https://docs.apify.com/api/v2/act-version-get
     */
    version(versionNumber: string): ActorVersionClient {
        parseArgument(versionNumber, versionNumberSchema);
        return new ActorVersionClient(
            this.subResourceOptions({
                id: versionNumber,
            }),
        );
    }

    /**
     * Returns a client for managing versions of this Actor.
     *
     * @returns A client for the Actor's version collection
     * @see https://docs.apify.com/api/v2/act-versions-get
     */
    versions(): ActorVersionCollectionClient {
        return new ActorVersionCollectionClient(this.subResourceOptions());
    }

    /**
     * Returns a client for managing webhooks associated with this Actor.
     *
     * @returns A client for the Actor's webhook collection
     * @see https://docs.apify.com/api/v2/act-webhooks-get
     */
    webhooks(): WebhookCollectionClient {
        return new WebhookCollectionClient(this.subResourceOptions());
    }
}

/**
 * Fields that can be updated when modifying an Actor.
 */
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
        | 'actorPermissionLevel'
        | 'taggedBuilds'
    >
>;

/**
 * Input for an Actor run, as taken by {@link ActorClient.start}, {@link ActorClient.call},
 * {@link ActorClient.validateInput} and {@link RunClient.metamorph}.
 *
 * An object or an array. Declared as `object` rather than an index-signature type such as
 * `Dictionary`, which would reject a caller's own `interface`.
 */
export type ActorInput = object;

export interface ActorStartOptions extends TimeoutOptions {
    /**
     * Tag or number of the Actor build to run (e.g. `beta` or `1.2.345`).
     * If not provided, the run uses build tag or number from the default Actor run configuration (typically `latest`).
     */
    build?: string;

    /**
     * Content type of the request body, which becomes the content type of the run's `INPUT` record.
     * Without it, an input is serialized to JSON and sent as `application/json`. Pairing an object
     * with `application/x-www-form-urlencoded` form-encodes it instead.
     */
    contentType?: string;

    /**
     * Memory in megabytes which will be allocated for the new Actor run.
     * If not provided, the run uses memory of the default Actor run configuration.
     */
    memory?: number;
    /**
     * Timeout for the Actor run in seconds. Zero value means there is no timeout.
     * If not provided, the run uses the timeout of the default Actor run configuration.
     */
    runTimeoutSecs?: number;

    /**
     * Maximum time to wait for the Actor run to finish, in seconds.
     * If the limit is reached, the returned promise is resolved to a run object that will have
     * status `READY` or `RUNNING` and it will not contain the Actor run output.
     * By default (or when `waitForFinish` is set to `0`), the function resolves immediately without waiting.
     * The wait is limited to 60s and happens on the API directly, as opposed to the `call` method and its
     * `waitSecs` option, which is implemented via polling on the client side instead (and has no limit like that).
     */
    waitForFinish?: number;

    /**
     * Specifies optional webhooks associated with the Actor run, which can be used
     * to receive a notification e.g. when the Actor finished or failed, see
     * [ad hook webhooks documentation](https://docs.apify.com/webhooks/ad-hoc-webhooks) for detailed description.
     */
    webhooks?: readonly WebhookUpdateData[];

    /**
     * Specifies the maximum number of dataset items that will be charged for pay-per-result Actors.
     * This does NOT guarantee that the Actor will return only this many items.
     * It only ensures you won't be charged for more than this number of items.
     * Only works for pay-per-result Actors.
     * Value can be accessed in the Actor run using `ACTOR_MAX_PAID_DATASET_ITEMS` environment variable.
     * @since Added in 2.7.0
     */
    maxItems?: number;

    /**
     * Specifies the maximum cost of the Actor run. This parameter is
     * used only for pay-per-event Actors. It allows you to limit the amount
     * charged to your subscription. You can access the maximum cost in your
     * Actor by using the `ACTOR_MAX_TOTAL_CHARGE_USD` environment variable.
     * @since Added in 2.9.7
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
     * @since Added in 2.17.0
     */
    forcePermissionLevel?: ACTOR_PERMISSION_LEVEL;
}

/**
 * Options for calling an Actor and waiting for it to finish.
 *
 * Extends {@link ActorStartOptions} with additional options for waiting and log streaming.
 * @since Added in 2.6.2
 */
export interface ActorCallOptions extends Omit<ActorStartOptions, 'waitForFinish'> {
    /**
     * Wait time in seconds for the Actor run to finish.
     */
    waitSecs?: number;
    /**
     * `Log` instance that should be used to redirect Actor run logs to.
     * If `undefined` or `'default'` the pre-defined `Log` will be created and used.
     * If `null`, no log redirection will occur.
     * @since Added in 2.20.0
     */
    log?: Log | null | 'default';
}

/**
 * Options for validating an Actor input.
 * @since Added in 2.24.0
 */
export interface ActorValidateInputOptions extends TimeoutOptions {
    /**
     * Tag or number of the Actor build whose input schema the input is validated against
     * (e.g. `beta` or `1.2.345`). If not provided, the default build is used.
     */
    build?: string;

    /**
     * Content type of the request body carrying the input to validate. Without it, the input is
     * serialized to JSON and sent as `application/json`. Pairing an object with
     * `application/x-www-form-urlencoded` form-encodes it instead.
     */
    contentType?: string;
}

/**
 * Options for building an Actor.
 */
export interface ActorBuildOptions extends TimeoutOptions {
    betaPackages?: boolean;
    tag?: string;
    useCache?: boolean;
    waitForFinish?: number;
}

/**
 * Options for filtering the last run of an Actor.
 */
export interface ActorLastRunOptions {
    status?: ValueOf<typeof ACTOR_JOB_STATUSES>;
    /**
     * @since Added in 2.24.0
     */
    origin?: ValueOf<typeof META_ORIGINS>;
}
