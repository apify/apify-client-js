import type { ApiClientSubResourceOptions } from '../base/api_client.js';
import { ResourceCollectionClient } from '../base/resource_collection_client.js';
import type { TimeoutOptions } from '../timeouts.js';
import type { PaginatedList } from '../utils.js';
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
 *   sourceType: 'GIT_REPO',
 *   gitRepoUrl: 'https://github.com/my-account/my-actor',
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
     * The endpoint returns every version in one response, so awaiting the return value (as you would with a Promise)
     * gets the whole list.
     * ```javascript
     * const { items } = await client.list();
     * ```
     *
     * Asynchronous iteration is also supported, and yields the versions one by one.
     *
     * ```javascript
     * for await (const singleItem of client.list()) {...}
     * ```
     *
     * @param options - Request options
     * @param options.timeout - Timeout for the API request. Default is `'short'`.
     * @returns The Actor versions, awaitable as a whole list or iterable one by one.
     * @see https://docs.apify.com/api/v2/act-versions-get
     */
    list(options: TimeoutOptions = {}): Promise<ActorVersionListResult> & AsyncIterable<FinalActorVersion> {
        const { timeout = 'short' } = parseArgument(options, timeoutOptionsSchema, 'TimeoutOptions');

        return this.listResourcesPaginated(schemas.ListOfVersions(), {}, timeout);
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

        return this.createResource(schemas.Version(), actorVersion, timeout);
    }
}

export type ActorVersionListResult = Pick<PaginatedList<FinalActorVersion>, 'total' | 'items'>;
