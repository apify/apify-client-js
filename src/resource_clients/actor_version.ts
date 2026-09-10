import { z } from 'zod';

import type { ApiClientSubResourceOptions } from '../base/api_client.js';
import { ResourceClient } from '../base/resource_client.js';
import type { ActorVersion, FinalActorVersion } from '../models.js';
import type { TimeoutOptions } from '../timeouts.js';
import * as schemas from '../schemas.js';
import { timeoutOptionsSchema } from '../timeouts.js';
import { anyObjectSchema, parseArgument } from '../utils.js';
import { ActorEnvVarClient } from './actor_env_var.js';
import { ActorEnvVarCollectionClient } from './actor_env_var_collection.js';

const envVarNameSchema = z.string().min(1);

export type {
    ActorEnvironmentVariable,
    ActorVersion,
    ActorVersionGitHubGist,
    ActorVersionGitRepo,
    ActorVersionSourceCode,
    ActorVersionSourceFile,
    ActorVersionSourceFiles,
    ActorVersionSourceFolder,
    ActorVersionTarball,
    BaseActorVersion,
    FinalActorVersion,
} from '../models.js';
export { ActorSourceType } from '../models.js';

/**
 * Client for managing a specific Actor version.
 *
 * Actor versions represent specific builds or snapshots of an Actor's code. This client provides
 * methods to get, update, and delete versions, as well as manage their environment variables.
 *
 * @example
 * ```javascript
 * const client = new ApifyClient({ token: 'my-token' });
 * const actorClient = client.actor('my-actor-id');
 *
 * // Get a specific version
 * const versionClient = actorClient.version('0.1');
 * const version = await versionClient.get();
 *
 * // Update version
 * await versionClient.update({ buildTag: 'latest' });
 * ```
 *
 * @see https://docs.apify.com/api/v2/act-versions-get
 */
export class ActorVersionClient extends ResourceClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'versions',
            ...options,
        });
    }

    /**
     * Retrieves the Actor version.
     *
     * @param options - Request options
     * @param options.timeout - Timeout for the API request. Default is `'short'`.
     * @returns The Actor version object, or `undefined` if it does not exist.
     * @see https://docs.apify.com/api/v2/act-version-get
     */
    async get(options: TimeoutOptions = {}): Promise<FinalActorVersion | undefined> {
        const { timeout = 'short' } = parseArgument(options, timeoutOptionsSchema, 'TimeoutOptions');

        return this._get(schemas.Version(), {}, timeout);
    }

    /**
     * Updates the Actor version with the specified fields.
     *
     * @param newFields - Fields to update.
     * @param options - Request options
     * @param options.timeout - Timeout for the API request. Default is `'short'`.
     * @returns The updated Actor version object.
     * @see https://docs.apify.com/api/v2/act-version-put
     */
    async update(newFields: ActorVersionUpdateData, options: TimeoutOptions = {}): Promise<FinalActorVersion> {
        parseArgument(newFields, anyObjectSchema);
        const { timeout = 'short' } = parseArgument(options, timeoutOptionsSchema, 'TimeoutOptions');

        return this._update(schemas.Version(), newFields, timeout);
    }

    /**
     * Deletes the Actor version.
     *
     * @param options - Request options
     * @param options.timeout - Timeout for the API request. Default is `'short'`.
     * @see https://docs.apify.com/api/v2/act-version-delete
     */
    async delete(options: TimeoutOptions = {}): Promise<void> {
        const { timeout = 'short' } = parseArgument(options, timeoutOptionsSchema, 'TimeoutOptions');

        return this._delete(timeout);
    }

    /**
     * Returns a client for the specified environment variable of this Actor version.
     *
     * @param envVarName - Name of the environment variable.
     * @returns A client for the environment variable.
     * @see https://docs.apify.com/api/v2/act-version-env-var-get
     * @since Added in 2.1.0
     */
    envVar(envVarName: string): ActorEnvVarClient {
        parseArgument(envVarName, envVarNameSchema);
        return new ActorEnvVarClient(
            this._subResourceOptions({
                id: envVarName,
            }),
        );
    }

    /**
     * Returns a client for the environment variables of this Actor version.
     *
     * @returns A client for the Actor version's environment variables.
     * @see https://docs.apify.com/api/v2/act-version-env-vars-get
     * @since Added in 2.1.0
     */
    envVars(): ActorEnvVarCollectionClient {
        return new ActorEnvVarCollectionClient(this._subResourceOptions());
    }
}

/**
 * Fields that can be changed on an existing Actor version.
 *
 * All of them are optional, because the endpoint leaves untouched whatever the payload does not
 * mention. The version union enforces the pairing: a `sourceType` can only be sent next to the
 * source location it implies, never next to one of the other three.
 */
export type ActorVersionUpdateData = Partial<ActorVersion>;
