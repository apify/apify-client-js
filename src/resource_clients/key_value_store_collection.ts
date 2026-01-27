import ow from 'ow';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import { StorageOwnership } from '../utils';
import type { PaginatedList, PaginationOptions } from '../utils';
import type { KeyValueStore } from './key_value_store';

/**
 * Client for managing the collection of Key-value stores in your account.
 *
 * Key-value stores are used to store arbitrary data records or files. This client provides
 * methods to list, create, or get key-value stores by name.
 *
 * @example
 * ```javascript
 * const client = new ApifyClient({ token: 'my-token' });
 * const storesClient = client.keyValueStores();
 *
 * // List all key-value stores
 * const { items } = await storesClient.list();
 *
 * // Get or create a key-value store by name
 * const store = await storesClient.getOrCreate('my-store');
 * ```
 *
 * @see https://docs.apify.com/platform/storage/key-value-store
 */
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
     * Awaiting the return value (as you would with a Promise) will result in a single API call. The amount of fetched
     * items in a single API call is limited.
     * ```javascript
     * const paginatedList = await client.list(options);
     * ```
     *
     * Asynchronous iteration is also supported. This will fetch additional pages if needed until all items are
     * retrieved.
     *
     * ```javascript
     * for await (const singleItem of client.list(options)) {...}
     * ```
     *
     * @param options - Pagination options.
     * @returns A paginated iterator of Key-value stores.
     * @see https://docs.apify.com/api/v2/key-value-stores-get
     */
    list(
        options: KeyValueStoreCollectionClientListOptions = {},
    ): Promise<KeyValueStoreCollectionListResult> & AsyncIterable<KeyValueStore> {
        ow(
            options,
            ow.object.exactShape({
                unnamed: ow.optional.boolean,
                limit: ow.optional.number.not.negative,
                offset: ow.optional.number.not.negative,
                desc: ow.optional.boolean,
                ownership: ow.optional.string.oneOf(Object.values(StorageOwnership)),
            }),
        );

        return this._listPaginated(options);
    }

    /**
     * Gets or creates a key-value store with the specified name.
     *
     * @param name - Name of the key-value store. If not provided, a default store is used.
     * @param options - Additional options like schema.
     * @returns The key-value store object.
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
    /** Filter by ownership: 'ownedByMe' returns only user's own key-value stores, 'sharedWithMe' returns only shared key-value stores. */
    ownership?: StorageOwnership;
}

export interface KeyValueStoreCollectionClientGetOrCreateOptions {
    schema?: Record<string, unknown>;
}

export type KeyValueStoreCollectionListResult = PaginatedList<KeyValueStore> & { unnamed: boolean };
