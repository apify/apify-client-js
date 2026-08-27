import { z } from 'zod';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import type { PaginatedIterator, PaginationOptions } from '../utils';
import * as schemas from '../schemas';
import { paginationOptionsShape, parseArgument } from '../utils';
import type { WebhookDispatch } from './webhook_dispatch';

const listOptionsSchema = z.strictObject({
    ...paginationOptionsShape,
    desc: z.boolean().optional(),
});

/**
 * Client for managing the collection of webhook dispatches.
 *
 * Webhook dispatches represent individual notifications sent by a webhook. This client provides
 * methods to list all dispatches for a specific webhook.
 *
 * @example
 * ```javascript
 * const client = new ApifyClient({ token: 'my-token' });
 * const webhookClient = client.webhook('my-webhook-id');
 *
 * // List all dispatches for this webhook
 * const dispatchesClient = webhookClient.dispatches();
 * const { items } = await dispatchesClient.list();
 * ```
 *
 * @see https://docs.apify.com/platform/integrations/webhooks
 */
export class WebhookDispatchCollectionClient extends ResourceCollectionClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'webhook-dispatches',
            ...options,
        });
    }

    /**
     * Lists all webhook dispatches.
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
     * @returns A paginated iterator of webhook dispatches.
     * @see https://docs.apify.com/api/v2/webhook-dispatches-get
     */
    list(options: WebhookDispatchCollectionListOptions = {}): PaginatedIterator<WebhookDispatch> {
        const parsed = parseArgument(options, listOptionsSchema, 'WebhookDispatchCollectionListOptions');

        return this._listPaginated(schemas.ListOfWebhookDispatches, parsed);
    }
}

export interface WebhookDispatchCollectionListOptions extends PaginationOptions {
    desc?: boolean;
}
