import type { AxiosResponse } from 'axios';
import type { LiteralUnion } from 'type-fest';

import { isomorphicBufferToString } from './body_parser.js';
import type { ApifyApiErrorType } from './models.js';
import { isBuffer } from './utils.js';

export type { ApifyApiErrorType } from './models.js';

/**
 * Examples of capturing groups for "...at ActorCollectionClient.listResources (/Users/..."
 * 0: "at ActorCollectionClient.listResources ("
 * 1: undefined
 * 2: "ActorCollectionClient"
 * 3: undefined
 * 4: "listResources"
 * @private
 */
const CLIENT_METHOD_REGEX = /at( async)? ([A-Za-z]+(Collection)?Client)\.([A-Za-z]+) \(/;

/**
 * A public method that returns the promise of a shared helper without awaiting it leaves only the helper on
 * the stack, so the helper is reported under the method the caller invoked.
 * @private
 */
const PUBLIC_METHOD_BY_HELPER: Record<string, string> = {
    getResource: 'get',
    updateResource: 'update',
    deleteResource: 'delete',
    waitForJobFinish: 'waitForFinish',
    listResources: 'list',
    createResource: 'create',
    getOrCreateResource: 'getOrCreate',
    addRequestBatch: 'batchAddRequests',
    addRequestBatchWithRetries: 'batchAddRequests',
};

/**
 * An `ApifyApiError` is thrown for successful HTTP requests that reach the API,
 * but the API responds with an error response. Typically, those are rate limit
 * errors and internal errors, which are automatically retried, or validation
 * errors, which are thrown immediately, because a correction by the user is
 * needed.
 *
 * The thrown error is an instance of the subclass matching the HTTP status code of the response:
 * {@link InvalidRequestError} (400), {@link UnauthorizedError} (401), {@link ForbiddenError} (403),
 * {@link NotFoundError} (404), {@link ConflictError} (409), {@link RateLimitError} (429) or
 * {@link ServerError} (5xx). Any other status code is thrown as a plain `ApifyApiError`. Every
 * subclass extends `ApifyApiError`, so `instanceof ApifyApiError` matches all of them. Errors that
 * share a status code are told apart by their `type`.
 */
export class ApifyApiError extends Error {
    override name: string;

    /**
     * The invoked resource client and the method. Known issue: Sometimes it displays
     * as `unknown` because it can't be parsed from a stack trace.
     */
    clientMethod: string;

    /**
     * HTTP status code of the error.
     */
    statusCode: number;

    /**
     * The type of the error, as returned by the API. Typed as the known {@link ApifyApiErrorType}
     * values for autocompletion, while still accepting any string the API may return.
     */
    type?: LiteralUnion<ApifyApiErrorType, string>;

    /**
     * Number of the API call attempt.
     */
    attempt: number;

    /**
     * HTTP method of the API call.
     */
    httpMethod?: string;

    /**
     * Full path of the API endpoint (URL excluding origin).
     */
    path?: string;

    /**
     * Original stack trace of the exception. It is replaced
     * by a more informative stack with API call information.
     */
    originalStack: string;

    /**
     * Additional data provided by the API about the error
     */
    data?: Record<string, unknown>;

    /**
     * @hidden
     */
    constructor(response: AxiosResponse, attempt: number) {
        let message!: string;
        let type: string | undefined;
        let responseData = response.data;
        let errorData: Record<string, unknown> | undefined;

        // Some methods (e.g. downloadItems) set up forceBuffer on request response. If this request failed
        // the body buffer needs to parse to get the correct error.
        if (isBuffer(responseData)) {
            try {
                responseData = JSON.parse(isomorphicBufferToString(response.data, 'utf-8'));
            } catch {
                // This can happen. The data in the response body are malformed.
            }
        }

        if (responseData && responseData.error) {
            const { error } = responseData;
            message = error.message;
            type = error.type;
            errorData = error.data;
        } else if (responseData) {
            let dataString;
            try {
                dataString = JSON.stringify(responseData, null, 2);
            } catch {
                dataString = `${responseData}`;
            }
            message = `Unexpected error: ${dataString}`;
        }
        super(message);

        this.name = this.constructor.name;
        this.clientMethod = this.extractClientAndMethodFromStack();
        this.statusCode = response.status;
        this.type = type;
        this.attempt = attempt;
        this.httpMethod = response.config?.method;
        this.path = this.safelyParsePathFromResponse(response);

        const stack = this.stack!;

        this.originalStack = stack.slice(stack.indexOf('\n'));
        this.stack = this.createApiStack();

        this.data = errorData;
    }

    /**
     * Creates the error for a failed response as an instance of the subclass matching its HTTP status code.
     * @hidden
     */
    static fromResponse(response: AxiosResponse, attempt: number): ApifyApiError {
        const ErrorClass =
            ERROR_CLASS_BY_STATUS[response.status] ?? (response.status >= 500 ? ServerError : ApifyApiError);
        return new ErrorClass(response, attempt);
    }

    private safelyParsePathFromResponse(response: AxiosResponse) {
        const urlString = response.config?.url;
        let url;
        try {
            url = new URL(urlString!);
        } catch {
            return urlString;
        }
        return url.pathname + url.search;
    }

    private extractClientAndMethodFromStack() {
        const match = this.stack!.match(CLIENT_METHOD_REGEX);
        if (!match) return 'unknown';
        return `${match[2]}.${PUBLIC_METHOD_BY_HELPER[match[4]] ?? match[4]}`;
    }

    /**
     * Creates a better looking and more informative stack that will be printed
     * out when API errors are thrown.
     *
     * Example:
     *
     * NotFoundError: Actor task was not found
     *   clientMethod: TaskClient.start
     *   statusCode: 404
     *   type: record-not-found
     *   attempt: 1
     *   httpMethod: post
     *   path: /v2/actor-tasks/user~my-task/runs
     */
    private createApiStack() {
        const { name, ...props } = this;

        const stack = Object.entries(props)
            .map(([k, v]) => {
                // Rename originalStack to stack in the stack itself.
                // This is for better readability of errors in log.
                if (k === 'originalStack') k = 'stack';
                return `  ${k}: ${v}`;
            })
            .join('\n');

        return `${name}: ${this.message}\n${stack}`;
    }
}

/**
 * Thrown when the Apify API responds with HTTP 400 Bad Request, typically because the request
 * failed validation.
 */
export class InvalidRequestError extends ApifyApiError {}

/**
 * Thrown when the Apify API responds with HTTP 401 Unauthorized, because the token is missing
 * or invalid.
 */
export class UnauthorizedError extends ApifyApiError {}

/**
 * Thrown when the Apify API responds with HTTP 403 Forbidden, because the token lacks the
 * permission for the operation.
 */
export class ForbiddenError extends ApifyApiError {}

/**
 * Thrown when the Apify API responds with HTTP 404 Not Found.
 */
export class NotFoundError extends ApifyApiError {}

/**
 * Thrown when the Apify API responds with HTTP 409 Conflict.
 */
export class ConflictError extends ApifyApiError {}

/**
 * Thrown when the Apify API responds with HTTP 429 Too Many Requests. The client retries such
 * requests, so the error surfaces once the retries are exhausted.
 */
export class RateLimitError extends ApifyApiError {}

/**
 * Thrown when the Apify API responds with an HTTP 5xx status. The client retries such requests,
 * so the error surfaces once the retries are exhausted.
 */
export class ServerError extends ApifyApiError {}

const ERROR_CLASS_BY_STATUS: Partial<Record<number, typeof ApifyApiError>> = {
    400: InvalidRequestError,
    401: UnauthorizedError,
    403: ForbiddenError,
    404: NotFoundError,
    409: ConflictError,
    429: RateLimitError,
};
