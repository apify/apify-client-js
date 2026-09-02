import { z } from 'zod';

import type { ApiClientOptionsWithOptionalResourcePath } from '../base/api_client.js';
import { ResourceCollectionClient } from '../base/resource_collection_client.js';
import type { BuildCollectionClientListItem } from '../models.js';
import type { PaginatedIterator, PaginatedList, PaginationOptions } from '../utils.js';
import { paginationOptionsShape, parseArgument } from '../utils.js';

export type { BuildCollectionClientListItem } from '../models.js';

const listOptionsSchema = z.strictObject({
    ...paginationOptionsShape,
    desc: z.boolean().optional(),
});

/**
 * Client for managing the collection of Actor builds.
 *
 * Provides methods to list Actor builds across all Actors or for a specific Actor.
 * To access an individual build, use the `build()` method on the main ApifyClient.
 *
 * @example
 * ```javascript
 * const client = new ApifyClient({ token: 'my-token' });
 *
 * // List all builds
 * const buildsClient = client.builds();
 * const { items } = await buildsClient.list();
 *
 * // List builds for a specific Actor
 * const actorBuildsClient = client.actor('my-actor-id').builds();
 * const { items: actorBuilds } = await actorBuildsClient.list();
 * ```
 *
 * @see https://docs.apify.com/platform/actors/running/runs-and-builds#builds
 */
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
     * Lists all Actor builds.
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
     * @param options - Pagination and sorting options.
     * @returns A paginated iterator of Actor builds.
     * @see https://docs.apify.com/api/v2/actor-builds-get
     */
    list(options: BuildCollectionClientListOptions = {}): PaginatedIterator<BuildCollectionClientListItem> {
        const parsed = parseArgument(options, listOptionsSchema, 'BuildCollectionClientListOptions');

        return this._listPaginated(parsed);
    }
}

export interface BuildCollectionClientListOptions extends PaginationOptions {
    desc?: boolean;
}

export type BuildCollectionClientListResult = PaginatedList<BuildCollectionClientListItem>;
