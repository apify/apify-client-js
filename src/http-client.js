const axios = require('axios').default;
const KeepAliveAgent = require('agentkeepalive');
const os = require('os');
const {
    ApifyApiError,
} = require('./apify_error');
const {
    retryWithExpBackoff,
    gzipRequest,
    isNode,
} = require('./utils');
const { version } = require('../package.json');

const RATE_LIMIT_EXCEEDED_STATUS_CODE = 429;
const EXP_BACKOFF_MILLIS = 500;
const EXP_BACKOFF_MAX_REPEATS = 8; // 128s

const ALLOWED_HTTP_METHODS = new RegExp(['GET', 'DELETE', 'HEAD', 'POST', 'PUT', 'PATCH'].join('|'), 'i');

class HttpClient {
    /**
     * @param {object} options
     * @param {object} options.maxRetries
     * @param {object} options.apifyClientStats
     */
    constructor(options) {
        this.defaultOptions = {
            expBackoffMaxRepeats: options.expBackoffMaxRepeats,
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
                common: {
                    Accept: 'application/json, */*',
                },
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
        });

        if (isNode()) {
            // Works only in Node. Cannot be set in browser
            const userAgent = `ApifyClient/${version} (${os.type()}; Node/${process.version}); isAtHome/${!!process.env.IS_AT_HOME}`;
            this.axios.defaults.headers.common['User-Agent'] = userAgent;
        }

        ['post', 'put', 'patch'].forEach((method) => {
            this.axios.defaults.headers[method] = {
                'Content-Type': 'application/json; charset=utf-8',
            };
        });

        this.axios.interceptors.request.use(gzipRequest);
    }

    async call(callOptions) {
        const mergedOptions = { ...this.defaultOptions, ...callOptions };
        return this._call(mergedOptions);
    }

    _getDefaultHeaders() {
        if (!isNode()) {
            return {
                'content-type': 'application/json; charset=utf-8',
            };
        }
        return { 'user-agent': apifyClientUserAgent,
            'accept-encoding': 'gzip',
            'content-type': 'application/json; charset=utf-8' };
    }

    _getAxiosConfig(endpointConfig) {
        // if (endpointConfig.headers && endpointConfig.headers['content-type'] === null) {
        //     delete endpointConfig.headers['content-type'];
        //     delete this.axios.defaults.headers.post['Content-Type'];
        //     delete this.axios.defaults.headers.put['Content-Type'];
        //     delete this.axios.defaults.headers.patch['Content-Type'];
        // }
        return endpointConfig;
    }

    async _call(options) {
        const {
            expBackoffMillis = EXP_BACKOFF_MILLIS,
            expBackoffMaxRepeats = EXP_BACKOFF_MAX_REPEATS,
            retryOnStatusCodes = [RATE_LIMIT_EXCEEDED_STATUS_CODE],
        } = options;

        this.stats.calls++;
        let iteration = 0;

        // const axiosConfig = this._getAxiosConfig(options);

        const makeRequest = async (bail) => {
            iteration += 1;

            this.stats.requests++;
            const response = await this.axios.request(options); // eslint-disable-line
            const statusCode = response.status;

            if (statusCode < 300) return response;

            if (statusCode === RATE_LIMIT_EXCEEDED_STATUS_CODE && this.stats) {
                // Make sure this doesn't fail when someone increases number of retries on anything.
                if (typeof this.stats.rateLimitErrors[iteration - 1] === 'number') this.stats.rateLimitErrors[iteration - 1]++;
                else this.stats.rateLimitErrors[iteration - 1] = 1;
            }

            // For status codes 300-499 except options.retryOnStatusCodes we immediately rejects the promise
            // since it's probably caused by invalid url (redirect 3xx) or invalid user input (4xx).
            if (
                statusCode >= 300
                && statusCode < 500
                && !retryOnStatusCodes.includes(statusCode)
            ) {
                bail(new ApifyApiError(response));
                return;
            }

            // If one of these happened:
            // - error occurred
            // - status code is >= 500
            // - status code in one of retryOnStatusCodes (by default RATE_LIMIT_EXCEEDED_STATUS_CODE)
            // then we throw the retryable error that is repeated by the retryWithExpBackoff function up to `expBackoffMaxRepeats` repeats.
            throw new ApifyApiError(response, iteration);
        };
        return retryWithExpBackoff(makeRequest, { retries: expBackoffMaxRepeats, minTimeout: expBackoffMillis });
    }
}

module.exports = {
    RATE_LIMIT_EXCEEDED_STATUS_CODE,
    EXP_BACKOFF_MAX_REPEATS,
    EXP_BACKOFF_MILLIS,
    ALLOWED_HTTP_METHODS,
    HttpClient,
};
