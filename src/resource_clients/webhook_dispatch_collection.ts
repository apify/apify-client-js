import ow from 'ow';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import type { PaginatedIterator, PaginationOptions } from '../utils';
import type { WebhookDispatch } from './webhook_dispatch';

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
     *
     * Asynchronous iteration is also supported. This will fetch additional pages if needed until all items are
     * retrieved.
     *
     * @param options - Pagination and sorting options.
     * @returns A paginated iterator of webhook dispatches.
     * @see https://docs.apify.com/api/v2/webhook-dispatches-get
     *
     * @example
     * ```javascript
     * const paginatedList = await client.list(options);
     * ```
     *
     * @example
     * ```javascript
     * for await (const singleItem of client.list(options)) {...}
     * ```
     */
    list(options: WebhookDispatchCollectionListOptions = {}): PaginatedIterator<WebhookDispatch> {
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
}

export interface WebhookDispatchCollectionListOptions extends PaginationOptions {
    desc?: boolean;
}
