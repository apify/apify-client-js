import ow from 'ow';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import type { PaginatedList } from '../utils';
import type { ActorVersion, FinalActorVersion } from './actor_version';

export class ActorVersionCollectionClient extends ResourceCollectionClient {
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
     * https://docs.apify.com/api/v2#/reference/actors/version-collection/get-list-of-versions
     */
    list(
        options: ActorVersionCollectionListOptions = {},
    ): Promise<ActorVersionListResult> & AsyncIterable<FinalActorVersion> {
        ow(
            options,
            ow.object.exactShape({
                limit: ow.optional.number,
                offset: ow.optional.number,
                desc: ow.optional.boolean,
            }),
        );

        return this._getIterablePagination(options);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/version-collection/create-version
     */
    async create(actorVersion: ActorVersion): Promise<FinalActorVersion> {
        ow(actorVersion, ow.optional.object);

        return this._create(actorVersion);
    }
}

export interface ActorVersionCollectionListOptions {
    limit?: number;
    offset?: number;
    desc?: boolean;
}

export type ActorVersionListResult = Pick<PaginatedList<FinalActorVersion>, 'total' | 'items'>;
