import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import type { Webhook, WebhookEventType } from './webhook';

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
 * @since Added in 1.0.0
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
     * @since Added in 2.0.1
     */
    async get(): Promise<WebhookDispatch | undefined> {
        return this._get();
    }
}

/**
 * @since Added in 0.5.8
 */
export interface WebhookDispatch {
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
    webhookId: string;
    /**
     * @since Added in 2.0.1
     */
    createdAt: Date;
    /**
     * @since Added in 2.0.1
     */
    status: WebhookDispatchStatus;
    /**
     * @since Added in 2.0.1
     */
    eventType: WebhookEventType;
    /**
     * @since Added in 2.0.1
     */
    calls: WebhookDispatchCall[];
    /**
     * @since Added in 2.0.1
     */
    webhook: Pick<Webhook, 'requestUrl' | 'isAdHoc'>;
    /**
     * @since Added in 2.13.0
     */
    eventData: WebhookDispatchEventData | null;
}

/**
 * @since Added in 2.0.1
 */
export enum WebhookDispatchStatus {
    /**
     * @since Added in 2.0.1
     */
    Active = 'ACTIVE',
    /**
     * @since Added in 2.0.1
     */
    Succeeded = 'SUCCEEDED',
    /**
     * @since Added in 2.0.1
     */
    Failed = 'FAILED',
}

/**
 * @since Added in 2.0.1
 */
export interface WebhookDispatchCall {
    /**
     * @since Added in 2.0.1
     */
    startedAt: Date;
    /**
     * @since Added in 2.0.1
     */
    finishedAt: Date;
    /**
     * @since Added in 2.0.1
     */
    errorMessage: string | null;
    /**
     * @since Added in 2.0.1
     */
    responseStatus: number | null;
    /**
     * @since Added in 2.0.1
     */
    responseBody: string | null;
}

/**
 * @since Added in 2.13.0
 */
export interface WebhookDispatchEventData {
    /**
     * @since Added in 2.13.0
     */
    actorRunId?: string;
    /**
     * @since Added in 2.13.0
     */
    actorId?: string;
    /**
     * @since Added in 2.13.0
     */
    actorTaskId?: string;
    /**
     * @since Added in 2.13.0
     */
    actorBuildId?: string;
}
