import ow from 'ow';
import { ApiClientOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import { PaginatedList } from '../utils';
import { ActorVersion } from './actor';

/**
 * @hideconstructor
 */
export class ActorVersionCollectionClient extends ResourceCollectionClient {
    constructor(options: ApiClientOptions) {
        super({
            ...options,
            resourcePath: 'versions',
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/version-collection/get-list-of-versions
     */
    async list(options: ActorVersionCollectionListOptions = {}): Promise<ActorVersionListResult> {
        ow(options, ow.object.exactShape({
            limit: ow.optional.number,
            offset: ow.optional.number,
            desc: ow.optional.boolean,
        }));
        return this._list(options);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/version-collection/create-version
     */
    async create(actorVersion: ActorVersion): Promise<ActorVersionCollectionListVersion> {
        ow(actorVersion, ow.optional.object);
        return this._create(actorVersion);
    }
}

export interface ActorVersionCollectionListOptions {
    limit?: number;
    offset?: number;
    desc?: boolean;
}

export type ActorVersionCollectionListVersion = ActorVersion & Required<Pick<ActorVersion, 'versionNumber' | 'sourceType' | 'buildTag'>>

export type ActorVersionListResult = Pick<PaginatedList<ActorVersionCollectionListVersion>, 'total' | 'items'>
