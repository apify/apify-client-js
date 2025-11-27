import ow from 'ow';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import type { ActorEnvironmentVariable } from './actor_version';

export class ActorEnvVarClient extends ResourceClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'env-vars',
            ...options,
        });
    }

    /**
     * Retrieves the environment variable.
     *
     * @returns The environment variable object, or `undefined` if it does not exist.
     * @see https://docs.apify.com/api/v2/act-version-env-var-get
     */
    async get(): Promise<ActorEnvironmentVariable | undefined> {
        return this._get();
    }

    /**
     * Updates the environment variable.
     *
     * @param actorEnvVar - The updated environment variable data.
     * @returns The updated environment variable object.
     * @see https://docs.apify.com/api/v2/act-version-env-var-put
     */
    async update(actorEnvVar: ActorEnvironmentVariable): Promise<ActorEnvironmentVariable> {
        ow(actorEnvVar, ow.object);
        return this._update(actorEnvVar);
    }

    /**
     * Deletes the environment variable.
     *
     * @see https://docs.apify.com/api/v2/act-version-env-var-delete
     */
    async delete(): Promise<void> {
        return this._delete();
    }
}
