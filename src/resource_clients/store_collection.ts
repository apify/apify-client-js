import { z } from 'zod';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import type { ActorStoreList } from '../models';
import type { PaginatedIterator, PaginationOptions } from '../utils';
import * as schemas from '../schemas';
import { paginationOptionsShape, parseArgument } from '../utils';

export type { ActorStoreList, PricingInfo } from '../models';

const listOptionsSchema = z.strictObject({
    ...paginationOptionsShape,
    search: z.string().optional(),
    sortBy: z.string().optional(),
    category: z.string().optional(),
    username: z.string().optional(),
    pricingModel: z.string().optional(),
    includeUnrunnableActors: z.boolean().optional(),
});

/**
 * Client for browsing Actors in the Apify Store.
 *
 * The Apify Store contains publicly available Actors that can be used by anyone.
 * This client provides methods to search and list Actors from the Store.
 *
 * @example
 * ```javascript
 * const client = new ApifyClient();
 * const storeClient = client.store();
 *
 * // Search for Actors in the Store
 * const { items } = await storeClient.list({ search: 'web scraper' });
 *
 * // Get details about a specific Store Actor
 * const actor = await storeClient.list({ username: 'apify', actorName: 'web-scraper' });
 * ```
 *
 * @see https://docs.apify.com/platform/actors/publishing
 * @since Added in 2.7.2
 */
export class StoreCollectionClient extends ResourceCollectionClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'store',
            ...options,
        });
    }

    /**
     * Lists Actors from the Apify Store.
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
     * @param options - Search and pagination options.
     * @returns A paginated iterator of store Actors.
     * @see https://docs.apify.com/api/v2/store-get
     */
    list(options: StoreCollectionListOptions = {}): PaginatedIterator<ActorStoreList> {
        const parsed = parseArgument(options, listOptionsSchema, 'StoreCollectionListOptions');

        return this._listPaginated(schemas.ListOfStoreActors, parsed);
    }
}

/**
 * @since Added in 2.7.2
 */
export interface StoreCollectionListOptions extends PaginationOptions {
    search?: string;
    sortBy?: string;
    category?: string;
    username?: string;
    pricingModel?: string;
    /**
     * If true, the response will include Actors that cannot be run (e.g., Actors
     * that require a linked integration account that the current user does not have).
     * @since Added in 2.23.0
     */
    includeUnrunnableActors?: boolean;
}
