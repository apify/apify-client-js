import log from '@apify/log';
import ow from 'ow';
import type { JsonObject } from 'type-fest';
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

// TODO: Move to apify shared consts, when all batch requests operations will implemented.
const MAX_REQUESTS_PER_BATCH_OPERATION = 25;
// The number of 50 parallel requests seemed optimal, if it was higher it did not seem to bring any extra value.
const DEFAULT_PARALLEL_BATCH_ADD_REQUESTS = 50;
const DEFAULT_MIN_DELAY_BETWEEN_UNPROCESSED_REQUESTS_RETRIES_MILLIS = 500;

/**
 * @hideconstructor
 */
export class RequestQueueClient extends ResourceClient {
    private clientKey?: string;

    private timeoutMillis?: number;

    constructor(options: ApiClientSubResourceOptions, userOptions: RequestQueueUserOptions = {}) {
        super({
            resourcePath: 'request-queues',
            ...options,
        });

        this.clientKey = userOptions.clientKey;
        this.timeoutMillis = userOptions.timeoutSecs ? userOptions.timeoutSecs * 1e3 : undefined;
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
            timeout: this.timeoutMillis,
            params: this._params({
                limit: options.limit,
                clientKey: this.clientKey,
            }),
        });

        return cast(parseDateFields(pluckData(response.data)));
    }

    /**
     * Get requests from queue head and lock them.
     * THIS METHOD IS EXPERIMENTAL AND NOT INTENDED FOR PRODUCTION USE.
     *
     * @private
     * @experimental
     */
    async listAndLockHead(options: RequestQueueClientListAndLockHeadOptions): Promise<RequestQueueClientListAndLockHeadResult> {
        ow(options, ow.object.exactShape({
            lockSecs: ow.number,
            limit: ow.optional.number,
        }));

        const response = await this.httpClient.call({
            url: this._url('head/lock'),
            method: 'POST',
            timeout: this.timeoutMillis,
            params: this._params({
                limit: options.limit,
                lockSecs: options.lockSecs,
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
            timeout: this.timeoutMillis,
            data: request,
            params: this._params({
                forefront: options.forefront,
                clientKey: this.clientKey,
            }),
        });

        return cast(parseDateFields(pluckData(response.data)));
    }

    /**
     * Writes requests to request queue in batch.
     * THIS METHOD IS EXPERIMENTAL AND NOT INTENDED FOR PRODUCTION USE.
     *
     * @private
     * @experimental
     */
    protected async _batchAddRequests(
        requests: Omit<RequestQueueClientRequestSchema, 'id'>[],
        options: RequestQueueClientAddRequestOptions = {},
    ): Promise<RequestQueueClientBatchRequestsOperationResult> {
        ow(requests, ow.array.ofType(ow.object.partialShape({
            id: ow.undefined,
        })).minLength(1).maxLength(MAX_REQUESTS_PER_BATCH_OPERATION));
        ow(options, ow.object.exactShape({
            forefront: ow.optional.boolean,
        }));

        const { data } = await this.httpClient.call({
            url: this._url('requests/batch'),
            method: 'POST',
            timeout: this.timeoutMillis,
            data: requests,
            params: this._params({
                forefront: options.forefront,
                clientKey: this.clientKey,
            }),
        });

        return cast(parseDateFields(pluckData(data)));
    }

    protected async _batchAddRequestsWithRetries(
        requests: Omit<RequestQueueClientRequestSchema, 'id'>[],
        options: RequestQueueClientBatchAddRequestWithRetriesOptions = {},
    ): Promise<RequestQueueClientBatchRequestsOperationResult> {
        const {
            forefront,
            maxUnprocessedRequestsRetries = 0,
            minDelayBetweenUnprocessedRequestsRetriesMillis = DEFAULT_MIN_DELAY_BETWEEN_UNPROCESSED_REQUESTS_RETRIES_MILLIS,
        } = options;
        // Keep track of the requests that remain to be processed (in parameter format)
        let remainingRequests = requests;
        // Keep track of the requests that have been processed (in api format)
        const processedRequests: ProcessedRequest[] = [];
        // The requests we have not been able to process in the last call
        // ie. those we have not been able to process at all
        let unprocessedRequests: UnprocessedRequest[] = [];
        for (let i = 0; i < 1 + maxUnprocessedRequestsRetries; i++) {
            try {
                const response = await this._batchAddRequests(remainingRequests, {
                    forefront,
                });
                processedRequests.push(...response.processedRequests);
                unprocessedRequests = response.unprocessedRequests;

                // Consider request with unprocessed requests as rate limited.
                // NOTE: This is important for SDK, the rate limit errors are read by AutoScalePool and used to potentially downscale.
                if (unprocessedRequests.length !== 0) {
                    this.httpClient.stats.addRateLimitError(i + 1);
                }

                // Get unique keys of all requests processed so far
                const processedRequestsUniqueKeys = processedRequests.map(({ uniqueKey }) => uniqueKey);
                // Requests remaining to be processed are the all that remain
                remainingRequests = requests.filter(({ uniqueKey }) => !processedRequestsUniqueKeys.includes(uniqueKey));

                // Stop if all requests have been processed
                if (remainingRequests.length === 0) {
                    break;
                }
            } catch (err) {
                log.exception(err as Error, 'Request batch insert failed');
                // When something fails and http client does not retry, the remaining requests are treated as unprocessed.
                // This ensures that this method does not throw and keeps the signature.
                const processedRequestsUniqueKeys = processedRequests.map(({ uniqueKey }) => uniqueKey);
                unprocessedRequests = requests
                    .filter(({ uniqueKey }) => !processedRequestsUniqueKeys.includes(uniqueKey))
                    .map(({ method, uniqueKey, url }) => ({ method, uniqueKey, url }));

                break;
            }

            // Exponential backoff
            const delayMillis = Math.floor((1 + Math.random()) * (2 ** i) * minDelayBetweenUnprocessedRequestsRetriesMillis);
            await new Promise((resolve) => setTimeout(resolve, delayMillis));
        }

        const result = { processedRequests, unprocessedRequests } as unknown as JsonObject;

        return cast(parseDateFields(result));
    }

    /**
     * Writes multiple requests to request queue concurrently in batch with retries.
     * THIS METHOD IS EXPERIMENTAL AND NOT INTENDED FOR PRODUCTION USE.
     *
     * @private
     * @experimental
     */
    async batchAddRequests(
        requests: Omit<RequestQueueClientRequestSchema, 'id'>[],
        options: RequestQueueClientBatchAddRequestWithRetriesOptions = {},
    ): Promise<RequestQueueClientBatchRequestsOperationResult> {
        const {
            forefront,
            maxUnprocessedRequestsRetries = 0,
            maxParallel = DEFAULT_PARALLEL_BATCH_ADD_REQUESTS,
            minDelayBetweenUnprocessedRequestsRetriesMillis = DEFAULT_MIN_DELAY_BETWEEN_UNPROCESSED_REQUESTS_RETRIES_MILLIS,
        } = options;
        ow(requests, ow.array.ofType(ow.object.partialShape({
            id: ow.undefined,
        })).minLength(1));
        ow(forefront, ow.optional.boolean);
        ow(maxUnprocessedRequestsRetries, ow.optional.number);
        ow(maxParallel, ow.optional.number);
        ow(minDelayBetweenUnprocessedRequestsRetriesMillis, ow.optional.number);

        const executingRequests = new Set();
        const individualResults: RequestQueueClientBatchRequestsOperationResult[] = [];

        // Keep a pool of up to `maxParallel` requests running at once
        for (let i = 0; i < requests.length; i += MAX_REQUESTS_PER_BATCH_OPERATION) {
            const requestsInBatch = requests.slice(i, i + MAX_REQUESTS_PER_BATCH_OPERATION);
            const requestPromise = this._batchAddRequestsWithRetries(requestsInBatch, options);
            executingRequests.add(requestPromise);
            requestPromise.then((batchAddResult) => {
                executingRequests.delete(requestPromise);
                individualResults.push(batchAddResult);
            });
            if (executingRequests.size >= maxParallel) {
                await Promise.race(executingRequests);
            }
        }
        // Get results from remaining operations
        await Promise.all(executingRequests);

        // Combine individual results together
        const result: RequestQueueClientBatchRequestsOperationResult = {
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
     * Deletes requests from request queue in batch.
     * THIS METHOD IS EXPERIMENTAL AND NOT INTENDED FOR PRODUCTION USE.
     * TODO: Make retryable and parallelize
     * @private
     * @experimental
     */
    async batchDeleteRequests(
        requests: RequestQueueClientRequestToDelete[],
    ): Promise<RequestQueueClientBatchRequestsOperationResult> {
        ow(requests, ow.array.ofType(ow.any(
            ow.object.partialShape({ id: ow.string }),
            ow.object.partialShape({ uniqueKey: ow.string }),
        )).minLength(1).maxLength(MAX_REQUESTS_PER_BATCH_OPERATION));

        const { data } = await this.httpClient.call({
            url: this._url('requests/batch'),
            method: 'DELETE',
            timeout: this.timeoutMillis,
            data: requests,
            params: this._params({
                clientKey: this.clientKey,
            }),
        });

        return cast(parseDateFields(pluckData(data)));
    }

    /**
     * https://docs.apify.com/api/v2#/reference/request-queues/request/get-request
     */
    async getRequest(id: string): Promise<RequestQueueClientGetRequestResult | undefined> {
        ow(id, ow.string);
        const requestOpts: ApifyRequestConfig = {
            url: this._url(`requests/${id}`),
            method: 'GET',
            timeout: this.timeoutMillis,
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
            timeout: this.timeoutMillis,
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
            timeout: this.timeoutMillis,
            params: this._params({
                clientKey: this.clientKey,
            }),
        });
    }

    /**
     * THIS METHOD IS EXPERIMENTAL AND NOT INTENDED FOR PRODUCTION USE.
     *
     * @private
     * @experimental
     */
    async prolongRequestLock(id: string, options: RequestQueueClientProlongRequestLockOptions): Promise<RequestQueueClientProlongRequestLockResult> {
        ow(id, ow.string);
        ow(options, ow.object.exactShape({
            lockSecs: ow.number,
            forefront: ow.optional.boolean,
        }));

        const response = await this.httpClient.call({
            url: this._url(`requests/${id}/lock`),
            method: 'PUT',
            timeout: this.timeoutMillis,
            params: this._params({
                forefront: options.forefront,
                lockSecs: options.lockSecs,
                clientKey: this.clientKey,
            }),
        });

        return cast(parseDateFields(pluckData(response.data)));
    }

    /**
     * THIS METHOD IS EXPERIMENTAL AND NOT INTENDED FOR PRODUCTION USE.
     *
     * @private
     * @experimental
     */
    async deleteRequestLock(id: string, options: RequestQueueClientDeleteRequestLockOptions = {}): Promise<void> {
        ow(id, ow.string);
        ow(options, ow.object.exactShape({
            forefront: ow.optional.boolean,
        }));

        await this.httpClient.call({
            url: this._url(`requests/${id}/lock`),
            method: 'DELETE',
            timeout: this.timeoutMillis,
            params: this._params({
                forefront: options.forefront,
                clientKey: this.clientKey,
            }),
        });
    }
}

export interface RequestQueueUserOptions {
    clientKey?: string;
    timeoutSecs?: number;
}

export interface RequestQueue {
    id: string;
    name?: string;
    userId: string;
    createdAt: Date;
    modifiedAt: Date;
    accessedAt: Date;
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
    queueModifiedAt: Date;
    hadMultipleClients: boolean;
    items: RequestQueueClientListItem[];
}

export interface RequestQueueClientListAndLockHeadOptions {
    lockSecs: number;
    limit?: number;
}

export interface RequestQueueClientListAndLockHeadResult extends RequestQueueClientListHeadResult {
    lockSecs: number;
}

export interface RequestQueueClientListItem {
    id: string;
    retryCount: number;
    uniqueKey: string;
    url: string;
    method: AllowedHttpMethods;
    lockExpiresAt?: Date;
}

export interface RequestQueueClientAddRequestOptions {
    forefront?: boolean;
}

export interface RequestQueueClientProlongRequestLockOptions {
    forefront?: boolean;
    lockSecs: number;
}

export interface RequestQueueClientDeleteRequestLockOptions {
    forefront?: boolean;
}

export interface RequestQueueClientProlongRequestLockResult {
    lockExpiresAt: Date;
}

export interface RequestQueueClientBatchAddRequestWithRetriesOptions {
    forefront?: boolean;
    maxUnprocessedRequestsRetries?: number;
    maxParallel?: number;
    minDelayBetweenUnprocessedRequestsRetriesMillis?: number;
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

export interface RequestQueueClientBatchRequestsOperationResult {
    processedRequests: ProcessedRequest[];
    unprocessedRequests: UnprocessedRequest[];
}

export type RequestQueueClientRequestToDelete = Pick<RequestQueueClientRequestSchema, 'id'> | Pick<RequestQueueClientRequestSchema, 'uniqueKey'>

export type RequestQueueClientGetRequestResult = Omit<RequestQueueClientListItem, 'retryCount'>

export type AllowedHttpMethods = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'TRACE' | 'OPTIONS' | 'CONNECT' | 'PATCH'
