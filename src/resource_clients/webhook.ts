import type { ApifyApiError } from '../apify_api_error.js';
import type { ApiClientSubResourceOptions } from '../base/api_client.js';
import { ResourceClient } from '../base/resource_client.js';
import type { ApifyRequestConfig } from '../http_client.js';
import type { Webhook, WebhookEventType } from '../models.js';
import * as schemas from '../schemas.js';
import { anyObjectSchema, catchNotFoundOrThrow, parseArgument, parseResponse } from '../utils.js';
import type { WebhookDispatch } from './webhook_dispatch.js';
import { WebhookDispatchCollectionClient } from './webhook_dispatch_collection.js';

export type {
    Webhook,
    WebhookAnyRunOfActorCondition,
    WebhookAnyRunOfActorTaskCondition,
    WebhookCertainRunCondition,
    WebhookCondition,
    WebhookEventType,
    WebhookLastDispatch,
    WebhookStats,
} from '../models.js';

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
     */
    async get(): Promise<Webhook | undefined> {
        return this._get(schemas.Webhook);
    }

    /**
     * Updates the webhook with the specified fields.
     *
     * @param newFields - Fields to update.
     * @returns The updated webhook object.
     * @see https://docs.apify.com/api/v2/webhook-put
     */
    async update(newFields: WebhookUpdateData): Promise<Webhook> {
        parseArgument(newFields, anyObjectSchema);

        return this._update(schemas.Webhook, newFields);
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
            return parseResponse(response, schemas.WebhookDispatch);
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

export interface WebhookIdempotencyKey {
    idempotencyKey?: string;
}

/**
 * Data for updating a webhook.
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
