import type { ApiClientSubResourceOptions } from '../base/api_client.js';
import { ResourceCollectionClient } from '../base/resource_collection_client.js';
import type { TimeoutOptions } from '../timeouts.js';
import type { PaginatedList, PaginationOptions } from '../utils.js';
import * as schemas from '../schemas.js';
import { optionalTimeoutSchema, timeoutOptionsSchema } from '../timeouts.js';
import { anyObjectSchema, parseArgument } from '../utils.js';
import type { ActorEnvironmentVariable } from './actor_version.js';

const actorEnvVarSchema = anyObjectSchema.optional();

/**
 * Client for managing the collection of environment variables for an Actor version.
 *
 * Environment variables are key-value pairs that are available to the Actor during execution.
 * This client provides methods to list and create environment variables.
 *
 * @example
 * ```javascript
 * const client = new ApifyClient({ token: 'my-token' });
 * const actorClient = client.actor('my-actor-id');
 * const versionClient = actorClient.version('0.1');
 *
 * // List all environment variables
 * const envVarsClient = versionClient.envVars();
 * const { items } = await envVarsClient.list();
 *
 * // Create a new environment variable
 * const newEnvVar = await envVarsClient.create({
 *   name: 'MY_VAR',
 *   value: 'my-value',
 *   isSecret: false
 * });
 * ```
 *
 * @see https://docs.apify.com/platform/actors/development/programming-interface/environment-variables
 * @since Added in 2.1.0
 */
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
     * @returns A paginated iterator of environment variables.
     * @see https://docs.apify.com/api/v2/act-version-env-vars-get
     */
    list(
        options: ActorEnvVarCollectionListOptions = {},
    ): Promise<ActorEnvVarListResult> & AsyncIterable<ActorEnvironmentVariable> {
        parseArgument(options.timeout, optionalTimeoutSchema);

        return this._listPaginated(schemas.ListOfEnvVars(), {}, options.timeout ?? 'short');
    }

    /**
     * Creates a new environment variable for this Actor version.
     *
     * @param actorEnvVar - The environment variable data.
     * @param options - Request options
     * @param options.timeout - Timeout for the API request. Default is `'short'`.
     * @returns The created environment variable object.
     * @see https://docs.apify.com/api/v2/act-version-env-vars-post
     */
    async create(
        actorEnvVar: ActorEnvironmentVariable,
        options: TimeoutOptions = {},
    ): Promise<ActorEnvironmentVariable> {
        parseArgument(actorEnvVar, actorEnvVarSchema);
        const { timeout = 'short' } = parseArgument(options, timeoutOptionsSchema, 'TimeoutOptions');

        return this._create(schemas.EnvVar(), actorEnvVar, timeout);
    }
}

/**
 * @deprecated No options are used in the current API implementation.
 * https://github.com/apify/apify-client-js/issues/799
 * @since Added in 2.1.0
 */
export interface ActorEnvVarCollectionListOptions extends PaginationOptions, TimeoutOptions {
    desc?: boolean;
}

/**
 * @since Added in 2.1.0
 */
export type ActorEnvVarListResult = Pick<PaginatedList<ActorEnvironmentVariable>, 'total' | 'items'>;
