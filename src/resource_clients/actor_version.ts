import ow from 'ow';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import { ActorEnvVarClient } from './actor_env_var';
import { ActorEnvVarCollectionClient } from './actor_env_var_collection';

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
 * @since Added in 1.0.0
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
     * @since Added in 2.0.1
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
     * @since Added in 2.0.1
     */
    async update(newFields: ActorVersion): Promise<FinalActorVersion> {
        ow(newFields, ow.object);

        return this._update(newFields);
    }

    /**
     * Deletes the Actor version.
     *
     * @see https://docs.apify.com/api/v2/act-version-delete
     * @since Added in 2.0.1
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
     * @since Added in 2.1.0
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
     * @since Added in 2.1.0
     */
    envVars(): ActorEnvVarCollectionClient {
        return new ActorEnvVarCollectionClient(this._subResourceOptions());
    }
}

/**
 * @since Added in 2.0.1
 */
export interface BaseActorVersion<SourceType extends ActorSourceType> {
    /**
     * @since Added in 2.0.1
     */
    versionNumber?: string;
    /**
     * @since Added in 2.0.1
     */
    sourceType: SourceType;
    /**
     * @since Added in 2.0.1
     */
    envVars?: ActorEnvironmentVariable[];
    /**
     * @since Added in 2.0.1
     */
    applyEnvVarsToBuild?: boolean;
    /**
     * @since Added in 2.0.1
     */
    buildTag?: string;
}

/**
 * @since Added in 2.6.1
 */
export interface ActorVersionSourceFiles extends BaseActorVersion<ActorSourceType.SourceFiles> {
    /**
     * @since Added in 2.6.1
     */
    sourceFiles: ActorVersionSourceFile[];
}

/**
 * @since Added in 2.0.1
 */
export interface ActorVersionSourceFile {
    /**
     * @since Added in 2.0.1
     */
    name: string;
    /**
     * @since Added in 2.0.1
     */
    format: 'TEXT' | 'BASE64';
    /**
     * @since Added in 2.0.1
     */
    content: string;
}

/**
 * @since Added in 2.0.1
 */
export interface ActorVersionGitRepo extends BaseActorVersion<ActorSourceType.GitRepo> {
    /**
     * @since Added in 2.0.1
     */
    gitRepoUrl: string;
}

/**
 * @since Added in 2.0.1
 */
export interface ActorVersionTarball extends BaseActorVersion<ActorSourceType.Tarball> {
    /**
     * @since Added in 2.0.1
     */
    tarballUrl: string;
}

/**
 * @since Added in 2.0.1
 */
export interface ActorVersionGitHubGist extends BaseActorVersion<ActorSourceType.GitHubGist> {
    /**
     * @since Added in 2.0.1
     */
    gitHubGistUrl: string;
}

/**
 * @since Added in 2.0.1
 */
export enum ActorSourceType {
    /**
     * @since Added in 2.0.1
     */
    SourceFiles = 'SOURCE_FILES',
    /**
     * @since Added in 2.0.1
     */
    GitRepo = 'GIT_REPO',
    /**
     * @since Added in 2.0.1
     */
    Tarball = 'TARBALL',
    /**
     * @since Added in 2.0.1
     */
    GitHubGist = 'GITHUB_GIST',
}

/**
 * @since Added in 2.0.1
 */
export interface ActorEnvironmentVariable {
    /**
     * @since Added in 2.0.1
     */
    name?: string;
    /**
     * @since Added in 2.0.1
     */
    value?: string;
    /**
     * @since Added in 2.0.1
     */
    isSecret?: boolean;
}

/**
 * @since Added in 0.10.0
 */
export type ActorVersion = ActorVersionSourceFiles | ActorVersionGitRepo | ActorVersionTarball | ActorVersionGitHubGist;

/**
 * @since Added in 2.0.1
 */
export type FinalActorVersion = ActorVersion & Required<Pick<ActorVersion, 'versionNumber' | 'buildTag'>>;
