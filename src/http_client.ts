import os from 'os';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import retry, { RetryFunction } from 'async-retry';
import KeepAliveAgent from 'agentkeepalive';
import { APIFY_ENV_VARS } from '@apify/consts';
import { Log } from '@apify/log';
import { ApifyApiError } from './apify_api_error';
import {
    InvalidResponseBodyError,
    RequestInterceptorFunction,
    requestInterceptors,
    responseInterceptors,
} from './interceptors';
import {
    isNode,
    getVersionData,
    cast,
    isStream,
} from './utils';
import { Statistics } from './statistics';

const { version } = getVersionData();

const RATE_LIMIT_EXCEEDED_STATUS_CODE = 429;

export class HttpClient {
    stats: Statistics;

    maxRetries: number;

    minDelayBetweenRetriesMillis: number;

    userProvidedRequestInterceptors: RequestInterceptorFunction[];

    logger: Log;

    timeoutMillis: number;

    httpAgent?: KeepAliveAgent;

    httpsAgent?: KeepAliveAgent.HttpsAgent;

    axios: AxiosInstance;

    workflowKey?: string;

    constructor(options: HttpClientOptions) {
        const { token } = options;
        this.stats = options.apifyClientStats;
        this.maxRetries = options.maxRetries;
        this.minDelayBetweenRetriesMillis = options.minDelayBetweenRetriesMillis;
        this.userProvidedRequestInterceptors = options.requestInterceptors;
        this.timeoutMillis = options.timeoutSecs * 1000;
        this.logger = options.logger;
        this.workflowKey = options.workflowKey || process.env[APIFY_ENV_VARS.WORKFLOW_KEY];
        this._onRequestRetry = this._onRequestRetry.bind(this);

        if (isNode()) {
            // We want to keep sockets alive for better performance.
            // It's important to set the user's timeout also here and not only
            // on the axios instance, because even though this timeout
            // is for inactive sockets, sometimes the platform would take
            // long to process requests and the socket would time-out
            // while waiting for the response.
            const agentOpts = {
                timeout: this.timeoutMillis,
            };
            this.httpAgent = new KeepAliveAgent(agentOpts);
            this.httpsAgent = new KeepAliveAgent.HttpsAgent(agentOpts);
        }

        this.axios = axios.create({
            httpAgent: this.httpAgent,
            httpsAgent: this.httpsAgent,
            paramsSerializer: (params) => {
                const formattedParams = Object.entries<string>(params)
                    .filter(([, value]) => value !== undefined)
                    .map(([key, value]) => {
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
            timeout: this.timeoutMillis,
            // maxBodyLength needs to be Infinity, because -1 falls back to a 10 MB default
            // from an axios subdependency - 'follow-redirects'
            maxBodyLength: Infinity,
            // maxContentLength must be -1, because Infinity will cause axios to run super slow
            // thanks to a bug that's now fixed, but not released yet https://github.com/axios/axios/pull/3738
            maxContentLength: -1,
        });

        // Clean all default headers because they only make a mess and their merging is difficult to understand and buggy.
        this.axios.defaults.headers = {};

        // If workflow key is available, pass it as a header
        if (this.workflowKey) {
            this.axios.defaults.headers['X-Apify-Workflow-Key'] = this.workflowKey;
        }

        if (isNode()) {
            // Works only in Node. Cannot be set in browser
            const isAtHome = !!process.env[APIFY_ENV_VARS.IS_AT_HOME];
            const userAgent = `ApifyClient/${version} (${os.type()}; Node/${process.version}); isAtHome/${isAtHome}`;
            this.axios.defaults.headers['User-Agent'] = userAgent;
        }

        // Attach Authorization header for all requests if token was provided
        if (token) {
            this.axios.defaults.headers.Authorization = `Bearer ${token}`;
        }

        requestInterceptors.forEach((i) => this.axios.interceptors.request.use(i));
        this.userProvidedRequestInterceptors.forEach((i) => this.axios.interceptors.request.use(i));
        responseInterceptors.forEach((i) => this.axios.interceptors.response.use(i));
    }

    async call<T = any>(config: ApifyRequestConfig): Promise<ApifyResponse<T>> {
        this.stats.calls++;
        const makeRequest = this._createRequestHandler(config);

        return retry(makeRequest, {
            retries: this.maxRetries,
            minTimeout: this.minDelayBetweenRetriesMillis,
            onRetry: this._onRequestRetry,
        });
    }

    private _informAboutStreamNoRetry() {
        this.logger.warningOnce('Request body was a stream - retrying will not work, as part of it was already consumed.');
        this.logger.warningOnce('If you want Apify client to handle retries for you, collect the stream into a buffer before sending it.');
    }

    /**
     * Successful responses are returned, errors and unsuccessful
     * status codes are retried. See the following functions for the
     * retrying logic.
     */
    private _createRequestHandler(config: ApifyRequestConfig) {
        const makeRequest: RetryFunction<ApifyResponse> = async (stopTrying, attempt) => {
            this.stats.requests++;
            let response: ApifyResponse;
            const requestIsStream = isStream(config.data);
            try {
                if (requestIsStream) {
                    // Handling redirects is not possible without buffering - part of the stream has already been sent and can't be recovered
                    // when server sends the redirect. Therefore we need to override this in Axios config to prevent it from buffering the body.
                    // see also axios/axios#1045
                    config = { ...config, maxRedirects: 0 };
                }
                response = await this.axios.request(config);
                if (this._isStatusOk(response.status)) return response;
            } catch (err) {
                return cast(this._handleRequestError(err as AxiosError, config, stopTrying));
            }

            if (response.status === RATE_LIMIT_EXCEEDED_STATUS_CODE) {
                this.stats.addRateLimitError(attempt);
            }

            const apiError = new ApifyApiError(response, attempt);
            if (this._isStatusCodeRetryable(response.status)) {
                if (requestIsStream) {
                    this._informAboutStreamNoRetry();
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

    private _isStatusOk(statusCode: number) {
        return statusCode < 300;
    }

    /**
     * Handles all unexpected errors that can happen, but are not
     * Apify API typed errors. E.g. network errors, timeouts and so on.
     */
    private _handleRequestError(err: AxiosError, config: ApifyRequestConfig, stopTrying: (e: Error) => void) {
        if (this._isTimeoutError(err) && config.doNotRetryTimeouts) {
            return stopTrying(err);
        }

        if (this._isRetryableError(err)) {
            if (isStream(config.data)) {
                this._informAboutStreamNoRetry();
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
    private _isTimeoutError(err: AxiosError) {
        return err.code === 'ECONNABORTED';
    }

    /**
     * We don't want to retry every exception thrown from Axios.
     * The common denominator for retryable errors are network issues.
     * @param {Error} err
     * @private
     */
    private _isRetryableError(err: AxiosError) {
        return this._isNetworkError(err) || this._isResponseBodyInvalid(err);
    }

    /**
     * When a network connection to our API is interrupted in the middle of streaming
     * a response, the request often does not fail, but simply contains
     * an incomplete response. This can often be fixed by retrying.
     */
    private _isResponseBodyInvalid(err: Error): err is InvalidResponseBodyError {
        return err instanceof InvalidResponseBodyError;
    }

    /**
     * When a network request is attempted by axios and fails,
     * it throws an AxiosError, which will have the request
     * and config (and other) properties.
     */
    private _isNetworkError(err: AxiosError) {
        const hasRequest = err.request && typeof err.request === 'object';
        const hasConfig = err.config && typeof err.config === 'object';
        return hasRequest && hasConfig;
    }

    /**
     * We retry 429 (rate limit) and 500+.
     * For status codes 300-499 (except 429) we do not retry the request,
     * because it's probably caused by invalid url (redirect 3xx) or invalid user input (4xx).
     */
    private _isStatusCodeRetryable(statusCode: number) {
        const isRateLimitError = statusCode === RATE_LIMIT_EXCEEDED_STATUS_CODE;
        const isInternalError = statusCode >= 500;
        return isRateLimitError || isInternalError;
    }

    private _onRequestRetry(error: Error, attempt: number) {
        if (attempt === Math.round(this.maxRetries / 2)) {
            this.logger.warning(`API request failed ${attempt} times. Max attempts: ${this.maxRetries + 1}.\nCause:${error.stack}`);
        }
    }
}

export interface ApifyRequestConfig extends AxiosRequestConfig {
    stringifyFunctions?: boolean;
    forceBuffer?: boolean;
    doNotRetryTimeouts?: boolean;
}

export interface ApifyResponse<T = any> extends AxiosResponse<T> {
    config: ApifyRequestConfig;
}

export interface HttpClientOptions {
    apifyClientStats: Statistics;
    maxRetries: number;
    minDelayBetweenRetriesMillis: number;
    requestInterceptors: RequestInterceptorFunction[];
    timeoutSecs: number;
    logger: Log;
    token?: string;
    workflowKey?: string;
}
