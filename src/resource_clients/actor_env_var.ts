import type { ApiClientSubResourceOptions } from '../base/api_client.js';
import { ResourceClient } from '../base/resource_client.js';
import type { TimeoutOptions } from '../timeouts.js';
import * as schemas from '../schemas.js';
import { timeoutOptionsSchema } from '../timeouts.js';
import { anyObjectSchema, parseArgument } from '../utils.js';
import type { ActorEnvironmentVariable } from './actor_version.js';

/**
 * Client for managing a specific Actor environment variable.
 *
 * Environment variables are key-value pairs that are available to the Actor during execution.
 * This client provides methods to get, update, and delete environment variables.
 *
 * @example
 * ```javascript
 * const client = new ApifyClient({ token: 'my-token' });
 * const actorClient = client.actor('my-actor-id');
 * const versionClient = actorClient.version('0.1');
 *
 * // Get an environment variable
 * const envVarClient = versionClient.envVar('MY_VAR');
 * const envVar = await envVarClient.get();
 *
 * // Update environment variable
 * await envVarClient.update({ value: 'new-value' });
 * ```
 *
 * @see https://docs.apify.com/platform/actors/development/programming-interface/environment-variables
 * @since Added in 2.1.0
 */
export class ActorEnvVarClient extends ResourceClient {
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
     * Retrieves the environment variable.
     *
     * @param options - Request options
     * @param options.timeoutSecs - Timeout for the API request. Default is `'short'`.
     * @returns The environment variable object, or `undefined` if it does not exist.
     * @see https://docs.apify.com/api/v2/act-version-env-var-get
     */
    async get(options: TimeoutOptions = {}): Promise<ActorEnvironmentVariable | undefined> {
        const { timeoutSecs = 'short' } = parseArgument(options, timeoutOptionsSchema, 'TimeoutOptions');

        return this.getResource(schemas.EnvVar(), {}, timeoutSecs);
    }

    /**
     * Updates the environment variable.
     *
     * @param actorEnvVar - The updated environment variable data.
     * @param options - Request options
     * @param options.timeoutSecs - Timeout for the API request. Default is `'short'`.
     * @returns The updated environment variable object.
     * @see https://docs.apify.com/api/v2/act-version-env-var-put
     */
    async update(
        actorEnvVar: ActorEnvironmentVariable,
        options: TimeoutOptions = {},
    ): Promise<ActorEnvironmentVariable> {
        parseArgument(actorEnvVar, anyObjectSchema);
        const { timeoutSecs = 'short' } = parseArgument(options, timeoutOptionsSchema, 'TimeoutOptions');

        return this.updateResource(schemas.EnvVar(), actorEnvVar, timeoutSecs);
    }

    /**
     * Deletes the environment variable.
     *
     * @param options - Request options
     * @param options.timeoutSecs - Timeout for the API request. Default is `'short'`.
     * @see https://docs.apify.com/api/v2/act-version-env-var-delete
     */
    async delete(options: TimeoutOptions = {}): Promise<void> {
        const { timeoutSecs = 'short' } = parseArgument(options, timeoutOptionsSchema, 'TimeoutOptions');

        return this.deleteResource(timeoutSecs);
    }
}
