import ow from 'ow';

import type { WEBHOOK_EVENT_TYPES } from '@apify/consts';

import type { ApifyApiError } from '../apify_api_error';
import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import type { ApifyRequestConfig } from '../http_client';
import { cast, catchNotFoundOrThrow, parseDateFields, pluckData } from '../utils';
import type { WebhookDispatch } from './webhook_dispatch';
import { WebhookDispatchCollectionClient } from './webhook_dispatch_collection';

export class WebhookClient extends ResourceClient {
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
     * Retrieves the webhook.
     *
     * @returns The webhook object, or `undefined` if it does not exist.
     * @see https://docs.apify.com/api/v2/webhook-get
     */
    async get(): Promise<Webhook | undefined> {
        return this._get();
    }

    /**
     * Updates the webhook with the specified fields.
     *
     * @param newFields - Fields to update.
     * @returns The updated webhook object.
     * @see https://docs.apify.com/api/v2/webhook-put
     */
    async update(newFields: WebhookUpdateData): Promise<Webhook> {
        ow(newFields, ow.object);

        return this._update(newFields);
    }

    /**
     * Deletes the webhook.
     *
     * @see https://docs.apify.com/api/v2/webhook-delete
     */
    async delete(): Promise<void> {
        return this._delete();
    }

    /**
     * Tests the webhook by dispatching a test event.
     *
     * @returns The webhook dispatch object, or `undefined` if the test fails.
     * @see https://docs.apify.com/api/v2/webhook-test-post
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
     * Returns a client for the dispatches of this webhook.
     *
     * @returns A client for the webhook's dispatches.
     * @see https://docs.apify.com/api/v2/webhook-webhook-dispatches-get
     */
    dispatches(): WebhookDispatchCollectionClient {
        return new WebhookDispatchCollectionClient(
            this._subResourceOptions({
                resourcePath: 'dispatches',
            }),
        );
    }
}

/**
 * Represents a webhook for receiving notifications about Actor events.
 *
 * Webhooks send HTTP POST requests to specified URLs when certain events occur
 * (e.g., Actor run succeeds, fails, or times out).
 */
export interface Webhook {
    id: string;
    userId: string;
    createdAt: Date;
    modifiedAt: Date;
    isAdHoc: boolean;
    eventTypes: WebhookEventType[];
    condition: WebhookCondition;
    ignoreSslErrors: boolean;
    doNotRetry: boolean;
    requestUrl: string;
    payloadTemplate: string;
    lastDispatch: string;
    stats: WebhookStats;
    shouldInterpolateStrings: boolean;
    isApifyIntegration?: boolean;
    headersTemplate?: string;
    description?: string;
}

export interface WebhookIdempotencyKey {
    idempotencyKey?: string;
}

/**
 * Data for updating a Webhook.
 */
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
        | 'shouldInterpolateStrings'
        | 'isApifyIntegration'
        | 'headersTemplate'
        | 'description'
    >
> &
    WebhookIdempotencyKey;

/**
 * Statistics about Webhook usage.
 */
export interface WebhookStats {
    totalDispatches: number;
}

/**
 * Event types that can trigger webhooks.
 */
export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[keyof typeof WEBHOOK_EVENT_TYPES];

/**
 * Condition that determines when a webhook should be triggered.
 */
export type WebhookCondition =
    | WebhookAnyRunOfActorCondition
    | WebhookAnyRunOfActorTaskCondition
    | WebhookCertainRunCondition;

export interface WebhookAnyRunOfActorCondition {
    actorId: string;
}

export interface WebhookAnyRunOfActorTaskCondition {
    actorTaskId: string;
}

export interface WebhookCertainRunCondition {
    actorRunId: string;
}
