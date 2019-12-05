import request from 'request-promise-native';
import _ from 'underscore';
import contentTypeParser from 'content-type';
import { retryWithExpBackoff, RetryableError } from 'apify-shared/exponential_backoff';
import { parseType, parsedTypeCheck } from 'type-check';
import { gzip } from 'zlib';
import os from 'os';
import { version } from '../package.json';
import ApifyClientError, {
    INVALID_PARAMETER_ERROR_TYPE,
    REQUEST_FAILED_ERROR_TYPE,
    REQUEST_FAILED_ERROR_MESSAGE,
    NOT_FOUND_STATUS_CODE,
} from './apify_error';

export const RATE_LIMIT_EXCEEDED_STATUS_CODE = 429;
const EXP_BACKOFF_MILLIS = 500;
export const EXP_BACKOFF_MAX_REPEATS = 8; // 128s
const CONTENT_TYPE_JSON = 'application/json';
const CONTENT_TYPE_XML = 'application/xml';
const CONTENT_TYPE_TEXT_PREFIX = 'text/';
const PARSE_DATE_FIELDS_MAX_DEPTH = 3; // obj.data.someArrayField.[x].field
const PARSE_DATE_FIELDS_KEY_SUFFIX = 'At';

export const CONTENT_TYPE_JSON_HEADER = `${CONTENT_TYPE_JSON}; charset=utf-8`;
export const CLIENT_USER_AGENT = `ApifyClient/${version} (${os.type()}; Node/${process.version})`;
export const REQUEST_PROMISE_OPTIONS = ['expBackOffMillis', 'expBackOffMaxRepeats', 'retryOnStatusCodes'];

/**
 * Parses a JSON string. If string is not JSON then catches an error and returns empty object.
 */
export const safeJsonParse = (str) => {
    let parsed;

    try {
        parsed = JSON.parse(str);
    } catch (err) {
        parsed = {};
    }

    return parsed;
};

/**
 * Creates an error from API response body and statusCode.
 * If body is object or JSON string in form
 *
 * { type: 'ITEM_NOT_FOUND', message: 'Requested item was not found.' }
 *
 * then uses its error type or message or both.
 */
export const newApifyClientErrorFromResponse = (body, details) => {
    let parsedBody = {};

    if (_.isObject(body)) parsedBody = body;
    else if (_.isString(body)) parsedBody = safeJsonParse(body);

    const error = parsedBody.error || parsedBody;
    const type = error.type || REQUEST_FAILED_ERROR_TYPE;
    const message = error.message || REQUEST_FAILED_ERROR_MESSAGE;

    return new ApifyClientError(type, message, details);
};

/**
 * Promised version of request(options) function.
 *
 * If response status code is >= 500 or RATE_LIMIT_EXCEEDED_STATUS_CODE then uses exponential backoff
 * algorithm to repeat the request.
 *
 * Possible options parameters are:
 * - everything supported by 'request' npm package (mainly 'method', 'url' and 'qs')
 * - resolveWithFullResponse - to resolve promise with whole response instead of just body
 * - expBackOffMillis - initial wait time before next repeat in a case of error
 * - expBackOffMaxRepeats - maximal number of repeats
 * - retryOnStatusCodes - an array of status codes on which requests are retried
 *
 * @param options
 * @param stats Optional object that receives the stats.
 * @return {Promise<*>}
 */
export const requestPromise = async (options, stats) => {
    const expBackoffMillis = options.expBackOffMillis || EXP_BACKOFF_MILLIS;
    const expBackoffMaxRepeats = options.expBackOffMaxRepeats || EXP_BACKOFF_MAX_REPEATS;
    const retryOnStatusCodes = options.retryOnStatusCodes || [RATE_LIMIT_EXCEEDED_STATUS_CODE];
    const method = _.isString(options.method) ? options.method.toLowerCase() : options.method;

    if (!method) throw new ApifyClientError(INVALID_PARAMETER_ERROR_TYPE, '"options.method" parameter must be provided');
    if (!request[method]) throw new ApifyClientError(INVALID_PARAMETER_ERROR_TYPE, '"options.method" is not a valid http request method');

    const requestParams = Object.assign({}, options, {
        resolveWithFullResponse: true,
        simple: false,

        // Add custom user-agent to all API calls
        headers: Object.assign({}, options.headers, { 'User-Agent': CLIENT_USER_AGENT }),

        // We are parsing and stringifycating JSON ourselves below to be able to retry on incomplete response.
        json: false,
    });

    if (options.json) {
        if (!requestParams.headers['Content-Type']) requestParams.headers['Content-Type'] = CONTENT_TYPE_JSON_HEADER;
        if (requestParams.body) requestParams.body = JSON.stringify(requestParams.body);
    }

    if (stats) stats.calls++;
    let iteration = 0;

    const makeRequest = async () => {
        iteration += 1;
        let statusCode;
        let response;
        let error;

        try {
            if (stats) stats.requests++;
            response = await request[method](requestParams); // eslint-disable-line
            statusCode = response ? response.statusCode : null;

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

        if (statusCode === RATE_LIMIT_EXCEEDED_STATUS_CODE && stats) {
            // Make sure this doesn't fail when someone increases number of retries on anything.
            if (typeof stats.rateLimitErrors[iteration - 1] === 'number') stats.rateLimitErrors[iteration - 1]++;
            else stats.rateLimitErrors[iteration - 1] = 1;
        }

        // For status codes 300-499 except options.retryOnStatusCodes we immediately rejects the promise
        // since it's probably caused by invalid url (redirect 3xx) or invalid user input (4xx).
        if (
            statusCode >= 300
            && statusCode < 500
            && !retryOnStatusCodes.includes(statusCode)
        ) {
            throw newApifyClientErrorFromResponse(response.body, { statusCode, url: options.url, method: options.method });
        }

        const errorDetails = Object.assign(_.pick(options, 'url', 'method', 'qs'), {
            hasBody: !!options.body,
            error: error && error.message ? error.message : error,
            statusCode,
            iteration,
        });

        // If one of these happened:
        // - error occurred
        // - status code is >= 500
        // - status code in one of retryOnStatusCodes (by default RATE_LIMIT_EXCEEDED_STATUS_CODE)
        // then we throw the retryable error that is repeated by the retryWithExpBackoff function up to `expBackOffMaxRepeats` repeats.
        const errorMsg = iteration === 0
            ? 'API request failed on the first retry'
            : `API request failed on retry number ${iteration}`;
        const originalError = new ApifyClientError(REQUEST_FAILED_ERROR_TYPE, errorMsg, errorDetails);
        throw new RetryableError(originalError);
    };

    return retryWithExpBackoff({ func: makeRequest, expBackoffMaxRepeats, expBackoffMillis });
};

/**
 * Checks that given parameter is of given type and throws ApifyClientError.
 * If errorMessage is not provided then error message is created from name and type of param.
 *
 * @param {String} value - user entered value of that parameter
 * @param {String} name - parameter name (actId for options.actId)
 * @param {String} type - "String", "Number", ... (see ee: https://github.com/gkz/type-check)
 * @param {String} errorMessage - optional error message
 */
export const checkParamOrThrow = (value, name, type, errorMessage) => {
    // TODO: move this into apify-shared along with an ApifyClientError,
    // actually it shouldn't be ApifyClientError but ApifyError in most cases!

    if (!errorMessage) errorMessage = `Parameter "${name}" of type ${type} must be provided`;

    const allowedTypes = parseType(type);

    // This is workaround since Buffer doesn't seem to be possible to define using options.customTypes.
    const allowsBuffer = allowedTypes.filter(item => item.type === 'Buffer').length;
    const allowsFunction = allowedTypes.filter(item => item.type === 'Function').length;

    if (allowsBuffer && Buffer.isBuffer(value)) return;
    if (allowsFunction && _.isFunction(value)) return;

    // This will ignore Buffer type.
    if (!parsedTypeCheck(allowedTypes, value)) {
        throw new ApifyClientError(INVALID_PARAMETER_ERROR_TYPE, errorMessage);
    }
};

/**
 * Returns object's data property or null if parameter is not an object.
 */
export const pluckData = obj => (_.isObject(obj) && !_.isUndefined(obj.data) ? obj.data : null);

/**
 * If given HTTP error has NOT_FOUND_STATUS_CODE status code then returns null.
 * Otherwise rethrows error.
 */
export const catchNotFoundOrThrow = (err) => {
    if (err.details && err.details.statusCode === NOT_FOUND_STATUS_CODE) return null;

    throw err;
};

/**
 * Promisified zlib.gzip().
 */
export const gzipPromise = (buffer) => {
    return new Promise((resolve, reject) => {
        gzip(buffer, (err, gzippedBuffer) => {
            if (err) return reject(err);

            resolve(gzippedBuffer);
        });
    });
};

/**
 * Function for parsing key-value store record's body.
 */
export const parseBody = (body, contentType) => {
    const type = contentTypeParser.parse(contentType).type;

    if (type.startsWith(CONTENT_TYPE_TEXT_PREFIX)) return body.toString();

    switch (type) {
        case CONTENT_TYPE_JSON: return JSON.parse(body);
        case CONTENT_TYPE_XML: return body.toString();
        default: return body;
    }
};

/**
 * Wrap results from response and parse attributes from apifier headers.
 */
export function wrapArray(response) {
    const limit = response.headers['x-apifier-pagination-limit'] || response.headers['x-apify-pagination-limit'];

    /**
     * @typedef {Object} PaginationList
     * @property {Array} items - List of returned objects
     * @property {Number} total - Total number of object
     * @property {Number} offset - Number of Request objects that was skipped at the start.
     * @property {Number} count - Number of returned objects
     * @property {Number} limit - Requested limit
     */
    return {
        items: response.body,
        total: parseInt(response.headers['x-apifier-pagination-total'] || response.headers['x-apify-pagination-total'], 10),
        offset: parseInt(response.headers['x-apifier-pagination-offset'] || response.headers['x-apify-pagination-offset'], 10),
        count: parseInt(response.headers['x-apifier-pagination-count'] || response.headers['x-apify-pagination-count'], 10),
        limit: limit ? parseInt(limit, 10) : null, // Limit can be null in a case of dataset items.
    };
}

/**
 * Helper function that traverses JSON structure and parses fields such as modifiedAt or createdAt to dates.
 */
export function parseDateFields(obj, depth = 0) {
    if (depth > PARSE_DATE_FIELDS_MAX_DEPTH) return obj;
    if (_.isArray(obj)) return obj.map(child => parseDateFields(child, depth + 1));
    if (!_.isObject(obj)) return obj;

    return _.mapObject(obj, (val, key) => {
        if (key.endsWith(PARSE_DATE_FIELDS_KEY_SUFFIX)) return val ? new Date(val) : val;
        if (_.isArray(val) || _.isObject(val)) return parseDateFields(val, depth + 1);
        return val;
    });
}

/**
 * Helper function that converts array of webhooks to base64 string
 */
export function stringifyWebhooksToBase64(webhooks) {
    const webhooksJson = JSON.stringify(webhooks);
    return Buffer.from(webhooksJson, 'utf8').toString('base64');
}
