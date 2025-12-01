import ow from 'ow';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import type { PaginatedIterator, PaginatedList, PaginationOptions } from '../utils';
import type { Dataset } from './dataset';

export class DatasetCollectionClient extends ResourceCollectionClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'datasets',
            ...options,
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/datasets/dataset-collection/get-list-of-datasets
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
    list(options: DatasetCollectionClientListOptions = {}): PaginatedIterator<Dataset> {
        this._changeZeroPaginationOptionsToUndefined(options)
        ow(
            options,
            ow.object.exactShape({
                unnamed: ow.optional.boolean,
                limit: ow.optional.number.positive,
                offset: ow.optional.number.greaterThan(0),
                desc: ow.optional.boolean,
            }),
        );

        return this._listPaginated(options);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/datasets/dataset-collection/create-dataset
     */
    async getOrCreate(name?: string, options?: DatasetCollectionClientGetOrCreateOptions): Promise<Dataset> {
        ow(name, ow.optional.string);
        ow(options?.schema, ow.optional.object); // TODO: Add schema validatioon

        return this._getOrCreate(name, options);
    }
}

export interface DatasetCollectionClientListOptions extends PaginationOptions {
    unnamed?: boolean;
    desc?: boolean;
}

export interface DatasetCollectionClientGetOrCreateOptions {
    schema?: Record<string, unknown>;
}

export type DatasetCollectionClientListResult = PaginatedList<Dataset>;
