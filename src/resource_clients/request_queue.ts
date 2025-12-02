import ow from 'ow';
import type { JsonObject } from 'type-fest';

import type { STORAGE_GENERAL_ACCESS } from '@apify/consts';
import { MAX_PAYLOAD_SIZE_BYTES, REQUEST_QUEUE_MAX_REQUESTS_PER_BATCH_OPERATION } from '@apify/consts';
import log from '@apify/log';

import type { ApifyApiError } from '../apify_api_error';
import type { ApiClientSubResourceOptions } from '../base/api_client';
import { MEDIUM_TIMEOUT_MILLIS, ResourceClient, SMALL_TIMEOUT_MILLIS } from '../base/resource_client';
import type { ApifyRequestConfig } from '../http_client';
import {
    cast,
    catchNotFoundOrThrow,
    PaginationIterator,
    parseDateFields,
    pluckData,
    sliceArrayByByteLength,
} from '../utils';

const DEFAULT_PARALLEL_BATCH_ADD_REQUESTS = 5;
const DEFAULT_UNPROCESSED_RETRIES_BATCH_ADD_REQUESTS = 3;
const DEFAULT_MIN_DELAY_BETWEEN_UNPROCESSED_REQUESTS_RETRIES_MILLIS = 500;
const DEFAULT_REQUEST_QUEUE_REQUEST_PAGE_LIMIT = 1000;
const SAFETY_BUFFER_PERCENT = 0.01 / 100; // 0.01%

export class RequestQueueClient extends ResourceClient {
    private clientKey?: string;

    private timeoutMillis?: number;

    /**
     * @hidden
     */
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
        return this._get({}, SMALL_TIMEOUT_MILLIS);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/request-queues/queue/update-request-queue
     */
    async update(newFields: RequestQueueClientUpdateOptions): Promise<RequestQueue> {
        ow(newFields, ow.object);

        return this._update(newFields, SMALL_TIMEOUT_MILLIS);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/request-queues/queue/delete-request-queue
     */
    async delete(): Promise<void> {
        return this._delete(SMALL_TIMEOUT_MILLIS);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/request-queues/queue-head/get-head
     */
    async listHead(options: RequestQueueClientListHeadOptions = {}): Promise<RequestQueueClientListHeadResult> {
        ow(
            options,
            ow.object.exactShape({
                limit: ow.optional.number.not.negative,
            }),
        );

        const response = await this.httpClient.call({
            url: this._url('head'),
            method: 'GET',
            timeout: Math.min(SMALL_TIMEOUT_MILLIS, this.timeoutMillis ?? Infinity),
            params: this._params({
                limit: options.limit,
                clientKey: this.clientKey,
            }),
        });

        return cast(parseDateFields(pluckData(response.data)));
    }

    /**
     * https://docs.apify.com/api/v2#/reference/request-queues/queue-head-with-locks/get-head-and-lock
     */
    async listAndLockHead(
        options: RequestQueueClientListAndLockHeadOptions,
    ): Promise<RequestQueueClientListAndLockHeadResult> {
        ow(
            options,
            ow.object.exactShape({
                lockSecs: ow.number,
                limit: ow.optional.number.not.negative,
            }),
        );

        const response = await this.httpClient.call({
            url: this._url('head/lock'),
            method: 'POST',
            timeout: Math.min(MEDIUM_TIMEOUT_MILLIS, this.timeoutMillis ?? Infinity),
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
        ow(
            request,
            ow.object.partialShape({
                id: ow.undefined,
            }),
        );

        ow(
            options,
            ow.object.exactShape({
                forefront: ow.optional.boolean,
            }),
        );

        const response = await this.httpClient.call({
            url: this._url('requests'),
            method: 'POST',
            timeout: Math.min(SMALL_TIMEOUT_MILLIS, this.timeoutMillis ?? Infinity),
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
     *
     * @private
     */
    protected async _batchAddRequests(
        requests: Omit<RequestQueueClientRequestSchema, 'id'>[],
        options: RequestQueueClientAddRequestOptions = {},
    ): Promise<RequestQueueClientBatchRequestsOperationResult> {
        ow(
            requests,
            ow.array
                .ofType(
                    ow.object.partialShape({
                        id: ow.undefined,
                    }),
                )
                .minLength(1)
                .maxLength(REQUEST_QUEUE_MAX_REQUESTS_PER_BATCH_OPERATION),
        );
        ow(
            options,
            ow.object.exactShape({
                forefront: ow.optional.boolean,
            }),
        );

        const { data } = await this.httpClient.call({
            url: this._url('requests/batch'),
            method: 'POST',
            timeout: Math.min(MEDIUM_TIMEOUT_MILLIS, this.timeoutMillis ?? Infinity),
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
            maxUnprocessedRequestsRetries = DEFAULT_UNPROCESSED_RETRIES_BATCH_ADD_REQUESTS,
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
                remainingRequests = requests.filter(
                    ({ uniqueKey }) => !processedRequestsUniqueKeys.includes(uniqueKey),
                );

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
            const delayMillis = Math.floor(
                (1 + Math.random()) * 2 ** i * minDelayBetweenUnprocessedRequestsRetriesMillis,
            );
            await new Promise((resolve) => {
                setTimeout(resolve, delayMillis);
            });
        }

        const result = { processedRequests, unprocessedRequests } as unknown as JsonObject;

        return cast(parseDateFields(result));
    }

    /**
     * https://docs.apify.com/api/v2#/reference/request-queues/batch-request-operations/add-requests
     */
    async batchAddRequests(
        requests: Omit<RequestQueueClientRequestSchema, 'id'>[],
        options: RequestQueueClientBatchAddRequestWithRetriesOptions = {},
    ): Promise<RequestQueueClientBatchRequestsOperationResult> {
        const {
            forefront,
            maxUnprocessedRequestsRetries = DEFAULT_UNPROCESSED_RETRIES_BATCH_ADD_REQUESTS,
            maxParallel = DEFAULT_PARALLEL_BATCH_ADD_REQUESTS,
            minDelayBetweenUnprocessedRequestsRetriesMillis = DEFAULT_MIN_DELAY_BETWEEN_UNPROCESSED_REQUESTS_RETRIES_MILLIS,
        } = options;
        ow(
            requests,
            ow.array
                .ofType(
                    ow.object.partialShape({
                        id: ow.undefined,
                    }),
                )
                .minLength(1),
        );
        ow(forefront, ow.optional.boolean);
        ow(maxUnprocessedRequestsRetries, ow.optional.number);
        ow(maxParallel, ow.optional.number);
        ow(minDelayBetweenUnprocessedRequestsRetriesMillis, ow.optional.number);

        const executingRequests = new Set();
        const individualResults: RequestQueueClientBatchRequestsOperationResult[] = [];
        const payloadSizeLimitBytes =
            MAX_PAYLOAD_SIZE_BYTES - Math.ceil(MAX_PAYLOAD_SIZE_BYTES * SAFETY_BUFFER_PERCENT);

        // Keep a pool of up to `maxParallel` requests running at once
        let i = 0;
        while (i < requests.length) {
            const slicedRequests = requests.slice(i, i + REQUEST_QUEUE_MAX_REQUESTS_PER_BATCH_OPERATION);
            const requestsInBatch = sliceArrayByByteLength(slicedRequests, payloadSizeLimitBytes, i);
            const requestPromise = this._batchAddRequestsWithRetries(requestsInBatch, options);
            executingRequests.add(requestPromise);
            void requestPromise.then((batchAddResult) => {
                executingRequests.delete(requestPromise);
                individualResults.push(batchAddResult);
            });
            if (executingRequests.size >= maxParallel) {
                await Promise.race(executingRequests);
            }
            i += requestsInBatch.length;
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
     * https://docs.apify.com/api/v2#/reference/request-queues/batch-request-operations/delete-requests
     */
    async batchDeleteRequests(
        requests: RequestQueueClientRequestToDelete[],
    ): Promise<RequestQueueClientBatchRequestsOperationResult> {
        ow(
            requests,
            ow.array
                .ofType(
                    ow.any(ow.object.partialShape({ id: ow.string }), ow.object.partialShape({ uniqueKey: ow.string })),
                )
                .minLength(1)
                .maxLength(REQUEST_QUEUE_MAX_REQUESTS_PER_BATCH_OPERATION),
        );

        const { data } = await this.httpClient.call({
            url: this._url('requests/batch'),
            method: 'DELETE',
            timeout: Math.min(SMALL_TIMEOUT_MILLIS, this.timeoutMillis ?? Infinity),
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
            timeout: Math.min(SMALL_TIMEOUT_MILLIS, this.timeoutMillis ?? Infinity),
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
        ow(
            request,
            ow.object.partialShape({
                id: ow.string,
            }),
        );

        ow(
            options,
            ow.object.exactShape({
                forefront: ow.optional.boolean,
            }),
        );

        const response = await this.httpClient.call({
            url: this._url(`requests/${request.id}`),
            method: 'PUT',
            timeout: Math.min(MEDIUM_TIMEOUT_MILLIS, this.timeoutMillis ?? Infinity),
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
            timeout: Math.min(SMALL_TIMEOUT_MILLIS, this.timeoutMillis ?? Infinity),
            params: this._params({
                clientKey: this.clientKey,
            }),
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/request-queues/request-lock/prolong-request-lock
     */
    async prolongRequestLock(
        id: string,
        options: RequestQueueClientProlongRequestLockOptions,
    ): Promise<RequestQueueClientProlongRequestLockResult> {
        ow(id, ow.string);
        ow(
            options,
            ow.object.exactShape({
                lockSecs: ow.number,
                forefront: ow.optional.boolean,
            }),
        );

        const response = await this.httpClient.call({
            url: this._url(`requests/${id}/lock`),
            method: 'PUT',
            timeout: Math.min(MEDIUM_TIMEOUT_MILLIS, this.timeoutMillis ?? Infinity),
            params: this._params({
                forefront: options.forefront,
                lockSecs: options.lockSecs,
                clientKey: this.clientKey,
            }),
        });

        return cast(parseDateFields(pluckData(response.data)));
    }

    /**
     * https://docs.apify.com/api/v2#/reference/request-queues/request-lock/delete-request-lock
     */
    async deleteRequestLock(id: string, options: RequestQueueClientDeleteRequestLockOptions = {}): Promise<void> {
        ow(id, ow.string);
        ow(
            options,
            ow.object.exactShape({
                forefront: ow.optional.boolean,
            }),
        );

        await this.httpClient.call({
            url: this._url(`requests/${id}/lock`),
            method: 'DELETE',
            timeout: Math.min(SMALL_TIMEOUT_MILLIS, this.timeoutMillis ?? Infinity),
            params: this._params({
                forefront: options.forefront,
                clientKey: this.clientKey,
            }),
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/request-queues/request-collection/list-requests
     */
    listRequests(
        options: RequestQueueClientListRequestsOptions = {},
    ): Promise<RequestQueueClientListRequestsResult> & AsyncIterable<RequestQueueClientRequestSchema> {
        ow(
            options,
            ow.object.exactShape({
                limit: ow.optional.number.not.negative,
                exclusiveStartId: ow.optional.string,
            }),
        );

        const listItems = async (
            rqListOptions: RequestQueueClientListRequestsOptions = {},
        ): Promise<RequestQueueClientListRequestsResult> => {
            const response = await this.httpClient.call({
                url: this._url('requests'),
                method: 'GET',
                timeout: Math.min(MEDIUM_TIMEOUT_MILLIS, this.timeoutMillis ?? Infinity),
                params: this._params({ ...rqListOptions, clientKey: this.clientKey }),
            });

            return cast(parseDateFields(pluckData(response.data)));
        };

        async function* asyncGenerator() {
            let currentPage = await listItems(options);
            yield* currentPage.items;

            let remainingItems = options.limit ? options.limit - currentPage.items.length : undefined;

            while (
                currentPage.items.length > 0 && // Continue only if at least some items were returned in the last page.
                (remainingItems === undefined || remainingItems > 0)
            ) {
                const exclusiveStartId = currentPage.items[currentPage.items.length].id;
                const newOptions = { ...options, limit: remainingItems, exclusiveStartId };
                currentPage = await listItems(newOptions);
                yield* currentPage.items;
                if (remainingItems) {
                    remainingItems -= currentPage.items.length;
                }
            }
        }

        return Object.defineProperty(listItems(options), Symbol.asyncIterator, {
            value: asyncGenerator,
        }) as unknown as Promise<RequestQueueClientListRequestsResult> & AsyncIterable<RequestQueueClientRequestSchema>;
    }

    /**
     * https://docs.apify.com/api/v2/request-queue-requests-unlock-post
     */
    async unlockRequests(): Promise<RequestQueueClientUnlockRequestsResult> {
        const response = await this.httpClient.call({
            url: this._url('requests/unlock'),
            method: 'POST',
            timeout: Math.min(MEDIUM_TIMEOUT_MILLIS, this.timeoutMillis ?? Infinity),
            params: this._params({
                clientKey: this.clientKey,
            }),
        });

        return cast(parseDateFields(pluckData(response.data)));
    }

    /**
     * https://docs.apify.com/api/v2#/reference/request-queues/request-collection/list-requests
     *
     * Usage:
     * for await (const { items } of client.paginateRequests({ limit: 10 })) {
     *   items.forEach((request) => console.log(request));
     * }
     */
    paginateRequests(
        options: RequestQueueClientPaginateRequestsOptions = {},
    ): RequestQueueRequestsAsyncIterable<RequestQueueClientListRequestsResult> {
        ow(
            options,
            ow.object.exactShape({
                limit: ow.optional.number.not.negative,
                maxPageLimit: ow.optional.number,
                exclusiveStartId: ow.optional.string,
            }),
        );
        const { limit, exclusiveStartId, maxPageLimit = DEFAULT_REQUEST_QUEUE_REQUEST_PAGE_LIMIT } = options;
        return new PaginationIterator({
            getPage: this.listRequests.bind(this),
            limit,
            exclusiveStartId,
            maxPageLimit,
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
    title?: string;
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
    generalAccess?: STORAGE_GENERAL_ACCESS | null;
}

export interface RequestQueueStats {
    readCount?: number;
    writeCount?: number;
    deleteCount?: number;
    headItemReadCount?: number;
    storageBytes?: number;
}

export interface RequestQueueClientUpdateOptions {
    name?: string | null;
    title?: string;
    generalAccess?: STORAGE_GENERAL_ACCESS | null;
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

export interface RequestQueueClientListRequestsOptions {
    limit?: number;
    exclusiveStartId?: string;
}

export interface RequestQueueClientPaginateRequestsOptions {
    limit?: number;
    maxPageLimit?: number;
    exclusiveStartId?: string;
}

export interface RequestQueueClientListRequestsResult {
    limit: number;
    exclusiveStartId?: string;
    items: RequestQueueClientRequestSchema[];
}

export interface RequestQueueClientListAndLockHeadOptions {
    lockSecs: number;
    limit?: number;
}

export interface RequestQueueClientListAndLockHeadResult extends RequestQueueClientListHeadResult {
    lockSecs: number;
    queueHasLockedRequests: boolean;
    clientKey: string;
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

export interface RequestQueueClientUnlockRequestsResult {
    unlockedCount: number;
}

export interface RequestQueueClientBatchRequestsOperationResult {
    processedRequests: ProcessedRequest[];
    unprocessedRequests: UnprocessedRequest[];
}

export type RequestQueueClientRequestToDelete =
    | Pick<RequestQueueClientRequestSchema, 'id'>
    | Pick<RequestQueueClientRequestSchema, 'uniqueKey'>;

export type RequestQueueClientGetRequestResult = Omit<RequestQueueClientListItem, 'retryCount'>;

export type AllowedHttpMethods = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'TRACE' | 'OPTIONS' | 'CONNECT' | 'PATCH';

export type RequestQueueRequestsAsyncIterable<T> = AsyncIterable<T>;
