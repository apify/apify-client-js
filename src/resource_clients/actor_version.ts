import ow from 'ow';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import type { ActorVersion, FinalActorVersion } from '../models';
import { ActorEnvVarClient } from './actor_env_var';
import { ActorEnvVarCollectionClient } from './actor_env_var_collection';

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
} from '../models';
export { ActorSourceType } from '../models';

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
     * @returns The Actor version object, or `undefined` if it does not exist.
     * @see https://docs.apify.com/api/v2/act-version-get
     */
    async get(): Promise<FinalActorVersion | undefined> {
        return this._get();
    }

    /**
     * Updates the Actor version with the specified fields.
     *
     * @param newFields - Fields to update.
     * @returns The updated Actor version object.
     * @see https://docs.apify.com/api/v2/act-version-put
     */
    async update(newFields: ActorVersion): Promise<FinalActorVersion> {
        ow(newFields, ow.object);

        return this._update(newFields);
    }

    /**
     * Deletes the Actor version.
     *
     * @see https://docs.apify.com/api/v2/act-version-delete
     */
    async delete(): Promise<void> {
        return this._delete();
    }

    /**
     * Returns a client for the specified environment variable of this Actor version.
     *
     * @param envVarName - Name of the environment variable.
     * @returns A client for the environment variable.
     * @see https://docs.apify.com/api/v2/act-version-env-var-get
     */
    envVar(envVarName: string): ActorEnvVarClient {
        ow(envVarName, ow.string);
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
     */
    envVars(): ActorEnvVarCollectionClient {
        return new ActorEnvVarCollectionClient(this._subResourceOptions());
    }
}
