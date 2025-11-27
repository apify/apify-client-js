import ow from 'ow';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import { ActorEnvVarClient } from './actor_env_var';
import { ActorEnvVarCollectionClient } from './actor_env_var_collection';

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

export interface BaseActorVersion<SourceType extends ActorSourceType> {
    versionNumber?: string;
    sourceType: SourceType;
    envVars?: ActorEnvironmentVariable[];
    applyEnvVarsToBuild?: boolean;
    buildTag?: string;
}

export interface ActorVersionSourceFiles extends BaseActorVersion<ActorSourceType.SourceFiles> {
    sourceFiles: ActorVersionSourceFile[];
}

export interface ActorVersionSourceFile {
    name: string;
    format: 'TEXT' | 'BASE64';
    content: string;
}

export interface ActorVersionGitRepo extends BaseActorVersion<ActorSourceType.GitRepo> {
    gitRepoUrl: string;
}

export interface ActorVersionTarball extends BaseActorVersion<ActorSourceType.Tarball> {
    tarballUrl: string;
}

export interface ActorVersionGitHubGist extends BaseActorVersion<ActorSourceType.GitHubGist> {
    gitHubGistUrl: string;
}

export enum ActorSourceType {
    SourceFiles = 'SOURCE_FILES',
    GitRepo = 'GIT_REPO',
    Tarball = 'TARBALL',
    GitHubGist = 'GITHUB_GIST',
}

export interface ActorEnvironmentVariable {
    name?: string;
    value?: string;
    isSecret?: boolean;
}

export type ActorVersion = ActorVersionSourceFiles | ActorVersionGitRepo | ActorVersionTarball | ActorVersionGitHubGist;

export type FinalActorVersion = ActorVersion & Required<Pick<ActorVersion, 'versionNumber' | 'buildTag'>>;
