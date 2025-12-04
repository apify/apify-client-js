import ow from 'ow';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import type { PaginatedList, PaginationOptions } from '../utils';
import type { RequestQueue } from './request_queue';

/**
 * Client for managing the collection of Request queues in your account.
 *
 * Request queues store URLs to be crawled and their metadata. This client provides methods
 * to list, create, or get request queues by name.
 *
 * @example
 * ```javascript
 * const client = new ApifyClient({ token: 'my-token' });
 * const queuesClient = client.requestQueues();
 *
 * // List all request queues
 * const { items } = await queuesClient.list();
 *
 * // Get or create a request queue by name
 * const queue = await queuesClient.getOrCreate('my-queue');
 * ```
 *
 * @see https://docs.apify.com/platform/storage/request-queue
 */
export class RequestQueueCollectionClient extends ResourceCollectionClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'request-queues',
            ...options,
        });
    }

    /**
     * Lists all Request queues.
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
     * @returns A paginated iterator of Request queues.
     * @see https://docs.apify.com/api/v2/request-queues-get
     */
    list(
        options: RequestQueueCollectionListOptions = {},
    ): Promise<RequestQueueCollectionListResult> & AsyncIterable<RequestQueue> {
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
     * Gets or creates a Request queue with the specified name.
     *
     * @param name - Name of the Request queue. If not provided, a default queue is used.
     * @returns The Request queue object.
     * @see https://docs.apify.com/api/v2/request-queues-post
     */
    async getOrCreate(name?: string): Promise<RequestQueue> {
        ow(name, ow.optional.string);

        return this._getOrCreate(name);
    }
}

export interface RequestQueueCollectionListOptions extends PaginationOptions {
    unnamed?: boolean;
    desc?: boolean;
}

export type RequestQueueCollectionListResult = PaginatedList<RequestQueue> & { unnamed: boolean };
