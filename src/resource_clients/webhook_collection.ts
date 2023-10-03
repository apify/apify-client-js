import ow from 'ow';
import { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import { PaginatedList } from '../utils';
import { Webhook, WebhookUpdateData } from './webhook';

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
     * https://docs.apify.com/api/v2#/reference/webhooks/webhook-collection/get-list-of-webhooks
     */
    async list(options: WebhookCollectionListOptions = {}): Promise<PaginatedList<Omit<Webhook, 'payloadTemplate' | 'headersTemplate'>>> {
        ow(options, ow.object.exactShape({
            limit: ow.optional.number,
            offset: ow.optional.number,
            desc: ow.optional.boolean,
        }));

        return this._list(options);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/webhooks/webhook-collection/create-webhook
     */
    async create(webhook?: WebhookUpdateData): Promise<Webhook> {
        ow(webhook, ow.optional.object);

        return this._create(webhook);
    }
}

export interface WebhookCollectionListOptions {
    limit?: number;
    offset?: number;
    desc?: boolean;
}
