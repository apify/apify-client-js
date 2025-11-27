import ow from 'ow';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import type { PaginatedList, PaginationOptions } from '../utils';
import type { KeyValueStore } from './key_value_store';

export class KeyValueStoreCollectionClient extends ResourceCollectionClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'key-value-stores',
            ...options,
        });
    }

    /**
     * Lists all Key-value stores.
     *
     * @param options - Pagination options.
     * @returns A paginated iterator of Key-value stores.
     * @see https://docs.apify.com/api/v2/key-value-stores-get
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
    list(
        options: KeyValueStoreCollectionClientListOptions = {},
    ): Promise<PaginatedList<KeyValueStoreCollectionListResult>> & AsyncIterable<KeyValueStore> {
        ow(
            options,
            ow.object.exactShape({
                unnamed: ow.optional.boolean,
                limit: ow.optional.number,
                offset: ow.optional.number,
                desc: ow.optional.boolean,
            }),
        );

        return this._listPaginated(options);
    }

    /**
     * Gets or creates a Key-value store with the specified name.
     *
     * @param name - Name of the Key-value store. If not provided, a default store is used.
     * @param options - Additional options like schema.
     * @returns The Key-value store object.
     * @see https://docs.apify.com/api/v2/key-value-stores-post
     */
    async getOrCreate(
        name?: string,
        options?: KeyValueStoreCollectionClientGetOrCreateOptions,
    ): Promise<KeyValueStore> {
        ow(name, ow.optional.string);
        ow(options?.schema, ow.optional.object); // TODO: Add schema validatioon

        return this._getOrCreate(name, options);
    }
}

export interface KeyValueStoreCollectionClientListOptions extends PaginationOptions {
    unnamed?: boolean;
    desc?: boolean;
}

export interface KeyValueStoreCollectionClientGetOrCreateOptions {
    schema?: Record<string, unknown>;
}

export type KeyValueStoreCollectionListResult = Omit<KeyValueStore, 'stats'> & { username?: string };
