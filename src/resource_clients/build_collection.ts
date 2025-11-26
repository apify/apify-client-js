import ow from 'ow';

import type { ApiClientOptionsWithOptionalResourcePath } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import type { PaginatedList } from '../utils';
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
     */
    list(
        options: BuildCollectionClientListOptions = {},
    ): Promise<PaginatedList<BuildCollectionClientListItem>> & AsyncIterable<BuildCollectionClientListItem> {
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
}

export interface BuildCollectionClientListOptions {
    limit?: number;
    offset?: number;
    desc?: boolean;
}

export type BuildCollectionClientListItem = Required<Pick<Build, 'id' | 'status' | 'startedAt' | 'finishedAt'>> &
    Partial<Pick<Build, 'meta' | 'usageTotalUsd'>>;

export type BuildCollectionClientListResult = PaginatedList<BuildCollectionClientListItem>;
