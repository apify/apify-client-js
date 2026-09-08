import type { ApiClientSubResourceOptions } from '../base/api_client.js';
import { ResourceCollectionClient } from '../base/resource_collection_client.js';
import type { TimeoutOptions } from '../timeouts.js';
import type { PaginatedList, PaginationOptions } from '../utils.js';
import * as schemas from '../schemas.js';
import { timeoutOptionsSchema } from '../timeouts.js';
import { anyObjectSchema, parseArgument } from '../utils.js';
import type { ActorVersion, FinalActorVersion } from './actor_version.js';

const actorVersionSchema = anyObjectSchema.optional();

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
 * @see https://docs.apify.com/api/v2/act-versions-get
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
     * @param options - Request options. The API ignores pagination for this endpoint, so only `timeout` applies.
     * @param options.timeout - Timeout for each API request. Default is `'short'`.
     * @returns A paginated iterator of Actor versions.
     * @see https://docs.apify.com/api/v2/act-versions-get
     */
    list(
        options: ActorVersionCollectionListOptions = {},
    ): Promise<ActorVersionListResult> & AsyncIterable<FinalActorVersion> {
        return this._listPaginated(schemas.ListOfVersions(), {}, options.timeout ?? 'short');
    }

    /**
     * Creates a new Actor version.
     *
     * @param actorVersion - The Actor version data.
     * @param options - Request options
     * @param options.timeout - Timeout for the API request. Default is `'short'`.
     * @returns The created Actor version object.
     * @see https://docs.apify.com/api/v2/act-versions-post
     */
    async create(actorVersion: ActorVersion, options: TimeoutOptions = {}): Promise<FinalActorVersion> {
        parseArgument(actorVersion, actorVersionSchema);
        const { timeout = 'short' } = parseArgument(options, timeoutOptionsSchema, 'TimeoutOptions');

        return this._create(schemas.Version(), actorVersion, timeout);
    }
}

/**
 * @deprecated No options are used in the current API implementation.
 * https://github.com/apify/apify-client-js/issues/799
 */
export interface ActorVersionCollectionListOptions extends PaginationOptions, TimeoutOptions {
    desc?: boolean;
}

export type ActorVersionListResult = Pick<PaginatedList<FinalActorVersion>, 'total' | 'items'>;
