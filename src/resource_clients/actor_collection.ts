import { z } from 'zod';

import type { ACTOR_PERMISSION_LEVEL } from '@apify/consts';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import type { ActorCollectionListItem } from '../models';
import type { PaginatedIterator, PaginatedList, PaginationOptions } from '../utils';
import { anyObjectSchema, paginationOptionsShape, parseArgument } from '../utils';
import type { Actor, ActorDefaultRunOptions, ActorExampleRunInput, ActorStandby } from './actor';
import type { ActorVersion } from './actor_version';

const actorCreateSchema = anyObjectSchema.optional();

export type { ActorCollectionListItem } from '../models';

/**
 * Client for managing the collection of Actors in your account.
 *
 * Provides methods to list and create Actors. To access an individual Actor,
 * use the `actor()` method on the main ApifyClient.
 *
 * @example
 * ```javascript
 * const client = new ApifyClient({ token: 'my-token' });
 * const actorsClient = client.actors();
 *
 * // List all Actors
 * const { items } = await actorsClient.list();
 *
 * // Create a new Actor
 * const newActor = await actorsClient.create({
 *   name: 'my-actor',
 *   title: 'My Actor'
 * });
 * ```
 *
 * @see https://docs.apify.com/platform/actors
 */
export class ActorCollectionClient extends ResourceCollectionClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'actors',
            ...options,
        });
    }

    /**
     * Lists all Actors.
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
     * @returns A paginated iterator of Actors.
     * @see https://docs.apify.com/api/v2/acts-get
     */
    list(options: ActorCollectionListOptions = {}): PaginatedIterator<ActorCollectionListItem> {
        const parsed = parseArgument(options, listOptionsSchema, 'ActorCollectionListOptions');

        return this._listPaginated(parsed);
    }

    /**
     * Creates a new Actor.
     *
     * @param actor - The Actor data.
     * @returns The created Actor object.
     * @see https://docs.apify.com/api/v2/acts-post
     */
    async create(actor: ActorCollectionCreateOptions): Promise<Actor> {
        parseArgument(actor, actorCreateSchema);

        return this._create(actor);
    }
}

/**
 * @since Added in 2.12.6
 */
export enum ActorListSortBy {
    CREATED_AT = 'createdAt',
    LAST_RUN_STARTED_AT = 'stats.lastRunStartedAt',
}

// Declared below `ActorListSortBy` because it references it at module load time.
const listOptionsSchema = z.strictObject({
    my: z.boolean().optional(),
    ...paginationOptionsShape,
    desc: z.boolean().optional(),
    sortBy: z.enum(ActorListSortBy).optional(),
});

export interface ActorCollectionListOptions extends PaginationOptions {
    my?: boolean;
    desc?: boolean;
    /**
     * @since Added in 2.12.6
     */
    sortBy?: ActorListSortBy;
}

export type ActorCollectionListResult = PaginatedList<ActorCollectionListItem>;

export interface ActorCollectionCreateOptions {
    /**
     * @since Added in 2.8.6
     */
    categories?: string[];
    /**
     * @since Added in 2.8.6
     */
    defaultRunOptions?: ActorDefaultRunOptions;
    description?: string;
    /**
     * @since Added in 2.8.6
     */
    exampleRunInput?: ActorExampleRunInput;
    /**
     * @since Added in 2.8.6
     */
    isDeprecated?: boolean;
    isPublic?: boolean;
    name?: string;
    /** @deprecated Use defaultRunOptions.restartOnError instead */
    restartOnError?: boolean;
    /**
     * @since Added in 2.8.6
     */
    seoTitle?: string;
    /**
     * @since Added in 2.8.6
     */
    seoDescription?: string;
    title?: string;
    versions?: ActorVersion[];
    /**
     * @since Added in 2.9.5
     */
    actorStandby?: ActorStandby & {
        isEnabled: boolean;
    };
    /**
     * @since Added in next
     */
    actorPermissionLevel?: ACTOR_PERMISSION_LEVEL;
}
