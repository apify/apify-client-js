import ow from 'ow';
import type { JsonValue } from 'type-fest';
import { ApifyApiError } from '../apify_api_error';
import { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import { ApifyRequestConfig } from '../http_client';
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
        request: Omit<RequestQueueClientRequestSchema, 'id'>,
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

    async batchAddRequests(
        requests: Array<Omit<RequestQueueClientRequestSchema, 'id'>>,
        options: RequestQueueClientAddRequestOptions = {},
    ): Promise<RequestQueueClientBatchAddRequestsResult> {
        ow(requests, ow.array.ofType(ow.object.partialShape({
            id: ow.undefined,
        })).minLength(1).maxLength(25));

        ow(options, ow.object.exactShape({
            forefront: ow.optional.boolean,
        }));

        const response = await this.httpClient.call({
            url: this._url('requests/batch'),
            method: 'POST',
            data: requests,
            params: this._params({
                forefront: options.forefront,
                clientKey: this.clientKey,
            }),
        });

        return cast(parseDateFields(pluckData(response.data)));
    }

    protected async _batchAddRequestsWithRetries(
        requests: Array<Omit<RequestQueueClientRequestSchema, 'id'>>,
        options: RequestQueueClientBatchAddRequestOptions = {},
    ): Promise<RequestQueueClientBatchAddRequestsResult> {
        ow(requests, ow.array.ofType(ow.object.partialShape({
            id: ow.undefined,
        })).minLength(1).maxLength(25));

        ow(options, ow.object.partialShape({
            forefront: ow.optional.boolean,
            maxRetries: ow.optional.number.greaterThan(0),
            delayBetweenRetriesMillis: ow.optional.number.greaterThan(0),
        }));

        const {
            maxRetries = 9,
            delayBetweenRetriesMillis = 500,
        } = options;

        // Keep track of the requests that remain to be processed (in parameter format)
        let remainingRequests = requests;
        // Keep track of the requests that have been processed (in api format)
        let processedRequests: Array<ProcessedRequest> = [];
        // The requests we have not been able to process in the last call
        // ie. those we have not been able to process at all
        let unprocessedRequests: Array<UnprocessedRequest> = [];
        for (let i = 0; i < maxRetries; i++) {
            const response = await this.httpClient.call({
                url: this._url('requests/batch'),
                method: 'POST',
                data: remainingRequests,
                params: this._params({
                    forefront: options.forefront,
                    clientKey: this.clientKey,
                }),
            });
            const data = response.data.data as RequestQueueClientBatchAddRequestsResult;
            processedRequests = [...processedRequests, ...data.processedRequests];
            unprocessedRequests = data.unprocessedRequests;

            // Get unique keys of all requests processed so far
            const processedRequestsUniqueKeys = processedRequests.map(({ uniqueKey }) => uniqueKey);
            // Requests remaining to be processed are the all that remain
            // @ts-expect-error Undefined id - it seems to be added by ow validation
            remainingRequests = requests.filter(({ uniqueKey }) => !processedRequestsUniqueKeys.includes(uniqueKey));

            // Stop if all requests have been processed
            if (remainingRequests.length === 0) {
                break;
            }

            // Sleep for some time before trying again
            await new Promise((resolve) => setTimeout(resolve, delayBetweenRetriesMillis));
        }

        // TODO: Not sure how to do this properly in ts-friendly way
        const result = <unknown> { processedRequests, unprocessedRequests } as JsonValue;

        return cast(parseDateFields(result));
    }

    async batchAddRequestsConcurrently(
        requests: Array<Omit<RequestQueueClientRequestSchema, 'id'>>,
        options: RequestQueueClientBatchAddRequestOptions = {},
    ): Promise<RequestQueueClientBatchAddRequestsResult> {
        ow(requests, ow.array.ofType(ow.object.partialShape({
            id: ow.undefined,
        })).minLength(1));

        ow(options, ow.object.exactShape({
            forefront: ow.optional.boolean,
            maxRetries: ow.optional.number.greaterThan(0),
            delayBetweenRetriesMillis: ow.optional.number.greaterThan(0),
            concurrency: ow.optional.number.greaterThan(0),
        }));

        const {
            concurrency = 5,
        } = options;

        const operationsInProgress = [];
        const individualResults = [];

        // Send up to `concurrency` requests at once, wait for all of them to finish and repeat
        for (let i = 0; i < requests.length; i += 25) {
            const requestsInBatch = requests.slice(i, i + 25);
            operationsInProgress.push(this._batchAddRequestsWithRetries(requestsInBatch, options));
            if (operationsInProgress.length === concurrency) {
                individualResults.push(...(await Promise.all(operationsInProgress)));
                operationsInProgress.splice(0, operationsInProgress.length);
            }
        }
        // Get results from remaining operations
        individualResults.push(...(await Promise.all(operationsInProgress)));

        // Combine individual results together
        const result: RequestQueueClientBatchAddRequestsResult = {
            processedRequests: [],
            unprocessedRequests: [],
        };
        individualResults.forEach(({ processedRequests, unprocessedRequests }) => {
            result.processedRequests.push(...processedRequests);
            result.unprocessedRequests.push(...unprocessedRequests);
        });
        return result;
    }

    /**
     * https://docs.apify.com/api/v2#/reference/request-queues/request/get-request
     */
    async getRequest(id: string): Promise<RequestQueueClientGetRequestResult | undefined> {
        ow(id, ow.string);
        const requestOpts: ApifyRequestConfig = {
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
    async updateRequest(
        request: RequestQueueClientRequestSchema,
        options: RequestQueueClientAddRequestOptions = {},
    ): Promise<RequestQueueClientAddRequestResult> {
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
    expireAt?: string;
    totalRequestCount: number;
    handledRequestCount: number;
    pendingRequestCount: number;
    actId?: string;
    actRunId?: string;
    hadMultipleClients: boolean;
    stats: RequestQueueStats;
}

export interface RequestQueueStats {
    readCount?: number;
    writeCount?: number;
    deleteCount?: number;
    headItemReadCount?: number;
    storageBytes?: number;
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

export interface RequestQueueClientBatchAddRequestOptions {
    forefront?: boolean;
    maxRetries?: number;
    delayBetweenRetriesMillis?: number;
    concurrency?: number;
}

export interface RequestQueueClientRequestSchema {
    id: string;
    uniqueKey: string;
    url: string;
    method?: AllowedHttpMethods;
    payload?: string;
    retryCount?: number;
    errorMessages?: string[];
    headers?: Record<string, string>;
    userData?: Record<string, unknown>;
    handledAt?: string;
    noRetry?: boolean;
    loadedUrl?: string;
}

export interface RequestQueueClientAddRequestResult {
    requestId: string;
    wasAlreadyPresent: boolean;
    wasAlreadyHandled: boolean;
}

interface ProcessedRequest {
    uniqueKey: string;
    requestId: string;
    wasAlreadyPresent: boolean;
    wasAlreadyHandled: boolean;
}

interface UnprocessedRequest {
    uniqueKey: string;
    url: string;
    method?: AllowedHttpMethods;
}

export interface RequestQueueClientBatchAddRequestsResult {
    processedRequests: Array<ProcessedRequest>,
    unprocessedRequests: Array<UnprocessedRequest>,
}

export type RequestQueueClientGetRequestResult = Omit<RequestQueueClientListItem, 'retryCount'>

export type AllowedHttpMethods = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'TRACE' | 'OPTIONS' | 'CONNECT' | 'PATCH'
