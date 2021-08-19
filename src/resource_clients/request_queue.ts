import ow from 'ow';
import ApifyApiError from '../apify_api_error';
import { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import {
    pluckData,
    parseDateFields,
    catchNotFoundOrThrow,
    cast,
} from '../utils';

/**
 * @hideconstructor
 */
export class RequestQueueClient extends ResourceClient {
    private clientKey?: string;

    constructor(options: ApiClientSubResourceOptions, userOptions: RequestQueueUserOptions = {}) {
        super({
            resourcePath: 'request-queues',
            ...options,
        });

        this.clientKey = userOptions.clientKey;
    }

    /**
     * https://docs.apify.com/api/v2#/reference/request-queues/queue/get-request-queue
     */
    async get(): Promise<RequestQueue | undefined> {
        return this._get();
    }

    /**
     * https://docs.apify.com/api/v2#/reference/request-queues/queue/update-request-queue
     */
    async update(newFields: RequestQueueClientUpdateOptions): Promise<RequestQueue> {
        ow(newFields, ow.object);
        return this._update(newFields);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/request-queues/queue/delete-request-queue
     */
    async delete(): Promise<void> {
        return this._delete();
    }

    /**
     * https://docs.apify.com/api/v2#/reference/request-queues/queue-head/get-head
     */
    async listHead(options: RequestQueueClientListHeadOptions = {}): Promise<RequestQueueClientListHeadResult> {
        ow(options, ow.object.exactShape({
            limit: ow.optional.number,
        }));
        const response = await this.httpClient.call({
            url: this._url('head'),
            method: 'GET',
            params: this._params({
                limit: options.limit,
                clientKey: this.clientKey,
            }),
        });
        return cast(parseDateFields(pluckData(response.data)));
    }

    /**
     * https://docs.apify.com/api/v2#/reference/request-queues/request-collection/add-request
     */
    async addRequest(
        request: RequestQueueClientAddRequestData,
        options: RequestQueueClientAddRequestOptions = {},
    ): Promise<RequestQueueClientAddRequestResult> {
        ow(request, ow.object.partialShape({
            id: ow.undefined,
        }));

        ow(options, ow.object.exactShape({
            forefront: ow.optional.boolean,
        }));

        const response = await this.httpClient.call({
            url: this._url('requests'),
            method: 'POST',
            data: request,
            params: this._params({
                forefront: options.forefront,
                clientKey: this.clientKey,
            }),
        });

        return cast(parseDateFields(pluckData(response.data)));
    }

    /**
     * https://docs.apify.com/api/v2#/reference/request-queues/request/get-request
     * @return {Promise<?object>}
     */
    async getRequest(id: string): Promise<RequestQueueClientGetRequestResult | undefined> {
        ow(id, ow.string);
        const requestOpts = {
            url: this._url(`requests/${id}`),
            method: 'GET',
            params: this._params(),
        };
        try {
            const response = await this.httpClient.call(requestOpts);
            return cast(parseDateFields(pluckData(response.data)));
        } catch (err) {
            catchNotFoundOrThrow(err as ApifyApiError);
        }

        return undefined;
    }

    /**
     * https://docs.apify.com/api/v2#/reference/request-queues/request/update-request
     */
    async updateRequest(request, options: RequestQueueClientAddRequestOptions = {}): Promise<RequestQueueClientAddRequestResult> {
        ow(request, ow.object.partialShape({
            id: ow.string,
        }));
        ow(options, ow.object.exactShape({
            forefront: ow.optional.boolean,
        }));

        const response = await this.httpClient.call({
            url: this._url(`requests/${request.id}`),
            method: 'PUT',
            data: request,
            params: this._params({
                forefront: options.forefront,
                clientKey: this.clientKey,
            }),
        });

        return cast(parseDateFields(pluckData(response.data)));
    }

    async deleteRequest(id: string): Promise<void> {
        ow(id, ow.string);

        await this.httpClient.call({
            url: this._url(`requests/${id}`),
            method: 'DELETE',
            params: this._params({
                clientKey: this.clientKey,
            }),
        });
    }
}

export interface RequestQueueUserOptions {
    clientKey?: string;
}

export interface RequestQueue {
    id: string;
    name?: string;
    userId: string;
    createdAt: string;
    modifiedAt: string;
    accessedAt: string;
    // TODO: expiresAt: string;
    totalRequestCount: number;
    handledRequestCount: number;
    pendingRequestCount: number;
    hadMultipleClients: boolean;
    // TODO: actId, actRunId, stats are also present in the API, not the docs
}

export interface RequestQueueClientUpdateOptions {
    name: string;
}

export interface RequestQueueClientListHeadOptions {
    limit?: number;
}

export interface RequestQueueClientListHeadResult {
    limit: number;
    queueModifiedAt: string;
    hadMultipleClients: boolean;
    items: RequestQueueClientListItem[];
}

export interface RequestQueueClientListItem {
    id: string;
    retryCount: number;
    uniqueKey: string;
    url: string;
    method: string;
}

export interface RequestQueueClientAddRequestOptions {
    forefront?: boolean;
}

export interface RequestQueueClientAddRequestData {
    method?: string;
    uniqueKey?: string;
    url: string;
}

export interface RequestQueueClientAddRequestResult {
    requestId: string;
    wasAlreadyPresent: boolean;
    wasAlreadyHandled: boolean;
}

export type RequestQueueClientGetRequestResult = Omit<RequestQueueClientListItem, 'retryCount'>
