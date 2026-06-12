import ow from 'ow';

import type { WEBHOOK_EVENT_TYPES } from '@apify/consts';

import type { ApifyApiError } from '../apify_api_error';
import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import type { ApifyRequestConfig } from '../http_client';
import { cast, catchNotFoundOrThrow, parseDateFields, pluckData } from '../utils';
import type { WebhookDispatch } from './webhook_dispatch';
import { WebhookDispatchCollectionClient } from './webhook_dispatch_collection';

/**
 * Client for managing a specific webhook.
 *
 * Webhooks allow you to receive notifications when specific events occur in your Actors or tasks.
 * This client provides methods to get, update, delete, and test webhooks, as well as retrieve
 * webhook dispatches.
 *
 * @example
 * ```javascript
 * const client = new ApifyClient({ token: 'my-token' });
 * const webhookClient = client.webhook('my-webhook-id');
 *
 * // Get webhook details
 * const webhook = await webhookClient.get();
 *
 * // Update webhook
 * await webhookClient.update({
 *   isEnabled: true,
 *   eventTypes: ['ACTOR.RUN.SUCCEEDED'],
 *   requestUrl: 'https://example.com/webhook'
 * });
 *
 * // Test webhook
 * await webhookClient.test();
 * ```
 *
 * @see https://docs.apify.com/platform/integrations/webhooks
 * @since Added in 1.0.0
 */
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
     * @since Added in 2.0.1
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
     * @since Added in 2.0.1
     */
    async update(newFields: WebhookUpdateData): Promise<Webhook> {
        ow(newFields, ow.object);

        return this._update(newFields);
    }

    /**
     * Deletes the webhook.
     *
     * @see https://docs.apify.com/api/v2/webhook-delete
     * @since Added in 2.0.1
     */
    async delete(): Promise<void> {
        return this._delete();
    }

    /**
     * Tests the webhook by dispatching a test event.
     *
     * @returns The webhook dispatch object, or `undefined` if the test fails.
     * @see https://docs.apify.com/api/v2/webhook-test-post
     * @since Added in 2.0.1
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
     * @since Added in 2.0.1
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
 * @since Added in 0.5.8
 */
export interface Webhook {
    /**
     * @since Added in 2.0.1
     */
    id: string;
    /**
     * @since Added in 2.0.1
     */
    userId: string;
    /**
     * @since Added in 2.0.1
     */
    createdAt: Date;
    /**
     * @since Added in 2.0.1
     */
    modifiedAt: Date;
    /**
     * @since Added in 2.0.1
     */
    isAdHoc: boolean;
    /**
     * @since Added in 2.0.1
     */
    eventTypes: WebhookEventType[];
    /**
     * @since Added in 2.0.1
     */
    condition: WebhookCondition;
    /**
     * @since Added in 2.0.1
     */
    ignoreSslErrors: boolean;
    /**
     * @since Added in 2.0.1
     */
    doNotRetry: boolean;
    /**
     * @since Added in 2.0.1
     */
    requestUrl: string;
    /**
     * @since Added in 2.0.1
     */
    payloadTemplate: string;
    /**
     * @since Added in 2.0.1
     */
    lastDispatch: string;
    /**
     * @since Added in 2.0.1
     */
    stats: WebhookStats;
    /**
     * @since Added in 2.7.2
     */
    shouldInterpolateStrings: boolean;
    /**
     * @since Added in 2.9.4
     */
    isApifyIntegration?: boolean;
    /**
     * @since Added in 2.8.1
     */
    headersTemplate?: string;
    /**
     * @since Added in 2.8.1
     */
    description?: string;
}

/**
 * @since Added in 2.0.1
 */
export interface WebhookIdempotencyKey {
    /**
     * @since Added in 2.0.1
     */
    idempotencyKey?: string;
}

/**
 * Data for updating a webhook.
 * @since Added in 2.0.1
 */
export type WebhookUpdateData = Partial<
    Pick<
        Webhook,
        | 'isAdHoc'
        | 'condition'
        | 'ignoreSslErrors'
        | 'doNotRetry'
        | 'requestUrl'
        | 'payloadTemplate'
        | 'shouldInterpolateStrings'
        | 'isApifyIntegration'
        | 'headersTemplate'
        | 'description'
    > & {
        // Input only: the client doesn't mutate the array, so accept a `readonly`
        // one too (the `Webhook` response keeps `eventTypes` mutable).
        eventTypes: readonly WebhookEventType[];
    }
> &
    WebhookIdempotencyKey;

/**
 * Statistics about webhook usage.
 * @since Added in 2.0.1
 */
export interface WebhookStats {
    /**
     * @since Added in 2.0.1
     */
    totalDispatches: number;
}

/**
 * Event types that can trigger webhooks.
 * @since Added in 2.0.1
 */
export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[keyof typeof WEBHOOK_EVENT_TYPES];

/**
 * Condition that determines when a webhook should be triggered.
 * @since Added in 2.0.1
 */
export type WebhookCondition =
    | WebhookAnyRunOfActorCondition
    | WebhookAnyRunOfActorTaskCondition
    | WebhookCertainRunCondition;

/**
 * @since Added in 2.0.1
 */
export interface WebhookAnyRunOfActorCondition {
    /**
     * @since Added in 2.0.1
     */
    actorId: string;
}

/**
 * @since Added in 2.0.1
 */
export interface WebhookAnyRunOfActorTaskCondition {
    /**
     * @since Added in 2.0.1
     */
    actorTaskId: string;
}

/**
 * @since Added in 2.0.1
 */
export interface WebhookCertainRunCondition {
    /**
     * @since Added in 2.0.1
     */
    actorRunId: string;
}
