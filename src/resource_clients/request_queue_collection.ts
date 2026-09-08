import { z } from 'zod';

import { STORAGE_OWNERSHIP_FILTER } from '@apify/consts';

import type { ApiClientSubResourceOptions } from '../base/api_client.js';
import { ResourceCollectionClient } from '../base/resource_collection_client.js';
import type { TimeoutOptions } from '../timeouts.js';
import type { PaginatedList, PaginationOptions } from '../utils.js';
import * as schemas from '../schemas.js';
import { timeoutOptionsSchema, timeoutOptionsShape } from '../timeouts.js';
import { paginationOptionsShape, parseArgument } from '../utils.js';
import type { RequestQueue } from './request_queue.js';

const listOptionsSchema = z.strictObject({
    unnamed: z.boolean().optional(),
    ...paginationOptionsShape,
    desc: z.boolean().optional(),
    ownership: z.enum(STORAGE_OWNERSHIP_FILTER).optional(),
    ...timeoutOptionsShape,
});
const nameSchema = z.string().optional();

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
     * @param options.timeout - Timeout for each API request. Default is `'medium'`.
     * @returns A paginated iterator of Request queues.
     * @see https://docs.apify.com/api/v2/request-queues-get
     */
    list(
        options: RequestQueueCollectionListOptions = {},
    ): Promise<RequestQueueCollectionListResult> & AsyncIterable<RequestQueue> {
        const parsed = parseArgument(options, listOptionsSchema, 'RequestQueueCollectionListOptions');

        return this._listPaginated(schemas.ListOfRequestQueues(), parsed, 'medium');
    }

    /**
     * Gets or creates a Request queue with the specified name.
     *
     * @param name - Name of the Request queue. If not provided, a default queue is used.
     * @param options - Request options
     * @param options.timeout - Timeout for the API request. Default is `'short'`.
     * @returns The Request queue object.
     * @see https://docs.apify.com/api/v2/request-queues-post
     */
    async getOrCreate(name?: string, options: TimeoutOptions = {}): Promise<RequestQueue> {
        parseArgument(name, nameSchema);
        const { timeout = 'short' } = parseArgument(options, timeoutOptionsSchema, 'TimeoutOptions');

        return this._getOrCreate(schemas.RequestQueue(), name, undefined, timeout);
    }
}

export interface RequestQueueCollectionListOptions extends PaginationOptions, TimeoutOptions {
    unnamed?: boolean;
    desc?: boolean;
    /**
     * Filter by ownership: 'ownedByMe' returns only user's own request queues, 'sharedWithMe' returns only shared request queues.
     * @since Added in 2.22.1
     */
    ownership?: STORAGE_OWNERSHIP_FILTER;
}

export type RequestQueueCollectionListResult = PaginatedList<RequestQueue> & { unnamed: boolean };
