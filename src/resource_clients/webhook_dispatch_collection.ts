import ow from 'ow';
import { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import { PaginatedList } from '../utils';
import { WebhookDispatch } from './webhook_dispatch';

/**
 * @hideconstructor
 */
export class WebhookDispatchCollectionClient extends ResourceCollectionClient {
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'webhook-dispatches',
            ...options,
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/webhook-dispatches/webhook-dispatches-collection/get-list-of-webhook-dispatches
     */
    async list(options: WebhookDispatchCollectionListOptions = {}): Promise<PaginatedList<WebhookDispatch>> {
        ow(options, ow.object.exactShape({
            limit: ow.optional.number,
            offset: ow.optional.number,
            desc: ow.optional.boolean,
        }));

        return this._list(options);
    }
}

export interface WebhookDispatchCollectionListOptions {
    limit?: number;
    offset?: number;
    desc?: boolean;
}
