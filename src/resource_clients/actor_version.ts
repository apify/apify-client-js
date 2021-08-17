import ow from 'ow';
import { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';

/**
 * @hideconstructor
 */
export class ActorVersionClient extends ResourceClient {
    constructor(options: ApiClientSubResourceOptions) {
        super({
            ...options,
            resourcePath: 'versions',
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/version-object/get-version
     */
    async get(): Promise<FinalActorVersion> {
        return this._get();
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/version-object/update-version
     */
    async update(newFields: ActorVersion): Promise<FinalActorVersion> {
        ow(newFields, ow.object);
        return this._update(newFields);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/version-object/delete-version
     */
    async delete(): Promise<void> {
        return this._delete();
    }
}

export interface BaseActorVersion<SourceType extends ActorSourceType> {
    versionNumber?: string;
    sourceType: SourceType;
    envVars?: ActorEnvironmentVariable[];
    baseDockerImage?: string;
    applyEnvVarsToBuild?: boolean;
    buildTag?: string;
}

export interface ActorVersionSourceCode extends BaseActorVersion<ActorSourceType.SourceCode> {
    sourceCode: string;
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
    SourceCode = 'SOURCE_CODE',
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

export type ActorVersion =
    | ActorVersionSourceCode
    | ActorVersionSourceFiles
    | ActorVersionGitRepo
    | ActorVersionTarball
    | ActorVersionGitHubGist;

export type FinalActorVersion = ActorVersion & Required<Pick<ActorVersion, 'versionNumber' | 'buildTag'>>;
