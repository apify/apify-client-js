import ow from 'ow';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import type { PaginatedList, PaginationOptions } from '../utils';
import type { ActorEnvironmentVariable } from './actor_version';

export class ActorEnvVarCollectionClient extends ResourceCollectionClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'env-vars',
            ...options,
        });
    }

    /**
     * Lists all environment variables of this Actor version.
     *
     * @param options - Pagination options.
     * @returns A paginated iterator of environment variables.
     * @see https://docs.apify.com/api/v2/act-version-env-vars-get
     *
     * Awaiting the return value (as you would with a Promise) will result in a single API call. The amount of fetched
     * items in a single API call is limited.
     * ```javascript
     * const paginatedList = await client.list(options);
     *```
     *
     * Asynchronous iteration is also supported. This will fetch additional pages if needed until all items are
     * retrieved.
     *
     * ```javascript
     * for await (const singleItem of client.list(options)) {...}
     * ```
     */
    list(
        options: ActorEnvVarCollectionListOptions = {},
    ): Promise<ActorEnvVarListResult> & AsyncIterable<ActorEnvironmentVariable> {
        ow(
            options,
            ow.object.exactShape({
                limit: ow.optional.number,
                offset: ow.optional.number,
                desc: ow.optional.boolean,
            }),
        );
        return this._listPaginated(options);
    }

    /**
     * Creates a new environment variable for this Actor version.
     *
     * @param actorEnvVar - The environment variable data.
     * @returns The created environment variable object.
     * @see https://docs.apify.com/api/v2/act-version-env-vars-post
     */
    async create(actorEnvVar: ActorEnvironmentVariable): Promise<ActorEnvironmentVariable> {
        ow(actorEnvVar, ow.optional.object);
        return this._create(actorEnvVar);
    }
}

export interface ActorEnvVarCollectionListOptions extends PaginationOptions {
    desc?: boolean;
}

export type ActorEnvVarListResult = Pick<PaginatedList<ActorEnvironmentVariable>, 'total' | 'items'>;
