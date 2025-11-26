import ow from 'ow';

import { ACTOR_JOB_STATUSES } from '@apify/consts';

import type { ApiClientOptionsWithOptionalResourcePath } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import type { PaginatedList } from '../utils';
import type { ActorRunListItem } from './actor';

export class RunCollectionClient extends ResourceCollectionClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientOptionsWithOptionalResourcePath) {
        super({
            resourcePath: 'runs',
            ...options,
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/run-collection/get-list-of-runs
     */
    list(
        options: RunCollectionListOptions = {},
    ): Promise<PaginatedList<ActorRunListItem>> & AsyncIterable<ActorRunListItem> {
        ow(
            options,
            ow.object.exactShape({
                limit: ow.optional.number,
                offset: ow.optional.number,
                desc: ow.optional.boolean,
                status: ow.optional.any(
                    ow.string.oneOf(Object.values(ACTOR_JOB_STATUSES)),
                    ow.array.ofType(ow.string.oneOf(Object.values(ACTOR_JOB_STATUSES))),
                ),
                startedBefore: ow.optional.any(ow.optional.date, ow.optional.string),
                startedAfter: ow.optional.any(ow.optional.date, ow.optional.string),
            }),
        );

        return this._getIterablePagination(options);
    }
}

export interface RunCollectionListOptions {
    limit?: number;
    offset?: number;
    desc?: boolean;
    status?:
        | (typeof ACTOR_JOB_STATUSES)[keyof typeof ACTOR_JOB_STATUSES]
        | (typeof ACTOR_JOB_STATUSES)[keyof typeof ACTOR_JOB_STATUSES][];
    startedBefore?: Date | string;
    startedAfter?: Date | string;
}
