import axios from 'axios';
import KeepAliveAgent from 'agentkeepalive';
import os from 'os';
import ApifyClientError, {
    INVALID_PARAMETER_ERROR_TYPE,
    REQUEST_FAILED_ERROR_TYPE,
} from './apify_error';
import { checkParamOrThrow, CONTENT_TYPE_JSON, newApifyClientErrorFromResponse, retryWithExpBackoff } from './utils';
import { version } from '../package.json';

export const RATE_LIMIT_EXCEEDED_STATUS_CODE = 429;
export const EXP_BACKOFF_MILLIS = 500;
export const EXP_BACKOFF_MAX_REPEATS = 8; // 128s

export const ALLOWED_HTTP_METHODS = ['GET', 'DELETE', 'HEAD', 'POST', 'PUT', 'PATCH'];
export const CONTENT_TYPE_HEADER_NAME = 'Content-Type';
export const CONTENT_TYPE_JSON_HEADER = `${CONTENT_TYPE_JSON}; charset=utf-8`;
export const CLIENT_USER_AGENT = `ApifyClient/${version} (${os.type()}; Node/${process.version})`;

export class HttpClient {
    constructor(apifyClientOptions, apifyClientStats) {
        checkParamOrThrow(apifyClientOptions, 'apifyClientOptions', 'Object');
        checkParamOrThrow(apifyClientStats, 'apifyClientStats', 'Object');
        this.defaultOptions = apifyClientOptions;
        this.stats = apifyClientStats;

        // Add keep-alive agents that are preset with reasonable defaults.
        // Axios will only use those in Node.js.
        this.httpAgent = new KeepAliveAgent();
        this.httpsAgent = new KeepAliveAgent.HttpsAgent();
    }

    async call(callOptions) {
        const mergedOptions = { ...this.defaultOptions, ...callOptions };
        const normalizedOptions = this._validateAndNormalizeOptions(mergedOptions);
        return this._call(normalizedOptions);
    }

    _validateAndNormalizeOptions(options) {
        /* eslint-disable prefer-const */
        let {
            baseUrl,
            method,
            token,
            expBackoffMillis = EXP_BACKOFF_MILLIS,
            expBackoffMaxRepeats = EXP_BACKOFF_MAX_REPEATS,
            retryOnStatusCodes = [RATE_LIMIT_EXCEEDED_STATUS_CODE],
        } = options;


        if (typeof baseUrl !== 'string') {
            throw new ApifyClientError(INVALID_PARAMETER_ERROR_TYPE, 'The "options.baseUrl" parameter of type string is required.');
        }
        // Remove trailing forward slash from baseUrl.
        if (baseUrl.substr(-1) === '/') baseUrl = baseUrl.slice(0, -1);

        if (typeof method !== 'string') {
            throw new ApifyClientError(INVALID_PARAMETER_ERROR_TYPE, 'The "options.method" parameter of type string is required.');
        }
        method = method.toUpperCase();
        if (!ALLOWED_HTTP_METHODS.includes(method)) {
            throw new ApifyClientError(
                INVALID_PARAMETER_ERROR_TYPE,
                'The "options.method" parameter is invalid. '
                + `Expected one of ${ALLOWED_HTTP_METHODS.join(', ')} but got: ${options.method}`,
            );
        }

        if (token && typeof token !== 'string') {
            throw new ApifyClientError(INVALID_PARAMETER_ERROR_TYPE, 'The "options.token" parameter must be a string.');
        }

        return {
            ...options,
            baseUrl,
            method,
            expBackoffMillis,
            expBackoffMaxRepeats,
            retryOnStatusCodes,
        };
    }

    _getAxiosConfig(options) {
        return {
            baseURL: `${options.baseUrl}${options.basePath}`,
            url: options.url,
            method: options.method,
            headers: {
                'user-agent': CLIENT_USER_AGENT,
                'accept-encoding': 'gzip',
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
    }

    _getResponseLike(axiosResponse) {
        let response;

        if (axiosResponse.request.res) {
            // It is in node
            // return standard Node.Js response-like object;
            response = axiosResponse.request.res;
            response.body = axiosResponse.data;
        } else {
            const { data, status, statusText, headers, config } = axiosResponse;
            response = {
                body: data,
                statusCode: status,
                statusText,
                headers,
                config,
            };
        }
        return response;
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
            let statusCode;
            let response;
            let error;

            try {
                this.stats.requests++;
                const axiosResponse = await axios.request(axiosConfig); // eslint-disable-line
                // TODO Emulate Request API for now
                response = this._getResponseLike(axiosResponse);
                statusCode = response ? response.statusCode : null;

                // TODO Retest this with Axios
                // It may happen that response is incomplete but request package silently returns original
                // response as string instead of throwing an error. So we call JSON.parse() manually here.
                // If parsing throws then the request gets retried with exponential backoff.
                if (options.json && response.body) response.body = JSON.parse(response.body);

                if (!statusCode || statusCode < 300) {
                    return options.resolveWithFullResponse ? response : response.body;
                }
            } catch (err) {
                error = err;
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
                bail(newApifyClientErrorFromResponse(response.body, { statusCode, url: options.url, method: options.method }));
                return;
            }

            const errorDetails = {
                url: options.url,
                method: options.method,
                params: options.params,
                hasBody: !!options.body,
                error: error && error.message ? error.message : error,
                statusCode,
                iteration,
            };

            // If one of these happened:
            // - error occurred
            // - status code is >= 500
            // - status code in one of retryOnStatusCodes (by default RATE_LIMIT_EXCEEDED_STATUS_CODE)
            // then we throw the retryable error that is repeated by the retryWithExpBackoff function up to `expBackoffMaxRepeats` repeats.
            const errorMsg = iteration === 1
                ? 'API request failed on the first try'
                : `API request failed on retry number ${iteration - 1}`;
            throw new ApifyClientError(REQUEST_FAILED_ERROR_TYPE, errorMsg, errorDetails, error);
        };
        return retryWithExpBackoff(makeRequest, { retries: expBackoffMaxRepeats, minTimeout: expBackoffMillis });
    }
}
