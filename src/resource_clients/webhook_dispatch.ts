import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import type { Webhook, WebhookEventType } from './webhook';

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
     * https://docs.apify.com/api/v2/webhook-dispatch-get
     */
    async get(): Promise<WebhookDispatch | undefined> {
        return this._get();
    }
}

export interface WebhookDispatch {
    id: string;
    userId: string;
    webhookId: string;
    createdAt: Date;
    status: WebhookDispatchStatus;
    eventType: WebhookEventType;
    calls: WebhookDispatchCall[];
    webhook: Pick<Webhook, 'requestUrl' | 'isAdHoc'>;
    eventData: WebhookDispatchEventData | null;
}

export enum WebhookDispatchStatus {
    Active = 'ACTIVE',
    Succeeded = 'SUCCEEDED',
    Failed = 'FAILED',
}

export interface WebhookDispatchCall {
    startedAt: Date;
    finishedAt: Date;
    errorMessage: string | null;
    responseStatus: number | null;
    responseBody: string | null;
}

export interface WebhookDispatchEventData {
    actorRunId?: string;
    actorId?: string;
    actorTaskId?: string;
    actorBuildId?: string;
}
