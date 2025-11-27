import ow from 'ow';

import type { ApiClientOptionsWithOptionalResourcePath } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import type { PaginatedIterator, PaginatedList } from '../utils';
import type { Build } from './build';

export class BuildCollectionClient extends ResourceCollectionClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientOptionsWithOptionalResourcePath) {
        super({
            ...options,
            resourcePath: options.resourcePath || 'actor-builds',
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/build-collection/get-list-of-builds
     *
     * Use as a promise. It will always do only 1 API call:
     * const paginatedList = await client.list(options);
     *
     * Use as an async iterator. It can do multiple API calls if needed:
     * for await (const singleItem of client.list(options)) {...}
     *
     */
    list(options: BuildCollectionClientListOptions = {}): PaginatedIterator<BuildCollectionClientListItem> {
        ow(
            options,
            ow.object.exactShape({
                limit: ow.optional.number,
                offset: ow.optional.number,
                desc: ow.optional.boolean,
            }),
        );

        return this._getPaginatedIterator(options);
    }
}

export interface BuildCollectionClientListOptions {
    limit?: number;
    offset?: number;
    desc?: boolean;
}

export type BuildCollectionClientListItem = Required<Pick<Build, 'id' | 'status' | 'startedAt' | 'finishedAt'>> &
    Partial<Pick<Build, 'meta' | 'usageTotalUsd'>>;

export type BuildCollectionClientListResult = PaginatedList<BuildCollectionClientListItem>;
