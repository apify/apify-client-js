import ow from 'ow';

import type { ApiClientOptionsWithOptionalResourcePath } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import type { PaginatedIterator, PaginatedList, PaginationOptions } from '../utils';
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
    list(options: BuildCollectionClientListOptions = {}): PaginatedIterator<BuildCollectionClientListItem> {
        ow(
            options,
            ow.object.exactShape({
                limit: ow.optional.number.not.negative,
                offset: ow.optional.number.not.negative,
                desc: ow.optional.boolean,
            }),
        );

        return this._listPaginated(options);
    }
}

export interface BuildCollectionClientListOptions extends PaginationOptions {
    desc?: boolean;
}

export type BuildCollectionClientListItem = Required<Pick<Build, 'id' | 'status' | 'startedAt' | 'finishedAt'>> &
    Partial<Pick<Build, 'meta' | 'usageTotalUsd'>>;

export type BuildCollectionClientListResult = PaginatedList<BuildCollectionClientListItem>;
