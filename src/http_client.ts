import type http from 'node:http';
import type https from 'node:https';

import type { RetryFunction } from 'async-retry';
import retry from 'async-retry';
import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import axios, { AxiosHeaders } from 'axios';

import { APIFY_ENV_VARS } from '@apify/consts';
import type { Log } from '@apify/log';

import { ApifyApiError } from './apify_api_error.js';
import type { RequestInterceptorFunction } from './interceptors.js';
import { InvalidResponseBodyError, requestInterceptors, responseInterceptors } from './interceptors.js';
import { runtime } from '#runtime';
import type { Statistics } from './statistics.js';
import type { Timeout, TimeoutTier } from './timeouts.js';
import { asArray, cast, getEnv, isStream, version } from './utils.js';

const RATE_LIMIT_EXCEEDED_STATUS_CODE = 429;

export class HttpClient {
    stats: Statistics;

    maxRetries: number;

    minDelayBetweenRetriesMillis: number;

    userProvidedRequestInterceptors: RequestInterceptorFunction[];

    logger: Log;

    /** Duration of each timeout tier, in milliseconds. */
    timeoutMillis: Record<TimeoutTier, number>;

    /** Cap on the timeout of a single request attempt, in milliseconds. */
    timeoutMaxMillis: number;

    httpAgent?: http.Agent;

    httpsAgent?: https.Agent;

    axios: AxiosInstance;

    workflowKey?: string;

    #httpAgentsPromise?: Promise<void>;

    constructor(options: HttpClientOptions) {
        const { token } = options;
        this.stats = options.apifyClientStats;
        this.maxRetries = options.maxRetries;
        this.minDelayBetweenRetriesMillis = options.minDelayBetweenRetriesMillis;
        this.userProvidedRequestInterceptors = options.requestInterceptors;
        this.timeoutMillis = {
            short: options.timeoutShortSecs * 1000,
            medium: options.timeoutMediumSecs * 1000,
            long: options.timeoutLongSecs * 1000,
        };
        this.timeoutMaxMillis = options.timeoutMaxSecs * 1000;
        this.logger = options.logger;
        this.workflowKey = options.workflowKey || getEnv(APIFY_ENV_VARS.WORKFLOW_KEY);

        this.axios = axios.create({
            // Disable axios's built-in proxy handling since we're using custom agents
            proxy: false,
            paramsSerializer: (params) => {
                const formattedParams: [string, string][] = Object.entries<string | Date>(params)
                    .filter(([, value]) => value !== undefined)
                    .map(([key, value]) => {
                        if (value instanceof Date) {
                            return [key, value.toISOString()];
                        }
                        const updatedValue = typeof value === 'boolean' ? Number(value) : value;
                        return [key, String(updatedValue)];
                    });

                return new URLSearchParams(formattedParams).toString();
            },
            validateStatus: null,
            // Using interceptors for this functionality.
            transformRequest: undefined,
            transformResponse: undefined,
            responseType: 'arraybuffer',
            // Every request sets its own timeout in `createRequestHandler`, so the default only backs a raw
            // `axios.request()` call.
            timeout: this.timeoutMaxMillis,
            // maxBodyLength needs to be Infinity, because -1 falls back to a 10 MB default
            // from an axios subdependency - 'follow-redirects'
            maxBodyLength: Infinity,
            // maxContentLength must be -1, because Infinity will cause axios to run super slow
            // thanks to a bug that's now fixed, but not released yet https://github.com/axios/axios/pull/3738
            maxContentLength: -1,
        });

        // Clean all default headers because they only make a mess and their merging is difficult to understand and buggy.
        this.axios.defaults.headers = new AxiosHeaders() as any;

        // If workflow key is available, pass it as a header
        if (this.workflowKey) {
            this.axios.defaults.headers['X-Apify-Workflow-Key'] = this.workflowKey;
        }

        // Attach Authorization header for all requests if token was provided
        if (token) {
            this.axios.defaults.headers.Authorization = `Bearer ${token}`;
        }

        // Browsers do not let a page set the header, so it is only sent where the runtime describes its platform.
        if (runtime.platform) {
            const isAtHome = !!getEnv(APIFY_ENV_VARS.IS_AT_HOME);
            let userAgent = `ApifyClient/${version} (${runtime.platform}); isAtHome/${isAtHome}`;

            if (options.userAgentSuffix) {
                userAgent += `; ${asArray(options.userAgentSuffix).join('; ')}`;
            }

            this.axios.defaults.headers['User-Agent'] = userAgent;
        }

        requestInterceptors.forEach((i) => this.axios.interceptors.request.use(i as any));
        this.userProvidedRequestInterceptors.forEach((i) => this.axios.interceptors.request.use(i as any));
        responseInterceptors.forEach((i) => this.axios.interceptors.response.use(i as any));
    }

    async #ensureHttpAgents(): Promise<void> {
        this.#httpAgentsPromise ??= this.#initHttpAgents();

        return this.#httpAgentsPromise;
    }

    async #initHttpAgents(): Promise<void> {
        const agents = await runtime.createHttpAgents({ timeoutMillis: this.timeoutMaxMillis });
        if (!agents) return;

        this.httpAgent = agents.httpAgent;
        this.httpsAgent = agents.httpsAgent;
        this.axios.defaults.httpAgent = this.httpAgent;
        this.axios.defaults.httpsAgent = this.httpsAgent;
    }

    async call<T = any>(config: ApifyRequestConfig): Promise<ApifyResponse<T>> {
        await this.#ensureHttpAgents();
        this.stats.calls++;
        const makeRequest = this.#createRequestHandler(config);

        return retry(makeRequest, {
            retries: this.maxRetries,
            minTimeout: this.minDelayBetweenRetriesMillis,
            onRetry: (error, attempt) => this.#onRequestRetry(error, attempt),
        });
    }

    #informAboutStreamNoRetry() {
        this.logger.warningOnce(
            'Request body was a stream - retrying will not work, as part of it was already consumed.',
        );
        this.logger.warningOnce(
            'If you want Apify client to handle retries for you, collect the stream into a buffer before sending it.',
        );
    }

    /**
     * Successful responses are returned, errors and unsuccessful
     * status codes are retried. See the following functions for the
     * retrying logic.
     */
    #createRequestHandler(config: ApifyRequestConfig) {
        const { timeoutSecs = 'medium', ...axiosConfig } = config;

        const makeRequest: RetryFunction<ApifyResponse, Error> = async (stopTrying, attempt) => {
            this.stats.requests++;
            let response: ApifyResponse;
            const requestIsStream = isStream(config.data);

            try {
                if (requestIsStream) {
                    // Handling redirects is not possible without buffering - part of the stream has already been sent and can't be recovered
                    // when server sends the redirect. Therefore we need to override this in Axios config to prevent it from buffering the body.
                    // see also axios/axios#1045
                    axiosConfig.maxRedirects = 0;
                }

                response = await this.axios.request({
                    ...axiosConfig,
                    timeout: this.#computeTimeoutMillis(timeoutSecs, attempt),
                });
                if (this.#isStatusOk(response.status)) return response;
            } catch (err) {
                return cast(this.#handleRequestError(err as AxiosError, config, stopTrying));
            }

            if (response.status === RATE_LIMIT_EXCEEDED_STATUS_CODE) {
                this.stats.addRateLimitError(attempt);
            }

            const apiError = ApifyApiError.fromResponse(response, attempt);
            if (this.#isStatusCodeRetryable(response.status)) {
                if (requestIsStream) {
                    this.#informAboutStreamNoRetry();
                } else {
                    // allow a retry
                    throw apiError;
                }
            }
            stopTrying(apiError);

            return response;
        };

        return makeRequest;
    }

    #isStatusOk(statusCode: number) {
        return statusCode < 300;
    }

    /**
     * Resolves `timeoutSecs` to the number of milliseconds the given attempt gets. A tier name resolves to
     * its configured duration, a number is taken as seconds, and `'noTimeout'` becomes `0`, which axios reads
     * as no timeout. The result doubles with each attempt and is capped at `timeoutMaxMillis`. A requested
     * value above the cap is capped too, which warns once, since it does not take effect in full.
     */
    #computeTimeoutMillis(timeoutSecs: Timeout, attempt: number): number {
        if (timeoutSecs === 'noTimeout') return 0;

        const requestedMillis = typeof timeoutSecs === 'number' ? timeoutSecs * 1000 : this.timeoutMillis[timeoutSecs];

        if (requestedMillis > this.timeoutMaxMillis) {
            // `warningOnce` keys by message, so each requested value warns once.
            this.logger.warningOnce(
                `The requested timeout of ${requestedMillis / 1000}s exceeds timeoutMaxSecs ` +
                    `(${this.timeoutMaxMillis / 1000}s) and is capped at it. ` +
                    'Raise timeoutMaxSecs on the client to allow longer request timeouts.',
            );
        }

        return Math.min(requestedMillis * 2 ** (attempt - 1), this.timeoutMaxMillis);
    }

    /**
     * Handles all unexpected errors that can happen, but are not
     * Apify API typed errors. E.g. network errors, timeouts and so on.
     */
    #handleRequestError(err: AxiosError, config: ApifyRequestConfig, stopTrying: (e: Error) => void) {
        if (this.#isTimeoutError(err) && config.doNotRetryTimeouts) {
            return stopTrying(err);
        }

        if (this.#isRetryableError(err)) {
            if (isStream(config.data)) {
                this.#informAboutStreamNoRetry();
            } else {
                throw err;
            }
        }
        return stopTrying(err);
    }

    /**
     * Axios calls req.abort() on timeouts so timeout errors will
     * have a code ECONNABORTED.
     */
    #isTimeoutError(err: AxiosError) {
        return err.code === 'ECONNABORTED';
    }

    /**
     * We don't want to retry every exception thrown from Axios.
     * The common denominator for retryable errors are network issues.
     * @param {Error} err
     * @private
     */
    #isRetryableError(err: AxiosError) {
        return this.#isNetworkError(err) || this.#isResponseBodyInvalid(err);
    }

    /**
     * When a network connection to our API is interrupted in the middle of streaming
     * a response, the request often does not fail, but simply contains
     * an incomplete response. This can often be fixed by retrying.
     */
    #isResponseBodyInvalid(err: Error): err is InvalidResponseBodyError {
        return err instanceof InvalidResponseBodyError;
    }

    /**
     * When a network request is attempted by axios and fails,
     * it throws an AxiosError, which will have the request
     * and config (and other) properties.
     */
    #isNetworkError(err: AxiosError) {
        const hasRequest = err.request && typeof err.request === 'object';
        const hasConfig = err.config && typeof err.config === 'object';
        return hasRequest && hasConfig;
    }

    /**
     * We retry 429 (rate limit) and 500+.
     * For status codes 300-499 (except 429) we do not retry the request,
     * because it's probably caused by invalid url (redirect 3xx) or invalid user input (4xx).
     */
    #isStatusCodeRetryable(statusCode: number) {
        const isRateLimitError = statusCode === RATE_LIMIT_EXCEEDED_STATUS_CODE;
        const isInternalError = statusCode >= 500;
        return isRateLimitError || isInternalError;
    }

    #onRequestRetry(error: Error, attempt: number) {
        if (attempt === Math.round(this.maxRetries / 2)) {
            this.logger.warning(
                `API request failed ${attempt} times. Max attempts: ${this.maxRetries + 1}.\nCause:${error.stack}`,
            );
        }
    }
}

export interface ApifyRequestConfig extends Omit<AxiosRequestConfig, 'timeout'> {
    stringifyFunctions?: boolean;
    forceBuffer?: boolean;
    doNotRetryTimeouts?: boolean;
    /**
     * Timeout of the request: a tier name, a number of seconds, or `'noTimeout'`. The client resolves it to
     * the axios `timeout` in milliseconds for each attempt, before axios runs its interceptors, so a request
     * interceptor already sees a number of milliseconds.
     * @default 'medium'
     */
    timeoutSecs?: Timeout;
}

export interface ApifyResponse<T = any> extends AxiosResponse<T> {
    config: ApifyRequestConfig & InternalAxiosRequestConfig;
}

export interface HttpClientOptions {
    apifyClientStats: Statistics;
    maxRetries: number;
    minDelayBetweenRetriesMillis: number;
    requestInterceptors: RequestInterceptorFunction[];
    timeoutShortSecs: number;
    timeoutMediumSecs: number;
    timeoutLongSecs: number;
    timeoutMaxSecs: number;
    logger: Log;
    token?: string;
    workflowKey?: string;
    /** @internal */
    userAgentSuffix?: string | string[];
}
