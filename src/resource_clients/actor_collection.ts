import ow from 'ow';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import type { PaginatedList } from '../utils';
import type { Actor, ActorDefaultRunOptions, ActorExampleRunInput, ActorStandby } from './actor';
import type { ActorVersion } from './actor_version';

export class ActorCollectionClient extends ResourceCollectionClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'acts',
            ...options,
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/actor-collection/get-list-of-actors
     */
    async list(options: ActorCollectionListOptions = {}): Promise<ActorCollectionListResult> {
        ow(
            options,
            ow.object.exactShape({
                my: ow.optional.boolean,
                limit: ow.optional.number,
                offset: ow.optional.number,
                desc: ow.optional.boolean,
                sortBy: ow.optional.string.oneOf(Object.values(ActorListSortBy)),
            }),
        );

        return this._list(options);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/actor-collection/create-actor
     */
    async create(actor: ActorCollectionCreateOptions): Promise<Actor> {
        ow(actor, ow.optional.object);

        return this._create(actor);
    }
}

export enum ActorListSortBy {
    CREATED_AT = 'createdAt',
    LAST_RUN_STARTED_AT = 'stats.lastRunStartedAt',
}

export interface ActorCollectionListOptions {
    my?: boolean;
    limit?: number;
    offset?: number;
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
    restartOnError?: boolean;
    seoTitle?: string;
    seoDescription?: string;
    title?: string;
    versions?: ActorVersion[];
    actorStandby?: ActorStandby & {
        isEnabled: boolean;
    };
}
