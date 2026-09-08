import { z } from 'zod';

import type { ApiClientSubResourceOptions } from '../base/api_client.js';
import { ResourceCollectionClient } from '../base/resource_collection_client.js';
import type { TimeoutOptions } from '../timeouts.js';
import type { PaginatedIterator, PaginationOptions } from '../utils.js';
import * as schemas from '../schemas.js';
import { timeoutOptionsSchema, timeoutOptionsShape } from '../timeouts.js';
import { anyObjectSchema, paginationOptionsShape, parseArgument } from '../utils.js';
import type { Webhook, WebhookUpdateData } from './webhook.js';

const listOptionsSchema = z.strictObject({
    ...paginationOptionsShape,
    desc: z.boolean().optional(),
    ...timeoutOptionsShape,
});
const webhookCreateSchema = anyObjectSchema.optional();

/**
 * Client for managing the collection of Webhooks.
 *
 * Webhooks allow you to receive notifications when specific events occur in your Actors or tasks.
 * This client provides methods to list and create webhooks for specific Actors or tasks.
 *
 * @example
 * ```javascript
 * const client = new ApifyClient({ token: 'my-token' });
 *
 * // List webhooks for an Actor
 * const actorWebhooksClient = client.actor('my-actor-id').webhooks();
 * const { items } = await actorWebhooksClient.list();
 *
 * // Create a webhook
 * const newWebhook = await actorWebhooksClient.create({
 *   eventTypes: ['ACTOR.RUN.SUCCEEDED'],
 *   requestUrl: 'https://example.com/webhook'
 * });
 * ```
 *
 * @see https://docs.apify.com/platform/integrations/webhooks
 */
export class WebhookCollectionClient extends ResourceCollectionClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'webhooks',
            ...options,
        });
    }

    /**
     * Lists all Webhooks.
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
     * @param options - Pagination and sorting options.
     * @param options.timeout - Timeout for each API request. Default is `'medium'`.
     * @returns A paginated iterator of webhooks.
     * @see https://docs.apify.com/api/v2/webhooks-get
     */

    list(
        options: WebhookCollectionListOptions = {},
    ): PaginatedIterator<Omit<Webhook, 'payloadTemplate' | 'headersTemplate'>> {
        const parsed = parseArgument(options, listOptionsSchema, 'WebhookCollectionListOptions');

        return this._listPaginated(schemas.ListOfWebhooks(), parsed, 'medium');
    }

    /**
     * Creates a new webhook.
     *
     * @param webhook - The webhook data.
     * @param options - Request options
     * @param options.timeout - Timeout for the API request. Default is `'short'`.
     * @returns The created webhook object.
     * @see https://docs.apify.com/api/v2/webhooks-post
     */
    async create(webhook?: WebhookUpdateData, options: TimeoutOptions = {}): Promise<Webhook> {
        parseArgument(webhook, webhookCreateSchema);
        const { timeout = 'short' } = parseArgument(options, timeoutOptionsSchema, 'TimeoutOptions');

        return this._create(schemas.Webhook(), webhook, timeout);
    }
}

export interface WebhookCollectionListOptions extends PaginationOptions, TimeoutOptions {
    desc?: boolean;
}
