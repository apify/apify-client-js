import type { Readable } from 'node:stream';

import { APIFY_ENV_VARS } from '@apify/consts';
import type { Log } from '@apify/log';
import log from '@apify/log';

import { ApifyApiError } from '../apify_api_error.js';
import { maybeParseBody } from '../body_parser.js';
import { InvalidResponseBodyError } from '../invalid_response_body_error.js';
import { Statistics } from '../statistics.js';
import {
    asArray,
    getVersionData,
    isBuffer,
    isCompressibleContentType,
    isNode,
    isStream,
    maybeCompressValue,
} from '../utils.js';

const { version } = getVersionData();

export const DEFAULT_MAX_RETRIES = 8;

export const DEFAULT_MIN_DELAY_BETWEEN_RETRIES_MILLIS = 500;

export const DEFAULT_TIMEOUT_SECS = 360;

const RATE_LIMIT_EXCEEDED_STATUS_CODE = 429;

const CONTENT_TYPE_JSON = 'application/json';

const CONTENT_TYPE_FORM_URLENCODED = 'application/x-www-form-urlencoded';

/**
 * HTTP methods the Apify API accepts.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Response headers keyed by lowercase header name. A header the server sent more than once may arrive as an array.
 */
export type HttpResponseHeaders = Record<string, string | string[] | undefined>;

/**
 * A request body as the transport receives it: already serialized, and compressed when that paid off. A `Readable`
 * is passed through untouched and is only available in Node.js.
 */
export type HttpRequestBody = string | Buffer | ArrayBuffer | ArrayBufferView | Readable;

/**
 * A response body as the transport hands it back: the raw bytes, a `Readable` when the request asked for a streamed
 * response, or `undefined` when the response carried no body.
 */
export type HttpResponseBody = Buffer | ArrayBuffer | Readable | undefined;

/**
 * How {@link HttpClient.call} hands back the response body.
 *
 * - `parsed` (the default) decodes it by content type: JSON becomes an object, text and XML become a string, anything
 *   else stays a `Buffer` (an `ArrayBuffer` in the browser).
 * - `buffer` skips the decoding and hands back the raw bytes.
 * - `stream` hands back a `Readable` with the body unread. Node.js only.
 */
export type ApifyResponseType = 'parsed' | 'buffer' | 'stream';

/**
 * A request as the resource clients hand it to {@link HttpClient.call}.
 */
export interface ApifyRequestConfig {
    /** Full URL of the endpoint, without the query string. */
    url: string;
    method: HttpMethod;
    /**
     * Query parameters. `undefined` values are dropped, booleans are sent as `1` and `0`, `Date` values as ISO 8601
     * strings and arrays comma-separated.
     */
    params?: Record<string, unknown>;
    /** Per-request headers. They win over the client's default headers, header names compared case-insensitively. */
    headers?: Record<string, string>;
    /**
     * Request body. A plain object or array is serialized to JSON and sent as `application/json`, or form-encoded
     * when a `Content-Type: application/x-www-form-urlencoded` header asks for it. A string, binary value
     * (`Buffer`, `ArrayBuffer`, typed array) or `Readable` is sent as it is.
     */
    data?: unknown;
    /**
     * Timeout of the first attempt in milliseconds. Each retry doubles it, and every attempt is capped at the
     * client-wide timeout. Defaults to the client-wide timeout.
     */
    timeout?: number;
    /** @default 'parsed' */
    responseType?: ApifyResponseType;
    /**
     * Serialize function-valued fields of a JSON body to their source instead of dropping them, which is how
     * Actor input carrying page functions reaches the API.
     */
    stringifyFunctions?: boolean;
    /** Give up on the first transport timeout instead of retrying it. */
    doNotRetryTimeouts?: boolean;
}

/**
 * A successful response as {@link HttpClient.call} resolves to it.
 *
 * @template T - Type of the parsed body.
 */
export interface ApifyResponse<T = any> {
    /** HTTP status code. */
    status: number;
    headers: HttpResponseHeaders;
    /** The response body, decoded according to the request's {@link ApifyRequestConfig.responseType}. */
    data: T;
    /** The request this response answers, as it was passed to {@link HttpClient.call}. */
    config: ApifyRequestConfig;
}

/**
 * One prepared request attempt, as {@link HttpClient.sendRequest} receives it from the shared pipeline.
 */
export interface HttpRequest {
    /** HTTP method. */
    method: HttpMethod;
    /** Full request URL with the query string already encoded into it. */
    url: string;
    /** Final request headers, with the client's default headers already merged in. */
    headers: Record<string, string>;
    /** Request body, already serialized and compressed, or `undefined` for a request without one. */
    body?: HttpRequestBody;
    /** Timeout for this attempt in milliseconds. */
    timeoutMillis: number;
    /** Whether to hand the body back unread as a `Readable`, so the caller can stream it. */
    stream: boolean;
}

/**
 * A response as the transport returns it from {@link HttpClient.sendRequest}, error statuses included.
 */
export interface HttpResponse {
    /** HTTP status code. */
    status: number;
    /** Response headers keyed by lowercase header name. */
    headers: HttpResponseHeaders;
    /** The body as raw bytes, or unread as a `Readable` when the request asked for a stream. */
    body: HttpResponseBody;
}

/**
 * Configuration shared by every {@link HttpClient}.
 */
export interface HttpClientOptions {
    /** Apify API token, sent as a `Bearer` token in the `Authorization` header. */
    token?: string;
    /** @default 8 */
    maxRetries?: number;
    /** Delay before the first retry in milliseconds. It doubles with every further retry. @default 500 */
    minDelayBetweenRetriesMillis?: number;
    /** Upper bound for the timeout of a single attempt, in seconds. @default 360 */
    timeoutSecs?: number;
    /** Additional headers sent with every request. They win over the built-in defaults. */
    headers?: Record<string, string>;
    /** Statistics the client records its calls into. Created when omitted. */
    stats?: Statistics;
    logger?: Log;
    /** Value of the `X-Apify-Workflow-Key` header. Defaults to the `APIFY_WORKFLOW_KEY` environment variable. */
    workflowKey?: string;
    /** @internal */
    userAgentSuffix?: string | string[];
}

/**
 * Base class for the HTTP clients used by {@link ApifyClient}.
 *
 * It holds the shared request pipeline: {@link call} merges the default headers in, serializes and compresses the
 * body, encodes the query parameters, retries transient failures with exponential backoff, grows the timeout with
 * every attempt, decodes the response body by content type, records statistics and converts error statuses to
 * {@link ApifyApiError}. A concrete client only has to implement {@link sendRequest}, the transport that moves one
 * prepared request over the wire, and can override the classification and lifecycle hooks {@link isTimeoutError},
 * {@link isRetryableTransportError} and {@link close}.
 *
 * Overriding {@link call} itself is also supported and bypasses the transport hooks entirely. Such a client has
 * to send the default headers from `defaultHeaders` with every request, otherwise the `Authorization` header never
 * reaches the API. The protected helpers `_prepareRequest()`, `_buildUrl()` and `_computeTimeoutMillis()` stay
 * available to it.
 *
 * @example
 * ```javascript
 * import { ApifyClient, HttpClient } from 'apify-client';
 *
 * class FetchHttpClient extends HttpClient {
 *     async sendRequest({ method, url, headers, body, timeoutMillis }) {
 *         const response = await fetch(url, { method, headers, body, signal: AbortSignal.timeout(timeoutMillis) });
 *         return {
 *             status: response.status,
 *             headers: Object.fromEntries(response.headers),
 *             body: Buffer.from(await response.arrayBuffer()),
 *         };
 *     }
 * }
 *
 * const client = ApifyClient.withCustomHttpClient({ token: 'my-token', httpClient: new FetchHttpClient() });
 * ```
 */
export abstract class HttpClient {
    /** Statistics of the API calls made through this client. */
    stats: Statistics;

    /** Logger for the retry warnings. */
    logger: Log;

    /** How many times a failed request is retried at most. */
    maxRetries: number;

    /** Delay before the first retry in milliseconds. It doubles with every further retry. */
    minDelayBetweenRetriesMillis: number;

    /** Upper bound for the timeout of a single attempt, in milliseconds. */
    timeoutMillis: number;

    /**
     * Headers sent with every request: the `Authorization` header built from the token, the `User-Agent` (Node.js
     * only, browsers refuse a caller-set one), the `X-Apify-Workflow-Key` when a workflow key is configured, and
     * whatever {@link HttpClientOptions.headers} added.
     */
    protected readonly defaultHeaders: Record<string, string>;

    constructor(options: HttpClientOptions = {}) {
        this.stats = options.stats ?? new Statistics();
        this.logger = options.logger ?? log.child({ prefix: 'ApifyClient' });
        this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
        this.minDelayBetweenRetriesMillis =
            options.minDelayBetweenRetriesMillis ?? DEFAULT_MIN_DELAY_BETWEEN_RETRIES_MILLIS;
        this.timeoutMillis = (options.timeoutSecs ?? DEFAULT_TIMEOUT_SECS) * 1000;

        const defaults: Record<string, string> = {};

        const workflowKey = options.workflowKey || getEnv(APIFY_ENV_VARS.WORKFLOW_KEY);
        if (workflowKey) defaults['X-Apify-Workflow-Key'] = workflowKey;

        if (isNode()) {
            const isAtHome = !!getEnv(APIFY_ENV_VARS.IS_AT_HOME);
            let userAgent = `ApifyClient/${version} (${process.platform}; Node/${process.version}); isAtHome/${isAtHome}`;
            if (options.userAgentSuffix) userAgent += `; ${asArray(options.userAgentSuffix).join('; ')}`;
            defaults['User-Agent'] = userAgent;
        }

        if (options.token) defaults.Authorization = `Bearer ${options.token}`;

        this.defaultHeaders = mergeHeaders(defaults, options.headers);
    }

    /**
     * Sets the `Authorization` header from the token, unless an authorization header is already configured.
     *
     * @param token - The Apify API token to send as the `Bearer` token.
     */
    setDefaultAuthorization(token: string): void {
        if (getHeader(this.defaultHeaders, 'authorization') === undefined) {
            this.defaultHeaders.Authorization = `Bearer ${token}`;
        }
    }

    /**
     * Whether an error thrown by the transport is a timeout.
     *
     * Recognizes errors named `TimeoutError`, which is what `AbortSignal.timeout()` produces. Transports extend it
     * with the timeout errors their HTTP library throws. The classification is independent of retryability: a
     * timeout the retry loop should retry has to be covered by {@link isRetryableTransportError} too.
     */
    isTimeoutError(error: unknown): boolean {
        return error instanceof Error && error.name === 'TimeoutError';
    }

    /**
     * Whether an error thrown by the transport is worth retrying.
     *
     * The default classifies nothing as retryable, so a transport that does not override it gives up on the first
     * connection failure. Every transport should map its own transient errors here: connection resets, refused
     * connections, timeouts and the like. Error responses are not the transport's concern, the pipeline decides on
     * them from the status code.
     */
    isRetryableTransportError(_error: unknown): boolean {
        return false;
    }

    /**
     * Releases resources owned by the transport, such as a connection pool. The default does nothing.
     */
    async close(): Promise<void> {
        // Nothing to release without a transport of its own.
    }

    /**
     * Sends one prepared request through the underlying HTTP library.
     *
     * The inherited {@link call} needs it, so every transport has to implement it. Let the library's errors
     * propagate unwrapped: {@link call} classifies them through {@link isRetryableTransportError} and
     * {@link isTimeoutError}. Return error responses as they are too, the pipeline turns them into
     * {@link ApifyApiError} and decides whether to retry.
     *
     * @param request - The request to send, with the headers merged, the body serialized and the query encoded.
     * @returns The response, with the body unread when `request.stream` is set and as raw bytes otherwise.
     */
    async sendRequest(_request: HttpRequest): Promise<HttpResponse> {
        throw new Error('Implement sendRequest() to provide a transport, or override call() entirely.');
    }

    /**
     * Makes an API request with automatic retries and exponential backoff.
     *
     * Network errors the transport classifies as retryable, rate limits (HTTP 429) and server errors (HTTP 5xx)
     * are retried up to {@link maxRetries} times. Any other error status is thrown as {@link ApifyApiError} right
     * away. A request whose body is a `Readable` is never retried, since part of the stream has already been
     * consumed by the time the failure shows.
     *
     * @template T - Type of the parsed response body.
     * @param config - The request to make.
     * @returns The successful response.
     * @throws {ApifyApiError} When the API responds with an error status the retries could not fix.
     */
    async call<T = any>(config: ApifyRequestConfig): Promise<ApifyResponse<T>> {
        this.stats.calls++;

        const { headers, body } = await this._prepareRequest(config);
        const url = this._buildUrl(config.url, config.params);

        return this._retryWithExpBackoff(async (stopRetrying, attempt) =>
            this._makeRequest<T>({ config, url, headers, body, attempt, stopRetrying }),
        );
    }

    /**
     * Prepares the headers and the body of a request.
     *
     * Merges the client's default headers with the per-request ones, header names compared case-insensitively and
     * the per-request values winning. Serializes an object body to JSON, setting `Content-Type: application/json`
     * unless the caller supplied a content type. Compresses the body unless a `Content-Encoding` header is already
     * set, the body is too small, or its content type says the payload is already compressed. A caller-supplied
     * `Content-Encoding` is forwarded as it is, which is how a pre-encoded body is uploaded.
     */
    protected async _prepareRequest(
        config: ApifyRequestConfig,
    ): Promise<{ headers: Record<string, string>; body: HttpRequestBody | undefined }> {
        let headers = mergeHeaders(this.defaultHeaders, config.headers);
        let body = serializeBody(config.data, headers, config.stringifyFunctions);

        if (
            body !== undefined &&
            getHeader(headers, 'content-encoding') === undefined &&
            isCompressibleContentType(getHeader(headers, 'content-type'))
        ) {
            const compressed = await maybeCompressValue(body);
            if (compressed) {
                body = compressed.data;
                headers = mergeHeaders(headers, { 'Content-Encoding': compressed.encoding });
            }
        }

        return { headers, body };
    }

    /**
     * Appends the query parameters to the URL. `undefined` values are dropped, booleans are sent as `1` and `0`,
     * `Date` values as ISO 8601 strings and arrays comma-separated.
     */
    protected _buildUrl(url: string, params?: Record<string, unknown>): string {
        const pairs: [string, string][] = [];
        for (const [key, value] of Object.entries(params ?? {})) {
            if (value === undefined) continue;
            if (value instanceof Date) pairs.push([key, value.toISOString()]);
            else if (typeof value === 'boolean') pairs.push([key, String(Number(value))]);
            else pairs.push([key, String(value)]);
        }
        if (pairs.length === 0) return url;

        const query = new URLSearchParams(pairs).toString();
        return `${url}${url.includes('?') ? '&' : '?'}${query}`;
    }

    /**
     * Computes the timeout of an attempt: the request's own timeout doubled with every retry, capped at the
     * client-wide timeout.
     *
     * @param timeoutMillis - The request's timeout for the first attempt. Defaults to the client-wide timeout.
     * @param attempt - Current attempt number, starting at 1.
     */
    protected _computeTimeoutMillis(timeoutMillis: number | undefined, attempt: number): number {
        return Math.min(this.timeoutMillis, (timeoutMillis ?? this.timeoutMillis) * 2 ** (attempt - 1));
    }

    /**
     * Retries `fn` with exponential backoff until it resolves, `stopRetrying()` was called before it threw, or the
     * retries are exhausted. The last attempt's error propagates as it is.
     */
    private async _retryWithExpBackoff<T>(fn: (stopRetrying: () => void, attempt: number) => Promise<T>): Promise<T> {
        let retry = true;
        const stopRetrying = () => {
            retry = false;
        };

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                return await fn(stopRetrying, attempt);
            } catch (err) {
                if (!retry) throw err;
                this._onRequestRetry(err, attempt);
            }

            await new Promise((resolve) => {
                setTimeout(resolve, this.minDelayBetweenRetriesMillis * 2 ** (attempt - 1));
            });
        }

        return fn(stopRetrying, this.maxRetries + 1);
    }

    /**
     * Executes one attempt: sends the request, decodes the body and turns an error status into {@link ApifyApiError}.
     * Throws for anything that is not a success, and flags the failure as final through `stopRetrying()` when a
     * retry could not fix it.
     */
    private async _makeRequest<T>(options: {
        config: ApifyRequestConfig;
        url: string;
        headers: Record<string, string>;
        body: HttpRequestBody | undefined;
        attempt: number;
        stopRetrying: () => void;
    }): Promise<ApifyResponse<T>> {
        const { config, url, headers, body, attempt, stopRetrying } = options;
        this.stats.requests++;

        const requestIsStream = isStream(config.data);

        let response: HttpResponse;
        try {
            response = await this.sendRequest({
                method: config.method,
                url,
                headers,
                body,
                timeoutMillis: this._computeTimeoutMillis(config.timeout, attempt),
                stream: config.responseType === 'stream',
            });
        } catch (err) {
            this._handleRequestError(err, config, stopRetrying);
            throw err;
        }

        let data: unknown;
        try {
            data = this._parseResponseBody(response, config);
        } catch (err) {
            // A body that does not parse is usually a connection dropped mid-response, which a retry fixes.
            if (requestIsStream) {
                this._informAboutStreamNoRetry();
                stopRetrying();
            }
            throw err;
        }

        const apifyResponse: ApifyResponse<T> = {
            status: response.status,
            headers: response.headers,
            data: data as T,
            config,
        };
        if (response.status < 300) return apifyResponse;

        if (response.status === RATE_LIMIT_EXCEEDED_STATUS_CODE) {
            this.stats.addRateLimitError(attempt);
        }

        const apiError = ApifyApiError.fromResponse(apifyResponse, attempt);
        if (!this._isStatusCodeRetryable(response.status)) {
            stopRetrying();
        } else if (requestIsStream) {
            this._informAboutStreamNoRetry();
            stopRetrying();
        }
        throw apiError;
    }

    /**
     * Decodes the response body according to the request's `responseType`. An empty body decodes to `undefined`.
     *
     * @throws {InvalidResponseBodyError} When the body does not parse as its content type claims.
     */
    private _parseResponseBody(response: HttpResponse, config: ApifyRequestConfig): unknown {
        const { body } = response;
        if (config.responseType === 'stream' || config.responseType === 'buffer') return body;
        if (body === undefined || isStream(body)) return body;
        if (body.byteLength === 0) return undefined;

        try {
            return maybeParseBody(body, headerValue(response.headers['content-type']) ?? '');
        } catch (err) {
            throw new InvalidResponseBodyError(response, err as Error);
        }
    }

    /**
     * Decides whether a transport error ends the call. Timeouts the request opted out of retrying and errors the
     * transport does not classify as retryable are final, and so is any error on a request with a stream body.
     */
    private _handleRequestError(err: unknown, config: ApifyRequestConfig, stopRetrying: () => void): void {
        if (config.doNotRetryTimeouts && this.isTimeoutError(err)) {
            stopRetrying();
            return;
        }

        if (!this.isRetryableTransportError(err)) {
            stopRetrying();
            return;
        }

        if (isStream(config.data)) {
            this._informAboutStreamNoRetry();
            stopRetrying();
        }
    }

    /**
     * Rate limits (429) and server errors (500+) are retried. Anything else in 300-499 is a redirect the client
     * cannot follow or invalid input, which repeating the request cannot fix.
     */
    private _isStatusCodeRetryable(statusCode: number): boolean {
        return statusCode === RATE_LIMIT_EXCEEDED_STATUS_CODE || statusCode >= 500;
    }

    private _informAboutStreamNoRetry(): void {
        this.logger.warningOnce(
            'Request body was a stream - retrying will not work, as part of it was already consumed.',
        );
        this.logger.warningOnce(
            'If you want Apify client to handle retries for you, collect the stream into a buffer before sending it.',
        );
    }

    private _onRequestRetry(error: unknown, attempt: number): void {
        if (attempt === Math.round(this.maxRetries / 2)) {
            this.logger.warning(
                `API request failed ${attempt} times. Max attempts: ${this.maxRetries + 1}.\nCause:${(error as Error).stack}`,
            );
        }
    }
}

function getEnv(name: string): string | undefined {
    return typeof process !== 'undefined' ? process.env?.[name] : undefined;
}

/**
 * Looks a header up by name, compared case-insensitively.
 */
function getHeader(headers: Record<string, string>, name: string): string | undefined {
    const wanted = name.toLowerCase();
    const key = Object.keys(headers).find((candidate) => candidate.toLowerCase() === wanted);
    return key === undefined ? undefined : headers[key];
}

/**
 * Merges two header records, header names compared case-insensitively. A header from `override` replaces a
 * same-named header in `base` whatever the casing of either, and keeps the casing it was passed with.
 */
function mergeHeaders(base: Record<string, string>, override?: Record<string, string>): Record<string, string> {
    const merged = { ...base };
    for (const [key, value] of Object.entries(override ?? {})) {
        for (const existing of Object.keys(merged)) {
            if (existing.toLowerCase() === key.toLowerCase()) delete merged[existing];
        }
        merged[key] = value;
    }
    return merged;
}

function headerValue(value: string | string[] | undefined): string | undefined {
    return Array.isArray(value) ? value[0] : value;
}

function mediaType(contentType: string | undefined): string | undefined {
    return contentType?.split(';', 1)[0].trim().toLowerCase();
}

function isJsonContentType(contentType: string | undefined): boolean {
    return mediaType(contentType) === CONTENT_TYPE_JSON;
}

/**
 * Serializes a request body and sets the `Content-Type` header a JSON body needs. Binary bodies become a `Buffer`
 * in Node.js, sharing the memory of the value passed in, so the compressor can handle them.
 */
function serializeBody(
    data: unknown,
    headers: Record<string, string>,
    stringifyFunctions?: boolean,
): HttpRequestBody | undefined {
    if (data === undefined || data === null) return undefined;
    if (isStream(data)) return data;

    if (isBuffer(data)) {
        if (!isNode() || Buffer.isBuffer(data)) return data;
        return ArrayBuffer.isView(data)
            ? Buffer.from(data.buffer, data.byteOffset, data.byteLength)
            : Buffer.from(data);
    }

    if (typeof data === 'string') {
        // With a JSON content type, a string that already is valid JSON goes out as it is and any other string is
        // JSON-encoded, so `pushItems('text')` and `pushItems('[{...}]')` both reach the API as JSON.
        if (!isJsonContentType(getHeader(headers, 'content-type'))) return data;
        try {
            JSON.parse(data);
            return data.trim();
        } catch {
            return JSON.stringify(data);
        }
    }

    if (typeof data === 'object') {
        if (getHeader(headers, 'content-type') === undefined) headers['Content-Type'] = CONTENT_TYPE_JSON;
        const contentType = getHeader(headers, 'content-type');
        if (mediaType(contentType) === CONTENT_TYPE_FORM_URLENCODED) return toFormUrlEncoded(data);
        const withFunctions = stringifyFunctions && isJsonContentType(contentType);
        return JSON.stringify(data, withFunctions ? stringifyFunctionReplacer : undefined);
    }

    throw new TypeError(`Unsupported request body type: ${typeof data}`);
}

function stringifyFunctionReplacer(_key: string, value: unknown): unknown {
    return typeof value === 'function' ? value.toString() : value;
}

/**
 * Form-encodes an object the way HTML forms and axios do: nested objects as `key[sub]`, arrays as repeated `key[]`,
 * dates in ISO 8601, and `null` and `undefined` fields left out.
 */
function toFormUrlEncoded(data: object): string {
    const params = new URLSearchParams();
    const append = (key: string, value: unknown) => {
        if (value === undefined || value === null) return;
        if (value instanceof Date) params.append(key, value.toISOString());
        else if (Array.isArray(value)) value.forEach((item) => append(`${key}[]`, item));
        else if (typeof value === 'object') {
            Object.entries(value).forEach(([sub, item]) => append(`${key}[${sub}]`, item));
        } else params.append(key, String(value));
    };
    Object.entries(data).forEach(([key, value]) => append(key, value));
    return params.toString();
}
