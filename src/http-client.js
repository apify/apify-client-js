const axios = require('axios');
const KeepAliveAgent = require('agentkeepalive');
const os = require('os');
const ow = require('ow');
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

const apifyClientUserAgent = isNode()
    ? `ApifyClient/${version} (${os.type()}; Node/${process.version}); isAtHome/${process.env.IS_AT_HOME}`
    : `ApifyClient/${version} ${window.navigator.userAgent}`;

class HttpClient {
    constructor(apifyClientOptions, apifyClientStats) {
        ow(apifyClientOptions, ow.object);
        ow(apifyClientStats, ow.object);

        this.defaultOptions = apifyClientOptions;
        this.stats = apifyClientStats;

        if (isNode()) {
            // Add keep-alive agents that are preset with reasonable defaults.
            // Axios will only use those in Node.js.
            this.httpAgent = new KeepAliveAgent();
            this.httpsAgent = new KeepAliveAgent.HttpsAgent();
        }
        this.axios = axios.create();

        this.axios.interceptors.request.use(gzipRequest, (e) => {
            return Promise.reject(e);
        });
    }

    async call(callOptions) {
        const mergedOptions = { ...this.defaultOptions, ...callOptions };
        const normalizedOptions = this._validateAndNormalizeOptions(mergedOptions);
        return this._call(normalizedOptions);
    }

    _validateAndNormalizeOptions(options) {
        ow(options, ow.object.partialShape({
            baseUrl: ow.string,
            method: ow.string.matches(ALLOWED_HTTP_METHODS),
            token: ow.optional.string,
            expBackoffMillis: ow.optional.number,
            expBackoffMaxRepeats: ow.optional.number,
            retryOnStatusCodes: ow.optional.array.ofType(ow.number),
        }));
        /* eslint-disable prefer-const */
        let {
            baseUrl,
            method,
            expBackoffMillis = EXP_BACKOFF_MILLIS,
            expBackoffMaxRepeats = EXP_BACKOFF_MAX_REPEATS,
            retryOnStatusCodes = [RATE_LIMIT_EXCEEDED_STATUS_CODE],
        } = options;

        // Remove trailing forward slash from baseUrl.
        if (baseUrl.substr(-1) === '/') baseUrl = baseUrl.slice(0, -1);

        return {
            ...options,
            baseUrl,
            method,
            expBackoffMillis,
            expBackoffMaxRepeats,
            retryOnStatusCodes,
        };
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

    _getAxiosConfig(options) {
        const config = {
            baseURL: `${options.baseUrl}${options.basePath}`,
            url: options.url,
            method: options.method,
            headers: {
                ...this._getDefaultHeaders(),
                ...options.headers,
            },
            params: {
                ...options.qs,
                token: options.token,
            },
            data: options.body,
            // Override the default transform function to get unparsed response.
            transformResponse: res => res,
            httpAgent: this.httpAgent,
            httpsAgent: this.httpsAgent,
            validateStatus: null,
            responseType: options.encoding === null ? 'arraybuffer' : null,
        };

        if (options.headers && options.headers['content-type'] === null) {
            delete config.headers['content-type'];
            delete this.axios.defaults.headers.post['Content-Type'];
            delete this.axios.defaults.headers.put['Content-Type'];
            delete this.axios.defaults.headers.patch['Content-Type'];
        }
        return config;
    }

    async _call(options) {
        const {
            expBackoffMillis,
            expBackoffMaxRepeats,
            retryOnStatusCodes,
        } = options;

        this.stats.calls++;
        let iteration = 0;

        const axiosConfig = this._getAxiosConfig(options);

        const makeRequest = async (bail) => {
            iteration += 1;

            this.stats.requests++;
            const response = await this.axios.request(axiosConfig); // eslint-disable-line
            const statusCode = response.status;

            // TODO Retest this with Axios
            // It may happen that response is incomplete but request package silently returns original
            // response as string instead of throwing an error. So we call JSON.parse() manually here.
            // If parsing throws then the request gets retried with exponential backoff.
            if (options.json && response.data) response.data = JSON.parse(response.data);

            if (!statusCode || statusCode < 300) {
                return options.resolveWithFullResponse ? response : response.data;
            }

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
