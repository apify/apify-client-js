import ow from 'ow';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import type { PaginatedIterator, PaginationOptions } from '../utils';
import type { ActorStats } from './actor';

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
     * @see https://docs.apify.com/api/v2/store-actors-get
     */
    list(options: StoreCollectionListOptions = {}): PaginatedIterator<ActorStoreList> {
        ow(
            options,
            ow.object.exactShape({
                limit: ow.optional.number.not.negative,
                offset: ow.optional.number.not.negative,
                search: ow.optional.string,
                sortBy: ow.optional.string,
                category: ow.optional.string,
                username: ow.optional.string,
                pricingModel: ow.optional.string,
            }),
        );

        return this._listPaginated(options);
    }
}

export interface PricingInfo {
    pricingModel: string;
}

export interface ActorStoreList {
    id: string;
    name: string;
    username: string;
    title?: string;
    description?: string;
    stats: ActorStats;
    currentPricingInfo: PricingInfo;
    pictureUrl?: string;
    userPictureUrl?: string;
    url: string;
    /** A brief, LLM-generated readme summary **/
    readmeSummary?: string;
}

export interface StoreCollectionListOptions extends PaginationOptions {
    search?: string;
    sortBy?: string;
    category?: string;
    username?: string;
    pricingModel?: string;
}
