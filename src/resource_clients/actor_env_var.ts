import ow from 'ow';
import { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import { ActorEnvironmentVariable } from './actor_version';

/**
 * @hideconstructor
 */
export class ActorEnvVarClient extends ResourceClient {
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'env-vars',
            ...options,
        });
    }

    /**
     * TODO: https://docs.apify.com/api/v2#/reference/actors/env-var-object/get-env-var
     */
    async get(): Promise<ActorEnvironmentVariable | undefined> {
        return this._get();
    }

    /**
     * TODO: https://docs.apify.com/api/v2#/reference/actors/env-var-object/update-env-var
     */
    async update(actorEnvVar: ActorEnvironmentVariable): Promise<ActorEnvironmentVariable> {
        ow(actorEnvVar, ow.object);
        return this._update(actorEnvVar);
    }

    /**
     * TODO: https://docs.apify.com/api/v2#/reference/actors/env-var-object/delete-env-var
     */
    async delete(): Promise<void> {
        return this._delete();
    }
}
