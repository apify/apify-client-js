import ow from 'ow';

import { ACTOR_JOB_STATUSES } from '@apify/consts';

import type { ApiClientOptionsWithOptionalResourcePath } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import type { PaginatedIterator, PaginationOptions } from '../utils';
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
     *
     * Awaiting the return value (as you would with a Promise) will result in a single API call. The amount of fetched
     * items in a single API call is limited.
     * ```javascript
     * const paginatedList = await client.list(options);
     *```
     *
     * Asynchronous iteration is also supported. This will fetch additional pages if needed until all items are
     * retrieved.
     *
     * ```javascript
     * for await (const singleItem of client.list(options)) {...}
     * ```
     */
    list(options: RunCollectionListOptions = {}): PaginatedIterator<ActorRunListItem> {
        ow(
            options,
            ow.object.exactShape({
                limit: ow.optional.number.not.negative,
                offset: ow.optional.number.not.negative,
                desc: ow.optional.boolean,
                status: ow.optional.any(
                    ow.string.oneOf(Object.values(ACTOR_JOB_STATUSES)),
                    ow.array.ofType(ow.string.oneOf(Object.values(ACTOR_JOB_STATUSES))),
                ),
                startedBefore: ow.optional.any(ow.optional.date, ow.optional.string),
                startedAfter: ow.optional.any(ow.optional.date, ow.optional.string),
            }),
        );

        return this._listPaginated(options);
    }
}

export interface RunCollectionListOptions extends PaginationOptions {
    desc?: boolean;
    status?:
        | (typeof ACTOR_JOB_STATUSES)[keyof typeof ACTOR_JOB_STATUSES]
        | (typeof ACTOR_JOB_STATUSES)[keyof typeof ACTOR_JOB_STATUSES][];
    startedBefore?: Date | string;
    startedAfter?: Date | string;
}
