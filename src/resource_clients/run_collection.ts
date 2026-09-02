import { z } from 'zod';

import { ACTOR_JOB_STATUSES } from '@apify/consts';

import type { ApiClientOptionsWithOptionalResourcePath } from '../base/api_client.js';
import { ResourceCollectionClient } from '../base/resource_collection_client.js';
import type { PaginatedIterator, PaginationOptions } from '../utils.js';
import { paginationOptionsShape, parseArgument } from '../utils.js';
import type { ActorRunListItem } from './actor.js';

const jobStatusSchema = z.enum(ACTOR_JOB_STATUSES);
const listOptionsSchema = z.strictObject({
    ...paginationOptionsShape,
    desc: z.boolean().optional(),
    status: z.union([jobStatusSchema, z.array(jobStatusSchema)]).optional(),
    startedBefore: z.union([z.date(), z.string()]).optional(),
    startedAfter: z.union([z.date(), z.string()]).optional(),
});

/**
 * Client for managing the collection of Actor runs.
 *
 * Provides methods to list Actor runs across all Actors or for a specific Actor.
 * To access an individual run, use the `run()` method on the main ApifyClient.
 *
 * @example
 * ```javascript
 * const client = new ApifyClient({ token: 'my-token' });
 *
 * // List all runs
 * const runsClient = client.runs();
 * const { items } = await runsClient.list();
 *
 * // List runs for a specific Actor
 * const actorRunsClient = client.actor('my-actor-id').runs();
 * const { items: actorRuns } = await actorRunsClient.list();
 * ```
 *
 * @see https://docs.apify.com/platform/actors/running/runs-and-builds
 */
export class RunCollectionClient extends ResourceCollectionClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientOptionsWithOptionalResourcePath) {
        super({
            resourcePath: 'runs',
            ...options,
        });
    }

    /**
     * Lists all Actor runs.
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
     * @param options - Pagination and filtering options.
     * @returns A paginated iterator of Actor runs.
     * @see https://docs.apify.com/api/v2/actor-runs-get
     */
    list(options: RunCollectionListOptions = {}): PaginatedIterator<ActorRunListItem> {
        const parsed = parseArgument(options, listOptionsSchema, 'RunCollectionListOptions');

        return this._listPaginated(parsed);
    }
}

export interface RunCollectionListOptions extends PaginationOptions {
    desc?: boolean;
    status?:
        | (typeof ACTOR_JOB_STATUSES)[keyof typeof ACTOR_JOB_STATUSES]
        | (typeof ACTOR_JOB_STATUSES)[keyof typeof ACTOR_JOB_STATUSES][];
    /**
     * @since Added in 2.18.0
     */
    startedBefore?: Date | string;
    /**
     * @since Added in 2.18.0
     */
    startedAfter?: Date | string;
}
