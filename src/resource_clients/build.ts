import ow from 'ow';

import type { ACT_JOB_TERMINAL_STATUSES } from '@apify/consts';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import { cast, parseDateFields, pluckData } from '../utils';
import type { ActorDefinition } from './actor';
import { LogClient } from './log';

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
     * Gets the Actor build object from the Apify API.
     * 
     * @param options - Get options
     * @param options.waitForFinish - Maximum time to wait (in seconds, max 60s) for the build to finish on the API side before returning. Default is 0 (returns immediately).
     * @returns The Build object, or `undefined` if it does not exist
     * @see https://docs.apify.com/api/v2#/reference/actor-builds/build-object/get-build
     * 
     * @example
     * ```javascript
     * // Get build status immediately
     * const build = await client.build('build-id').get();
     * console.log(`Status: ${build.status}`);
     * 
     * // Wait up to 60 seconds for build to finish
     * const build = await client.build('build-id').get({ waitForFinish: 60 });
     * ```
     */
    async get(options: BuildClientGetOptions = {}): Promise<Build | undefined> {
        ow(
            options,
            ow.object.exactShape({
                waitForFinish: ow.optional.number,
            }),
        );

        return this._get(options);
    }

    /**
     * Aborts the Actor build.
     * 
     * Stops the build process immediately. The build will have an ABORTED status.
     * 
     * @returns The updated Build object with ABORTED status
     * @see https://docs.apify.com/api/v2#/reference/actor-builds/abort-build/abort-build
     * 
     * @example
     * ```javascript
     * await client.build('build-id').abort();
     * ```
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
     * Deletes the Actor build.
     * 
     * @see https://docs.apify.com/api/v2#/reference/actor-builds/delete-build/delete-build
     */
    async delete(): Promise<void> {
        return this._delete();
    }

    /**
     * https://docs.apify.com/api/v2/actor-build-openapi-json-get
     */
    async getOpenApiDefinition(): Promise<OpenApiDefinition> {
        const response = await this.httpClient.call({
            url: this._url('openapi.json'),
            method: 'GET',
            params: this._params(),
        });

        return response.data;
    }

    /**
     * Waits for the Actor build to finish and returns the finished Build object.
     * 
     * The promise resolves when the build reaches a terminal state (SUCCEEDED, FAILED, ABORTED, or TIMED-OUT).
     * If `waitSecs` is provided and the timeout is reached, the promise resolves with the unfinished
     * Build object (status will be RUNNING or READY). The promise is NOT rejected based on build status.
     * 
     * Unlike the `waitForFinish` parameter in {@link get}, this method can wait indefinitely
     * by polling the build status. It uses the `waitForFinish` parameter internally (max 60s per call)
     * and continuously polls until the build finishes or the timeout is reached.
     * 
     * This is useful when you need to immediately start a run after a build finishes.
     * 
     * @param options - Wait options
     * @param options.waitSecs - Maximum time to wait for the build to finish, in seconds. If omitted, waits indefinitely.
     * @returns The Build object (finished or still building if timeout was reached)
     * 
     * @example
     * ```javascript
     * // Wait indefinitely for build to finish
     * const build = await client.build('build-id').waitForFinish();
     * console.log(`Build finished with status: ${build.status}`);
     * 
     * // Start a run immediately after build succeeds
     * const build = await client.build('build-id').waitForFinish();
     * if (build.status === 'SUCCEEDED') {
     *   const run = await client.actor('my-actor').start();
     * }
     * ```
     */
    async waitForFinish(options: BuildClientWaitForFinishOptions = {}): Promise<Build> {
        ow(
            options,
            ow.object.exactShape({
                waitSecs: ow.optional.number,
            }),
        );

        return this._waitForFinish(options);
    }

    /**
     * Returns a client for accessing the log of this Actor build.
     * 
     * @returns A client for accessing the build's log
     * @see https://docs.apify.com/api/v2#/reference/actor-builds/build-log
     * 
     * @example
     * ```javascript
     * // Get build log
     * const log = await client.build('build-id').log().get();
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
}

/**
 * Options for getting a Build.
 */
export interface BuildClientGetOptions {
    waitForFinish?: number;
}

/**
 * Options for waiting for a Build to finish.
 */
export interface BuildClientWaitForFinishOptions {
    /**
     * Maximum time to wait for the build to finish, in seconds.
     * If the limit is reached, the returned promise is resolved to a build object that will have
     * status `READY` or `RUNNING`. If `waitSecs` omitted, the function waits indefinitely.
     */
    waitSecs?: number;
}

/**
 * Metadata about how a Build was initiated.
 */
export interface BuildMeta {
    origin: string;
    clientIp: string;
    userAgent: string;
}

/**
 * Represents an Actor build.
 * 
 * Builds compile Actor source code and prepare it for execution. Each build has a unique ID
 * and can be tagged (e.g., 'latest', 'beta') for easy reference.
 */
export interface Build {
    id: string;
    actId: string;
    userId: string;
    startedAt: Date;
    finishedAt?: Date;
    status: (typeof ACT_JOB_TERMINAL_STATUSES)[number];
    meta: BuildMeta;
    stats?: BuildStats;
    options?: BuildOptions;
    /**
     * @deprecated This property is deprecated in favor of `actorDefinition.input`.
     */
    inputSchema?: string;
    /**
     * @deprecated This property is deprecated in favor of `actorDefinition.readme`.
     */
    readme?: string;
    buildNumber: string;
    usage?: BuildUsage;
    usageTotalUsd?: number;
    usageUsd?: BuildUsage;
    actorDefinition?: ActorDefinition;
}

/**
 * Resource usage for an Actor build.
 */
export interface BuildUsage {
    ACTOR_COMPUTE_UNITS?: number;
}

/**
 * Runtime statistics for an Actor build.
 */
export interface BuildStats {
    durationMillis: number;
    runTimeSecs: number;
    computeUnits: number;
}

/**
 * Configuration options used for an Actor build.
 */
export interface BuildOptions {
    useCache?: boolean;
    betaPackages?: boolean;
    memoryMbytes?: number;
    diskMbytes?: number;
}

/**
 * OpenAPI specification for an Actor.
 * 
 * Defines the Actor's API interface in OpenAPI 3.0 format, useful for integration
 * with tools like ChatGPT plugins and other API consumers.
 */
export interface OpenApiDefinition {
    openapi: string;
    info: {
        title: string;
        description?: string;
        version?: string;
        'x-build-id': string;
    };
    servers: { url: string }[];
    paths: { [key: string]: { post: OpenApiOperation } };
    components: {
        schemas: {
            [key: string]: object;
        };
    };
}

interface OpenApiOperation {
    operationId: string;
    'x-openai-isConsequential': boolean;
    summary: string;
    tags: string[];
    requestBody: {
        required: boolean;
        content: {
            'application/json': {
                schema: {
                    $ref: string;
                };
            };
        };
    };
    parameters: {
        name: string;
        in: string;
        required: boolean;
        schema: {
            type: string;
        };
        description: string;
    }[];
    responses: {
        '200': {
            description: string;
            content?: {
                'application/json': {
                    schema: {
                        $ref: string;
                    };
                };
            };
        };
    };
}
