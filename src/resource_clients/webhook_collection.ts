import { z } from 'zod';

import type { ApiClientSubResourceOptions } from '../base/api_client.js';
import { ResourceCollectionClient } from '../base/resource_collection_client.js';
import type { PaginatedIterator, PaginationOptions } from '../utils.js';
import { anyObjectSchema, paginationOptionsShape, parseArgument } from '../utils.js';
import type { Webhook, WebhookUpdateData } from './webhook.js';

const listOptionsSchema = z.strictObject({
    ...paginationOptionsShape,
    desc: z.boolean().optional(),
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
     * @returns A paginated iterator of webhooks.
     * @see https://docs.apify.com/api/v2/webhooks-get
     */

    list(
        options: WebhookCollectionListOptions = {},
    ): PaginatedIterator<Omit<Webhook, 'payloadTemplate' | 'headersTemplate'>> {
        const parsed = parseArgument(options, listOptionsSchema, 'WebhookCollectionListOptions');

        return this._listPaginated(parsed);
    }

    /**
     * Creates a new webhook.
     *
     * @param webhook - The webhook data.
     * @returns The created webhook object.
     * @see https://docs.apify.com/api/v2/webhooks-post
     */
    async create(webhook?: WebhookUpdateData): Promise<Webhook> {
        parseArgument(webhook, webhookCreateSchema);

        return this._create(webhook);
    }
}

export interface WebhookCollectionListOptions extends PaginationOptions {
    desc?: boolean;
}
