import { z } from 'zod';

import { STORAGE_OWNERSHIP_FILTER } from '@apify/consts';

import type { ApiClientSubResourceOptions } from '../base/api_client.js';
import { ResourceCollectionClient } from '../base/resource_collection_client.js';
import type { TimeoutOptions } from '../timeouts.js';
import type { PaginatedList, PaginationOptions } from '../utils.js';
import * as schemas from '../schemas.js';
import { optionalTimeoutSchema, timeoutOptionsShape } from '../timeouts.js';
import { anyObjectSchema, paginationOptionsShape, parseArgument } from '../utils.js';
import type { KeyValueStore } from './key_value_store.js';

const listOptionsSchema = z.strictObject({
    unnamed: z.boolean().optional(),
    ...paginationOptionsShape,
    desc: z.boolean().optional(),
    ownership: z.enum(STORAGE_OWNERSHIP_FILTER).optional(),
    ...timeoutOptionsShape,
});
const nameSchema = z.string().optional();
const schemaSchema = anyObjectSchema.optional();

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
     * @param options.timeout - Timeout for each API request. Default is `'medium'`.
     * @returns A paginated iterator of Key-value stores.
     * @see https://docs.apify.com/api/v2/key-value-stores-get
     */
    list(
        options: KeyValueStoreCollectionClientListOptions = {},
    ): Promise<KeyValueStoreCollectionListResult> & AsyncIterable<KeyValueStore> {
        const parsed = parseArgument(options, listOptionsSchema, 'KeyValueStoreCollectionClientListOptions');

        return this.listResourcesPaginated(schemas.ListOfKeyValueStores(), parsed, 'medium');
    }

    /**
     * Gets or creates a key-value store with the specified name.
     *
     * @param name - Name of the key-value store. If not provided, a default store is used.
     * @param options - Additional options like schema.
     * @param options.schema - Schema of the key-value store.
     * @param options.timeout - Timeout for the API request. Default is `'short'`.
     * @returns The key-value store object.
     * @see https://docs.apify.com/api/v2/key-value-stores-post
     */
    async getOrCreate(
        name?: string,
        options?: KeyValueStoreCollectionClientGetOrCreateOptions,
    ): Promise<KeyValueStore> {
        parseArgument(name, nameSchema);
        parseArgument(options?.schema, schemaSchema); // TODO: Add schema validation
        parseArgument(options?.timeout, optionalTimeoutSchema);

        // `timeout` is not part of the resource, so the body carries only the rest, and stays absent when
        // there is nothing else to send.
        const { timeout = 'short', ...resource } = options ?? {};
        const hasResource = Object.keys(resource).length > 0;

        return this.getOrCreateResource(schemas.KeyValueStore(), name, hasResource ? resource : undefined, timeout);
    }
}

export interface KeyValueStoreCollectionClientListOptions extends PaginationOptions, TimeoutOptions {
    unnamed?: boolean;
    desc?: boolean;
    /**
     * Filter by ownership: 'ownedByMe' returns only user's own key-value stores, 'sharedWithMe' returns only shared key-value stores.
     * @since Added in 2.22.1
     */
    ownership?: STORAGE_OWNERSHIP_FILTER;
}

/**
 * @since Added in 2.3.0
 */
export interface KeyValueStoreCollectionClientGetOrCreateOptions extends TimeoutOptions {
    schema?: Record<string, unknown>;
}

export type KeyValueStoreCollectionListResult = PaginatedList<KeyValueStore> & { unnamed: boolean };
