import ow from 'ow';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import type { PaginatedIterator, PaginationOptions } from '../utils';
import type { Webhook, WebhookUpdateData } from './webhook';

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
     * https://docs.apify.com/api/v2/webhooks-get
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
        options: WebhookCollectionListOptions = {},
    ): PaginatedIterator<Omit<Webhook, 'payloadTemplate' | 'headersTemplate'>> {
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
     * https://docs.apify.com/api/v2/webhooks-post
     */
    async create(webhook?: WebhookUpdateData): Promise<Webhook> {
        ow(webhook, ow.optional.object);

        return this._create(webhook);
    }
}

export interface WebhookCollectionListOptions extends PaginationOptions {
    desc?: boolean;
}
