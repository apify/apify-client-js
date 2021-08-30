import { WEBHOOK_EVENT_TYPES } from '@apify/consts';
import ow from 'ow';
import { ResourceClient } from '../base/resource_client';
import { WebhookDispatchCollectionClient } from './webhook_dispatch_collection';
import {
    pluckData,
    parseDateFields,
    catchNotFoundOrThrow,
    cast,
} from '../utils';
import { ApiClientSubResourceOptions } from '../base/api_client';
import { ApifyApiError } from '../apify_api_error';
import { WebhookDispatch } from './webhook_dispatch';
import { ApifyRequestConfig } from '../http_client';

/**
 * @hideconstructor
 */
export class WebhookClient extends ResourceClient {
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'webhooks',
            ...options,
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/webhooks/webhook-object/get-webhook
     */
    async get(): Promise<Webhook | undefined> {
        return this._get();
    }

    /**
     * https://docs.apify.com/api/v2#/reference/webhooks/webhook-object/update-webhook
     */
    async update(newFields: WebhookUpdateData): Promise<Webhook> {
        ow(newFields, ow.object);

        return this._update(newFields);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/webhooks/webhook-object/delete-webhook
     */
    async delete(): Promise<void> {
        return this._delete();
    }

    /**
     * https://docs.apify.com/api/v2#/reference/webhooks/webhook-test/test-webhook
     */
    async test(): Promise<WebhookDispatch | undefined> {
        const request: ApifyRequestConfig = {
            url: this._url('test'),
            method: 'POST',
            params: this._params(),
        };

        try {
            const response = await this.httpClient.call(request);
            return cast(parseDateFields(pluckData(response.data)));
        } catch (err) {
            catchNotFoundOrThrow(err as ApifyApiError);
        }

        return undefined;
    }

    /**
     * https://docs.apify.com/api/v2#/reference/webhooks/dispatches-collection
     */
    dispatches(): WebhookDispatchCollectionClient {
        return new WebhookDispatchCollectionClient(this._subResourceOptions({
            resourcePath: 'dispatches',
        }));
    }
}

export interface Webhook {
    id: string;
    userId: string;
    createdAt: string;
    modifiedAt: string;
    isAdHoc: boolean;
    eventTypes: WebhookEventType[];
    condition: WebhookCondition;
    ignoreSslErrors: boolean;
    doNotRetry: boolean;
    requestUrl: string;
    payloadTemplate: string;
    lastDispatch: string;
    stats: WebhookStats;
}

export interface WebhookIdempotencyKey {
    idempotencyKey?: string;
}

export type WebhookUpdateData = Partial<
    Pick<
        Webhook,
        | 'isAdHoc'
        | 'eventTypes'
        | 'condition'
        | 'ignoreSslErrors'
        | 'doNotRetry'
        | 'requestUrl'
        | 'payloadTemplate'
    >
> & WebhookIdempotencyKey;

export interface WebhookStats {
    totalDispatches: number;
}

export type WebhookEventType = keyof typeof WEBHOOK_EVENT_TYPES;

export type WebhookCondition = WebhookAnyRunOfActorCondition | WebhookAnyRunOfActorTaskCondition | WebhookCertainRunCondition;

export interface WebhookAnyRunOfActorCondition {
    actorId: string;
}

export interface WebhookAnyRunOfActorTaskCondition {
    actorTaskId: string;
}

export interface WebhookCertainRunCondition {
    actorRunId: string;
}
