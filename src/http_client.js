const retry = require('async-retry');
const axios = require('axios').default;
const KeepAliveAgent = require('agentkeepalive');
const os = require('os');
const ApifyApiError = require('./apify_api_error');
const {
    InvalidResponseBodyError,
    requestInterceptors,
    responseInterceptors,
} = require('./interceptors');
const {
    isNode,
    dynamicRequire,
} = require('./utils');

const { version } = dynamicRequire('../package.json');

const RATE_LIMIT_EXCEEDED_STATUS_CODE = 429;

class HttpClient {
    /**
     * @param {object} options
     * @param {object} options.apifyClientStats
     * @param {number} options.maxRetries
     * @param {number} options.minDelayBetweenRetriesMillis
     * @param {function[]} options.requestInterceptors
     * @param {number} options.timeoutSecs
     * @param {object} options.logger
     * @param {string} [options.token]
     */
    constructor(options) {
        const { token } = options;
        this.stats = options.apifyClientStats;
        this.maxRetries = options.maxRetries;
        this.minDelayBetwenRetriesMillis = options.minDelayBetweenRetriesMillis;
        this.userProvidedRequestInterceptors = options.requestInterceptors;
        this.timeoutMillis = options.timeoutSecs * 1000;
        this.logger = options.logger;
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
            headers: {
                Accept: 'application/json, */*',
            },
            httpAgent: this.httpAgent,
            httpsAgent: this.httpsAgent,
            paramsSerializer: (params) => {
                const formattedParams = Object.entries(params)
                    .filter(([, value]) => value !== undefined)
                    .map(([key, value]) => {
                        const updatedValue = typeof value === 'boolean' ? Number(value) : value;
                        return [key, updatedValue];
                    });

                return new URLSearchParams(formattedParams);
            },
            validateStatus: null,
            // Using interceptors for this functionality.
            transformRequest: null,
            transformResponse: null,
            responseType: 'arraybuffer',
            timeout: this.timeoutMillis,
            // maxBodyLength needs to be Infinity, because -1 falls back to a 10 MB default
            // from an axios subdependency - 'follow-redirects'
            maxBodyLength: Infinity,
            // maxContentLength must be -1, because Infinity will cause axios to run super slow
            // thanks to a bug that's now fixed, but not released yet https://github.com/axios/axios/pull/3738
            maxContentLength: -1,
        });

        // Clean all default headers because they only make a mess
        // and their merging is difficult to understand and buggy.
        this.axios.defaults.headers = {};

        if (isNode()) {
            // Works only in Node. Cannot be set in browser
            const userAgent = `ApifyClient/${version} (${os.type()}; Node/${process.version}); isAtHome/${!!process.env.IS_AT_HOME}`;
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

    /**
     * @param {object} config
     * @return {Promise<*>}
     */
    async call(config) {
        this.stats.calls++;
        const makeRequest = this._createRequestHandler(config);

        return retry(makeRequest, {
            retries: this.maxRetries,
            minTimeout: this.minDelayBetwenRetriesMillis,
            onRetry: this._onRequestRetry,
        });
    }

    /**
     * Successful responses are returned, errors and unsuccessful
     * status codes are retried. See the following functions for the
     * retrying logic.
     * @param {object} config
     * @return {function}
     * @private
     */
    _createRequestHandler(config) {
        /**
         * @param {function} stopTrying
         * @param {number} attempt
         * @return {?Promise<AxiosResponse<any>>}
         * @private
         */
        const makeRequest = async (stopTrying, attempt) => {
            this.stats.requests++;
            let response;
            try {
                response = await this.axios.request(config);
                if (this._isStatusOk(response.status)) return response;
            } catch (err) {
                return this._handleRequestError(err, config, stopTrying);
            }

            if (response.status === RATE_LIMIT_EXCEEDED_STATUS_CODE) {
                this.stats.addRateLimitError(attempt);
            }

            const apiError = new ApifyApiError(response, attempt);
            if (this._isStatusCodeRetryable(response.status)) {
                throw apiError;
            } else {
                return stopTrying(apiError);
            }
        };
        return makeRequest;
    }

    /**
     * @param {number} statusCode
     * @return {boolean}
     * @private
     */
    _isStatusOk(statusCode) {
        return statusCode < 300;
    }

    /**
     * Handles all unexpected errors that can happen, but are not
     * Apify API typed errors. E.g. network errors, timeouts and so on.
     * @param {Error} err
     * @param {object} config
     * @param {function} stopTrying
     * @private
     */
    _handleRequestError(err, config, stopTrying) {
        if (this._isTimeoutError(err) && config.doNotRetryTimeouts) {
            return stopTrying(err);
        }

        if (this._isRetryableError(err)) {
            throw err;
        } else {
            return stopTrying(err);
        }
    }

    /**
     * Axios calls req.abort() on timeouts so timeout errors will
     * have a code ECONNABORTED.
     * @param {Error} err
     * @private
     */
    _isTimeoutError(err) {
        return err.code === 'ECONNABORTED';
    }

    /**
     * We don't want to retry every exception thrown from Axios.
     * The common denominator for retryable errors are network issues.
     * @param {Error} err
     * @private
     */
    _isRetryableError(err) {
        return this._isNetworkError(err) || this._isResponseBodyInvalid(err);
    }

    /**
     * When a network connection to our API is interrupted in the middle of streaming
     * a response, the request often does not fail, but simply contains
     * an incomplete response. This can often be fixed by retrying.
     * @param {Error} err
     * @return {boolean}
     * @private
     */
    _isResponseBodyInvalid(err) {
        return err instanceof InvalidResponseBodyError;
    }

    /**
     * When a network request is attempted by axios and fails,
     * it throws an AxiosError, which will have the request
     * and config (and other) properties.
     * @param {Error} err
     * @return {boolean}
     * @private
     */
    _isNetworkError(err) {
        const hasRequest = err.request && typeof err.request === 'object';
        const hasConfig = err.config && typeof err.config === 'object';
        return hasRequest && hasConfig;
    }

    /**
     * We retry 429 (rate limit) and 500+.
     * For status codes 300-499 (except 429) we do not retry the request,
     * because it's probably caused by invalid url (redirect 3xx) or invalid user input (4xx).
     * @param {number} statusCode
     * @return {boolean}
     * @private
     */
    _isStatusCodeRetryable(statusCode) {
        const isRateLimitError = statusCode === RATE_LIMIT_EXCEEDED_STATUS_CODE;
        const isInternalError = statusCode >= 500;
        return isRateLimitError || isInternalError;
    }

    /**
     * @param {ApifyApiError} error
     * @param {number} attempt
     * @private
     */
    _onRequestRetry(error, attempt) {
        if (attempt === Math.round(this.maxRetries / 2)) {
            this.logger.warning(`API request failed ${attempt} times. Max attempts: ${this.maxRetries + 1}.\nCause:${error.stack}`);
        }
    }
}

module.exports = HttpClient;
