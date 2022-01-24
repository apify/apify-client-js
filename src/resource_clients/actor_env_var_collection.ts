import ow from 'ow';
import { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import { PaginatedList } from '../utils';
import { ActorEnvironmentVariable } from './actor_version';

/**
 * @hideconstructor
 */
export class ActorEnvVarCollectionClient extends ResourceCollectionClient {
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'env-vars',
            ...options,
        });
    }

    /**
     * TODO: https://docs.apify.com/api/v2#/reference/actors/env-var-collection/get-list-of-env-vars
     */
    async list(options: ActorEnvVarCollectionListOptions = {}): Promise<ActorEnvVarListResult> {
        ow(options, ow.object.exactShape({
            limit: ow.optional.number,
            offset: ow.optional.number,
            desc: ow.optional.boolean,
        }));
        return this._list(options);
    }

    /**
     * TODO: https://docs.apify.com/api/v2#/reference/actors/env-var-collection/create-env-var
     */
    async create(actorEnvVar: ActorEnvironmentVariable): Promise<ActorEnvironmentVariable> {
        ow(actorEnvVar, ow.optional.object);
        return this._create(actorEnvVar);
    }
}

export interface ActorEnvVarCollectionListOptions {
    limit?: number;
    offset?: number;
    desc?: boolean;
}

export type ActorEnvVarListResult = Pick<PaginatedList<ActorEnvironmentVariable>, 'total' | 'items'>
