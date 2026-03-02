import ow from 'ow';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import type { PaginatedList, PaginationOptions } from '../utils';
import type { ActorVersion, FinalActorVersion } from './actor_version';

/**
 * Client for managing the collection of Actor versions.
 *
 * Actor versions represent specific builds or snapshots of an Actor's code. This client provides
 * methods to list and create versions for a specific Actor.
 *
 * @example
 * ```javascript
 * const client = new ApifyClient({ token: 'my-token' });
 * const actorClient = client.actor('my-actor-id');
 *
 * // List all versions
 * const versionsClient = actorClient.versions();
 * const { items } = await versionsClient.list();
 *
 * // Create a new version
 * const newVersion = await versionsClient.create({
 *   versionNumber: '0.2',
 *   buildTag: 'latest'
 * });
 * ```
 *
 * @see https://docs.apify.com/platform/actors/development/actor-definition/versions
 */
export class ActorVersionCollectionClient extends ResourceCollectionClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'versions',
            ...options,
        });
    }

    /**
     * Lists all Actor versions.
     *
     * Awaiting the return value (as you would with a Promise) will result in a single API call. The amount of fetched
     * items in a single API call is limited.
     * ```javascript
     * const paginatedList = await client.list();
     *```
     *
     * Asynchronous iteration is also supported. This will fetch additional pages if needed until all items are
     * retrieved.
     *
     * ```javascript
     * for await (const singleItem of client.list()) {...}
     * ```
     *
     * @returns A paginated iterator of Actor versions.
     * @see https://docs.apify.com/api/v2/act-versions-get
     */
    list(
        _options: ActorVersionCollectionListOptions = {},
    ): Promise<ActorVersionListResult> & AsyncIterable<FinalActorVersion> {
        return this._listPaginated();
    }

    /**
     * Creates a new Actor version.
     *
     * @param actorVersion - The Actor version data.
     * @returns The created Actor version object.
     * @see https://docs.apify.com/api/v2/act-versions-post
     */
    async create(actorVersion: ActorVersion): Promise<FinalActorVersion> {
        ow(actorVersion, ow.optional.object);

        return this._create(actorVersion);
    }
}

/**
 * @deprecated No options are used in the current API implementation.
 * https://github.com/apify/apify-client-js/issues/799
 */
export interface ActorVersionCollectionListOptions extends PaginationOptions {
    desc?: boolean;
}

export type ActorVersionListResult = Pick<PaginatedList<FinalActorVersion>, 'total' | 'items'>;
