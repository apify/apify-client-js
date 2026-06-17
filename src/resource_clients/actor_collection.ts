import ow from 'ow';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import type { PaginatedIterator, PaginatedList, PaginationOptions } from '../utils';
import type { Actor, ActorDefaultRunOptions, ActorExampleRunInput, ActorStandby } from './actor';
import type { ActorVersion } from './actor_version';

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
 * @since Added in 1.0.0
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
     * @since Added in 2.0.1
     */
    list(options: ActorCollectionListOptions = {}): PaginatedIterator<ActorCollectionListItem> {
        ow(
            options,
            ow.object.exactShape({
                my: ow.optional.boolean,
                limit: ow.optional.number.not.negative,
                offset: ow.optional.number.not.negative,
                desc: ow.optional.boolean,
                sortBy: ow.optional.string.oneOf(Object.values(ActorListSortBy)),
            }),
        );

        return this._listPaginated(options);
    }

    /**
     * Creates a new Actor.
     *
     * @param actor - The Actor data.
     * @returns The created Actor object.
     * @see https://docs.apify.com/api/v2/acts-post
     * @since Added in 2.0.1
     */
    async create(actor: ActorCollectionCreateOptions): Promise<Actor> {
        ow(actor, ow.optional.object);

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

/**
 * @since Added in 2.0.1
 */
export interface ActorCollectionListOptions extends PaginationOptions {
    my?: boolean;
    desc?: boolean;
    /**
     * @since Added in 2.12.6
     */
    sortBy?: ActorListSortBy;
}

/**
 * @since Added in 2.0.1
 */
export interface ActorCollectionListItem {
    id: string;
    createdAt: Date;
    modifiedAt: Date;
    name: string;
    username: string;
}

/**
 * @since Added in 2.0.1
 */
export type ActorCollectionListResult = PaginatedList<ActorCollectionListItem>;

/**
 * @since Added in 2.0.1
 */
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
}
