import type { ApiClientSubResourceOptions } from '../base/api_client.js';
import { ResourceClient } from '../base/resource_client.js';
import type { Webhook, WebhookEventType } from '../models.js';
import type { TimeoutOptions } from '../timeouts.js';
import * as schemas from '../schemas.js';
import { timeoutOptionsSchema } from '../timeouts.js';
import { anyObjectSchema, parseArgument, parseResponse } from '../utils.js';
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
     * @param options - Request options
     * @param options.timeout - Timeout for the API request. Default is `'short'`.
     * @returns The webhook object, or `undefined` if it does not exist.
     * @see https://docs.apify.com/api/v2/webhook-get
     */
    async get(options: TimeoutOptions = {}): Promise<Webhook | undefined> {
        const { timeout = 'short' } = parseArgument(options, timeoutOptionsSchema, 'TimeoutOptions');

        return this.getResource(schemas.Webhook(), {}, timeout);
    }

    /**
     * Updates the webhook with the specified fields.
     *
     * @param newFields - Fields to update.
     * @param options - Request options
     * @param options.timeout - Timeout for the API request. Default is `'short'`.
     * @returns The updated webhook object.
     * @see https://docs.apify.com/api/v2/webhook-put
     */
    async update(newFields: WebhookUpdateData, options: TimeoutOptions = {}): Promise<Webhook> {
        parseArgument(newFields, anyObjectSchema);
        const { timeout = 'short' } = parseArgument(options, timeoutOptionsSchema, 'TimeoutOptions');

        return this.updateResource(schemas.Webhook(), newFields, timeout);
    }

    /**
     * Deletes the webhook.
     *
     * @param options - Request options
     * @param options.timeout - Timeout for the API request. Default is `'short'`.
     * @see https://docs.apify.com/api/v2/webhook-delete
     */
    async delete(options: TimeoutOptions = {}): Promise<void> {
        const { timeout = 'short' } = parseArgument(options, timeoutOptionsSchema, 'TimeoutOptions');

        return this.deleteResource(timeout);
    }

    /**
     * Tests the webhook by dispatching a test event.
     *
     * @param options - Request options
     * @param options.timeout - Timeout for the API request. Default is `'medium'`.
     * @returns The webhook dispatch object.
     * @see https://docs.apify.com/api/v2/webhook-test-post
     */
    async test(options: TimeoutOptions = {}): Promise<WebhookDispatch> {
        const { timeout = 'medium' } = parseArgument(options, timeoutOptionsSchema, 'TimeoutOptions');

        const response = await this.httpClient.call({
            url: this.buildUrl('test'),
            method: 'POST',
            params: this.buildParams(),
            timeout,
        });
        return parseResponse(response, schemas.WebhookDispatch());
    }

    /**
     * Returns a client for the dispatches of this webhook.
     *
     * @returns A client for the webhook's dispatches.
     * @see https://docs.apify.com/api/v2/webhook-webhook-dispatches-get
     */
    dispatches(): WebhookDispatchCollectionClient {
        return new WebhookDispatchCollectionClient(
            this.subResourceOptions({
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
