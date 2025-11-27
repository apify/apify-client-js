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

/**
 * Client for managing a specific Request queue.
 *
 * Request queues store URLs to be crawled and their metadata. Each request in the queue has a unique ID
 * and can be in various states (pending, handled). This client provides methods to add, get, update,
 * and delete requests, as well as manage the queue itself.
 *
 * @example
 * ```javascript
 * const client = new ApifyClient({ token: 'my-token' });
 * const queueClient = client.requestQueue('my-queue-id');
 *
 * // Add a request to the queue
 * await queueClient.addRequest({
 *   url: 'https://example.com',
 *   uniqueKey: 'example-com'
 * });
 *
 * // Get the next request from the queue
 * const request = await queueClient.listHead();
 *
 * // Mark request as handled
 * await queueClient.updateRequest({
 *   id: request.id,
 *   handledAt: new Date().toISOString()
 * });
 * ```
 *
 * @see https://docs.apify.com/platform/storage/request-queue
 */
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
     * Gets the Request queue object from the Apify API.
     *
     * @returns The RequestQueue object, or `undefined` if it does not exist
     * @see https://docs.apify.com/api/v2/request-queue-get
     */
    async get(): Promise<RequestQueue | undefined> {
        return this._get({}, SMALL_TIMEOUT_MILLIS);
    }

    /**
     * Updates the Request queue with specified fields.
     *
     * @param newFields - Fields to update in the Request queue
     * @returns The updated RequestQueue object
     * @see https://docs.apify.com/api/v2/request-queue-put
     */
    async update(newFields: RequestQueueClientUpdateOptions): Promise<RequestQueue> {
        ow(newFields, ow.object);

        return this._update(newFields, SMALL_TIMEOUT_MILLIS);
    }

    /**
     * Deletes the Request queue.
     *
     * @see https://docs.apify.com/api/v2/request-queue-delete
     */
    async delete(): Promise<void> {
        return this._delete(SMALL_TIMEOUT_MILLIS);
    }

    /**
     * Lists requests from the beginning of the queue (head).
     *
     * Returns the first N requests from the queue without locking them. This is useful for
     * inspecting what requests are waiting to be processed.
     *
     * @param options - Options for listing (e.g., limit)
     * @returns List of requests from the queue head
     * @see https://docs.apify.com/api/v2/request-queue-head-get
     */
    async listHead(options: RequestQueueClientListHeadOptions = {}): Promise<RequestQueueClientListHeadResult> {
        ow(
            options,
            ow.object.exactShape({
                limit: ow.optional.number,
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
     * Gets and locks the next requests from the queue head for processing.
     *
     * This method retrieves requests from the beginning of the queue and locks them for
     * the specified duration to prevent other clients from processing them simultaneously.
     * This is the primary method used by distributed web crawlers to coordinate work across
     * multiple workers. Locked requests won't be returned to other clients until the lock expires
     * or is explicitly released using {@link deleteRequestLock}.
     *
     * @param options - Lock configuration
     * @param options.lockSecs - **Required.** Duration in seconds to lock the requests. After this time, the locks expire and requests can be retrieved by other clients.
     * @param options.limit - Maximum number of requests to return. Default is 25.
     * @returns Object containing `items` (locked requests), `queueModifiedAt`, `hadMultipleClients`, and lock information
     * @see https://docs.apify.com/api/v2/request-queue-head-lock-post
     *
     * @example
     * ```javascript
     * // Get and lock up to 10 requests for 60 seconds
     * const { items, lockSecs } = await client.requestQueue('my-queue').listAndLockHead({
     *   lockSecs: 60,
     *   limit: 10
     * });
     *
     * // Process each locked request
     * for (const request of items) {
     *   console.log(`Processing: ${request.url}`);
     *   // ... process request ...
     *   // Delete lock after successful processing
     *   await client.requestQueue('my-queue').deleteRequestLock(request.id);
     * }
     * ```
     */
    async listAndLockHead(
        options: RequestQueueClientListAndLockHeadOptions,
    ): Promise<RequestQueueClientListAndLockHeadResult> {
        ow(
            options,
            ow.object.exactShape({
                lockSecs: ow.number,
                limit: ow.optional.number,
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
     * Adds a single request to the queue.
     *
     * If a request with the same `uniqueKey` already exists, the method will return information
     * about the existing request without adding a duplicate. The `uniqueKey` is used for
     * deduplication - typically it's the URL, but you can use any string to identify the request.
     *
     * @param request - The request object to add (excluding `id`, which is assigned by the API)
     * @param request.url - URL to be crawled
     * @param request.uniqueKey - Unique identifier for request deduplication. If not provided, defaults to `url`.
     * @param request.method - HTTP method. Default is `'GET'`.
     * @param request.userData - Custom user data (arbitrary JSON object) associated with the request.
     * @param request.headers - HTTP headers to use for the request.
     * @param request.payload - HTTP payload for POST/PUT requests (string).
     * @param options - Additional options
     * @param options.forefront - If `true`, adds the request to the beginning of the queue. Default is `false` (adds to the end).
     * @returns Object with `requestId`, `wasAlreadyPresent`, and `wasAlreadyHandled` flags
     * @see https://docs.apify.com/api/v2/request-queue-requests-post
     *
     * @example
     * ```javascript
     * const result = await client.requestQueue('my-queue').addRequest({
     *   url: 'https://example.com',
     *   uniqueKey: 'example-page',
     *   method: 'GET',
     *   userData: { label: 'START', depth: 0 }
     * });
     * console.log(`Request ID: ${result.requestId}`);
     * console.log(`Already present: ${result.wasAlreadyPresent}`);
     * console.log(`Already handled: ${result.wasAlreadyHandled}`);
     *
     * // Add urgent request to the front of the queue
     * await client.requestQueue('my-queue').addRequest(
     *   { url: 'https://priority.com', uniqueKey: 'priority-page' },
     *   { forefront: true }
     * );
     * ```
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
     * Writes requests to Request queue in batch.
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
     * Adds multiple requests to the queue in a single operation.
     *
     * This is significantly more efficient than calling {@link addRequest} multiple times, especially
     * for large batches. The method automatically handles batching (max 25 requests per API call),
     * retries on rate limiting, and parallel processing. Requests are sent in chunks respecting the
     * API payload size limit, and any unprocessed requests due to rate limits are automatically
     * retried with exponential backoff.
     *
     * @param requests - Array of request objects to add (excluding `id` fields)
     * @param options - Batch operation configuration
     * @param options.forefront - If `true`, adds all requests to the beginning of the queue. Default is `false`.
     * @param options.maxUnprocessedRequestsRetries - Maximum number of retry attempts for rate-limited requests. Default is 3.
     * @param options.maxParallel - Maximum number of parallel batch API calls. Default is 5.
     * @param options.minDelayBetweenUnprocessedRequestsRetriesMillis - Minimum delay before retrying rate-limited requests. Default is 500ms.
     * @returns Object with `processedRequests` (successfully added) and `unprocessedRequests` (failed after all retries)
     * @see https://docs.apify.com/api/v2/request-queue-requests-batch-post
     *
     * @example
     * ```javascript
     * // Add a batch of URLs to crawl
     * const requests = [
     *   { url: 'https://example.com', uniqueKey: 'page1', userData: { depth: 1 } },
     *   { url: 'https://example.com/2', uniqueKey: 'page2', userData: { depth: 1 } },
     *   { url: 'https://example.com/3', uniqueKey: 'page3', userData: { depth: 1 } }
     * ];
     * const result = await client.requestQueue('my-queue').batchAddRequests(requests);
     * console.log(`Successfully added: ${result.processedRequests.length}`);
     * console.log(`Failed: ${result.unprocessedRequests.length}`);
     *
     * // Batch add with custom retry settings
     * const result = await client.requestQueue('my-queue').batchAddRequests(
     *   requests,
     *   { maxUnprocessedRequestsRetries: 5, maxParallel: 10 }
     * );
     * ```
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
     * Deletes multiple requests from the queue in a single operation.
     *
     * Requests can be identified by either their ID or unique key.
     *
     * @param requests - Array of requests to delete (by id or uniqueKey)
     * @returns Result containing processed and unprocessed requests
     * @see https://docs.apify.com/api/v2/request-queue-requests-batch-delete
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
     * Gets a specific request from the queue by its ID.
     *
     * @param id - Request ID
     * @returns The request object, or `undefined` if not found
     * @see https://docs.apify.com/api/v2/request-queue-request-get
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
     * Updates a request in the queue.
     *
     * @param request - The updated request object (must include id)
     * @param options - Update options such as whether to move to front
     * @returns Information about the updated request
     * @see https://docs.apify.com/api/v2/request-queue-request-put
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

    /**
     * Deletes a specific request from the queue.
     *
     * @param id - Request ID
     */
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
     * Prolongs the lock on a request to prevent it from being returned to other clients.
     *
     * This is useful when processing a request takes longer than expected and you need
     * to extend the lock duration to prevent other workers from picking it up. The lock
     * expiration time is reset to the current time plus the specified duration.
     *
     * @param id - Request ID (obtained from {@link listAndLockHead} or {@link getRequest})
     * @param options - Lock extension options
     * @param options.lockSecs - **Required.** New lock duration in seconds from now.
     * @param options.forefront - If `true`, moves the request to the beginning of the queue when the lock expires. Default is `false`.
     * @returns Object with new `lockExpiresAt` timestamp
     * @see https://docs.apify.com/api/v2/request-queue-request-lock-put
     *
     * @example
     * ```javascript
     * // Lock request for initial processing
     * const { items } = await client.requestQueue('my-queue').listAndLockHead({ lockSecs: 60, limit: 1 });
     * const request = items[0];
     *
     * // Processing takes longer than expected, extend the lock
     * await client.requestQueue('my-queue').prolongRequestLock(request.id, { lockSecs: 120 });
     * ```
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
     * Releases the lock on a request, allowing other clients to process it.
     *
     * This should be called after successfully processing a request or when you decide
     * not to process it.
     *
     * @param id - Request ID
     * @param options - Options such as whether to move to front
     * @see https://docs.apify.com/api/v2/request-queue-request-lock-delete
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
     * Lists all requests in the queue.
     *
     * Returns a paginated list of all requests, allowing you to iterate through the entire
     * queue contents.
     *
     * @param options - Pagination options
     * @returns List of requests with pagination information
     * @see https://docs.apify.com/api/v2/request-queue-requests-get
     */
    async listRequests(
        options: RequestQueueClientListRequestsOptions = {},
    ): Promise<RequestQueueClientListRequestsResult> {
        ow(
            options,
            ow.object.exactShape({
                limit: ow.optional.number,
                exclusiveStartId: ow.optional.string,
            }),
        );

        const response = await this.httpClient.call({
            url: this._url('requests'),
            method: 'GET',
            timeout: Math.min(MEDIUM_TIMEOUT_MILLIS, this.timeoutMillis ?? Infinity),
            params: this._params({
                limit: options.limit,
                exclusiveStartId: options.exclusiveStartId,
                clientKey: this.clientKey,
            }),
        });

        return cast(parseDateFields(pluckData(response.data)));
    }

    /**
     * Unlocks all requests locked by this client.
     *
     * This is useful for releasing all locks at once, for example when shutting down
     * a crawler gracefully.
     *
     * @returns Number of requests that were unlocked
     * @see https://docs.apify.com/api/v2/request-queue-requests-unlock-post
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
     * Returns an async iterable for paginating through all requests in the queue.
     *
     * This allows you to efficiently process all requests using a for-await-of loop,
     * automatically handling pagination behind the scenes.
     *
     * @param options - Pagination options
     * @returns An async iterable of request pages
     * @see https://docs.apify.com/api/v2/request-queue-requests-get
     *
     * @example
     * ```javascript
     * for await (const { items } of client.requestQueue('my-queue').paginateRequests({ limit: 100 })) {
     *   items.forEach((request) => console.log(request.url));
     * }
     * ```
     */
    paginateRequests(
        options: RequestQueueClientPaginateRequestsOptions = {},
    ): RequestQueueRequestsAsyncIterable<RequestQueueClientListRequestsResult> {
        ow(
            options,
            ow.object.exactShape({
                limit: ow.optional.number,
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

/**
 * User-specific options for RequestQueueClient.
 */
export interface RequestQueueUserOptions {
    clientKey?: string;
    timeoutSecs?: number;
}

/**
 * Represents a Request Queue storage on the Apify platform.
 *
 * Request queues store URLs (requests) to be processed by web crawlers. They provide
 * automatic deduplication, request locking for parallel processing, and persistence.
 */
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

/**
 * Statistics about Request Queue usage and storage.
 */
export interface RequestQueueStats {
    readCount?: number;
    writeCount?: number;
    deleteCount?: number;
    headItemReadCount?: number;
    storageBytes?: number;
}

/**
 * Options for updating a Request Queue.
 */
export interface RequestQueueClientUpdateOptions {
    name?: string | null;
    title?: string;
    generalAccess?: STORAGE_GENERAL_ACCESS | null;
}

/**
 * Options for listing requests from the queue head.
 */
export interface RequestQueueClientListHeadOptions {
    limit?: number;
}

/**
 * Result of listing requests from the queue head.
 */
export interface RequestQueueClientListHeadResult {
    limit: number;
    queueModifiedAt: Date;
    hadMultipleClients: boolean;
    items: RequestQueueClientListItem[];
}

/**
 * Options for listing all requests in the queue.
 */
export interface RequestQueueClientListRequestsOptions {
    limit?: number;
    exclusiveStartId?: string;
}

/**
 * Options for paginating through requests in the queue.
 */
export interface RequestQueueClientPaginateRequestsOptions {
    limit?: number;
    maxPageLimit?: number;
    exclusiveStartId?: string;
}

/**
 * Result of listing all requests in the queue.
 */
export interface RequestQueueClientListRequestsResult {
    limit: number;
    exclusiveStartId?: string;
    items: RequestQueueClientRequestSchema[];
}

/**
 * Options for listing and locking requests from the queue head.
 */
export interface RequestQueueClientListAndLockHeadOptions {
    lockSecs: number;
    limit?: number;
}

/**
 * Result of listing and locking requests from the queue head.
 *
 * Extends {@link RequestQueueClientListHeadResult} with lock information.
 */
export interface RequestQueueClientListAndLockHeadResult extends RequestQueueClientListHeadResult {
    lockSecs: number;
    queueHasLockedRequests: boolean;
    clientKey: string;
}

/**
 * Simplified request information used in list results.
 */
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

/**
 * Complete schema for a request in the queue.
 *
 * Represents a URL to be crawled along with its metadata, retry information, and custom data.
 */
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

/**
 * Result of adding a request to the queue.
 */
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

/**
 * Result of a batch operation on requests.
 *
 * Contains lists of successfully processed and unprocessed requests.
 */
export interface RequestQueueClientBatchRequestsOperationResult {
    processedRequests: ProcessedRequest[];
    unprocessedRequests: UnprocessedRequest[];
}

export type RequestQueueClientRequestToDelete =
    | Pick<RequestQueueClientRequestSchema, 'id'>
    | Pick<RequestQueueClientRequestSchema, 'uniqueKey'>;

export type RequestQueueClientGetRequestResult = Omit<RequestQueueClientListItem, 'retryCount'>;

/**
 * HTTP methods supported by Request Queue requests.
 */
export type AllowedHttpMethods = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'TRACE' | 'OPTIONS' | 'CONNECT' | 'PATCH';

export type RequestQueueRequestsAsyncIterable<T> = AsyncIterable<T>;
