import { z } from 'zod';

import type { ACTOR_PERMISSION_LEVEL } from '@apify/consts';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import type { PaginatedIterator, PaginatedList, PaginationOptions } from '../utils';
import { anyObjectSchema, validate } from '../utils';
import type { Actor, ActorDefaultRunOptions, ActorExampleRunInput, ActorStandby } from './actor';
import type { ActorVersion } from './actor_version';

const actorCreateSchema = anyObjectSchema.optional();

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
        validate(listOptionsSchema, options);

        return this._listPaginated(options);
    }

    /**
     * Creates a new Actor.
     *
     * @param actor - The Actor data.
     * @returns The created Actor object.
     * @see https://docs.apify.com/api/v2/acts-post
     */
    async create(actor: ActorCollectionCreateOptions): Promise<Actor> {
        validate(actorCreateSchema, actor);

        return this._create(actor);
    }
}

export enum ActorListSortBy {
    CREATED_AT = 'createdAt',
    LAST_RUN_STARTED_AT = 'stats.lastRunStartedAt',
}

// Declared below `ActorListSortBy` because it references it at module load time.
const listOptionsSchema = z.strictObject({
    my: z.boolean().optional(),
    limit: z.number().min(0).optional(),
    offset: z.number().min(0).optional(),
    desc: z.boolean().optional(),
    sortBy: z.enum(ActorListSortBy).optional(),
});

export interface ActorCollectionListOptions extends PaginationOptions {
    my?: boolean;
    desc?: boolean;
    sortBy?: ActorListSortBy;
}

export interface ActorCollectionListItem {
    id: string;
    createdAt: Date;
    modifiedAt: Date;
    name: string;
    username: string;
}

export type ActorCollectionListResult = PaginatedList<ActorCollectionListItem>;

export interface ActorCollectionCreateOptions {
    categories?: string[];
    defaultRunOptions?: ActorDefaultRunOptions;
    description?: string;
    exampleRunInput?: ActorExampleRunInput;
    isDeprecated?: boolean;
    isPublic?: boolean;
    name?: string;
    /** @deprecated Use defaultRunOptions.restartOnError instead */
    restartOnError?: boolean;
    seoTitle?: string;
    seoDescription?: string;
    title?: string;
    versions?: ActorVersion[];
    actorStandby?: ActorStandby & {
        isEnabled: boolean;
    };
    actorPermissionLevel?: ACTOR_PERMISSION_LEVEL;
}
