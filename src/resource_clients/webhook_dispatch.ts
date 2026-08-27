import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import type { WebhookDispatch } from '../models';
import * as schemas from '../schemas';

export type {
    WebhookDispatch,
    WebhookDispatchCall,
    WebhookDispatchEventData,
    WebhookDispatchWebhookSummary,
} from '../models';
export { WebhookDispatchStatus } from '../models';

/**
 * Client for managing a specific webhook dispatch.
 *
 * Webhook dispatches represent individual notifications sent by webhooks. This client provides
 * methods to retrieve details about a specific dispatch.
 *
 * @example
 * ```javascript
 * const client = new ApifyClient({ token: 'my-token' });
 * const webhookClient = client.webhook('my-webhook-id');
 *
 * // Get a specific dispatch
 * const dispatchClient = webhookClient.dispatches().get('dispatch-id');
 * const dispatch = await dispatchClient.get();
 * ```
 *
 * @see https://docs.apify.com/platform/integrations/webhooks
 */
export class WebhookDispatchClient extends ResourceClient {
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
     * Retrieves the webhook dispatch.
     *
     * @returns The webhook dispatch object, or `undefined` if it does not exist.
     * @see https://docs.apify.com/api/v2/webhook-dispatch-get
     */
    async get(): Promise<WebhookDispatch | undefined> {
        return this._get(schemas.WebhookDispatch);
    }
}
