const axios = require('axios').default;
const KeepAliveAgent = require('agentkeepalive');
const os = require('os');
const ApifyApiError = require('./apify_api_error');
const {
    requestInterceptors,
    responseInterceptors,
} = require('./interceptors');
const {
    retryWithExpBackoff,
    isNode,
} = require('./utils');
const { version } = require('../package.json');

const RATE_LIMIT_EXCEEDED_STATUS_CODE = 429;
const EXP_BACKOFF_MILLIS = 500;
const EXP_BACKOFF_MAX_REPEATS = 8; // 128s

class HttpClient {
    /**
     * @param {object} options
     * @param {object} options.apifyClientStats
     * @param {number} options.expBackoffMillis
     * @param {number} options.expBackoffMaxRepeats
     */
    constructor(options) {
        this.defaultOptions = {
            expBackoffMaxRepeats: options.expBackoffMaxRepeats,
            expBackoffMillis: options.expBackoffMillis,
        };
        this.stats = options.apifyClientStats;

        if (isNode()) {
            // Add keep-alive agents that are preset with reasonable defaults.
            // Axios will only use those in Node.js.
            this.httpAgent = new KeepAliveAgent();
            this.httpsAgent = new KeepAliveAgent.HttpsAgent();
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
        });

        // Clean all default headers because they only make a mess
        // and their merging is difficult to understand and buggy.
        this.axios.defaults.headers = {};

        if (isNode()) {
            // Works only in Node. Cannot be set in browser
            const userAgent = `ApifyClient/${version} (${os.type()}; Node/${process.version}); isAtHome/${!!process.env.IS_AT_HOME}`;
            this.axios.defaults.headers['User-Agent'] = userAgent;
        }

        requestInterceptors.forEach((i) => this.axios.interceptors.request.use(i));
        responseInterceptors.forEach((i) => this.axios.interceptors.response.use(i));
    }

    async call(callOptions) {
        const mergedOptions = { ...this.defaultOptions, ...callOptions };
        return this._call(mergedOptions);
    }

    async _call(options) {
        const {
            expBackoffMillis = EXP_BACKOFF_MILLIS,
            expBackoffMaxRepeats = EXP_BACKOFF_MAX_REPEATS,
            retryOnStatusCodes = [RATE_LIMIT_EXCEEDED_STATUS_CODE],
        } = options;

        this.stats.calls++;
        let attempt = 0;

        const makeRequest = async (bail) => {
            attempt += 1;

            this.stats.requests++;
            const response = await this.axios.request(options);
            const statusCode = response.status;

            if (statusCode < 300) return response;

            if (statusCode === RATE_LIMIT_EXCEEDED_STATUS_CODE) {
                this.stats.addRateLimitError(attempt);
            }

            // For status codes 300-499 except options.retryOnStatusCodes we immediately rejects the promise
            // since it's probably caused by invalid url (redirect 3xx) or invalid user input (4xx).
            if (
                statusCode >= 300
                && statusCode < 500
                && !retryOnStatusCodes.includes(statusCode)
            ) {
                bail(new ApifyApiError(response, attempt));
                return;
            }

            // If one of these happened:
            // - error occurred
            // - status code is >= 500
            // - status code in one of retryOnStatusCodes (by default RATE_LIMIT_EXCEEDED_STATUS_CODE)
            // then we throw the retryable error that is repeated by the retryWithExpBackoff function up to `expBackoffMaxRepeats` repeats.
            throw new ApifyApiError(response, attempt);
        };
        return retryWithExpBackoff(makeRequest, { retries: expBackoffMaxRepeats, minTimeout: expBackoffMillis });
    }
}

module.exports = {
    RATE_LIMIT_EXCEEDED_STATUS_CODE,
    EXP_BACKOFF_MAX_REPEATS,
    EXP_BACKOFF_MILLIS,
    HttpClient,
};
