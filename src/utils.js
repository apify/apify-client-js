import request from 'request';
import _ from 'underscore';
import contentTypeParser from 'content-type';
import log from 'apify-shared/log';
import { parseType, parsedTypeCheck } from 'type-check';
import { gzip } from 'zlib';
import os from 'os';
import { version } from '../package.json';
import ApifyClientError, {
    INVALID_PARAMETER_ERROR_TYPE_V1,
    INVALID_PARAMETER_ERROR_TYPE_V2,
    REQUEST_FAILED_ERROR_TYPE_V1,
    REQUEST_FAILED_ERROR_TYPE_V2,
    REQUEST_FAILED_ERROR_MESSAGE,
    NOT_FOUND_STATUS_CODE,
} from './apify_error';

const RATE_LIMIT_EXCEEDED_STATUS_CODE = 429;
const EXP_BACKOFF_MILLIS = 500;
const EXP_BACKOFF_MAX_REPEATS = 8; // 128s
const CONTENT_TYPE_JSON = 'application/json';
const CONTENT_TYPE_XML = 'application/xml';
const CONTENT_TYPE_TEXT_PLAIN = 'text/plain';
const CONTENT_TYPE_TEXT_HTML = 'text/html';
const CLIENT_USER_AGENT = `ApifyClient/${version} (${os.type()}; Node/${process.version})`;
const PARSE_DATE_FIELDS_MAX_DEPTH = 3; // obj.data.someArrayField.[x].field
const PARSE_DATE_FIELDS_KEY_SUFFIX = 'At';

export const REQUEST_PROMISE_OPTIONS = ['promise', 'expBackOffMillis', 'expBackOffMaxRepeats'];

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
 * then uses it's error type or message or both.
 */
export const newApifyClientErrorFromResponse = (statusCode, body, isApiV1) => {
    const REQUEST_FAILED_ERROR_TYPE = isApiV1 ? REQUEST_FAILED_ERROR_TYPE_V1 : REQUEST_FAILED_ERROR_TYPE_V2;
    let parsedBody = {};

    if (_.isObject(body)) parsedBody = body;
    else if (_.isString(body)) parsedBody = safeJsonParse(body);

    const error = parsedBody.error || parsedBody;
    const type = error.type || REQUEST_FAILED_ERROR_TYPE;
    const message = error.message || REQUEST_FAILED_ERROR_MESSAGE;

    return new ApifyClientError(type, message, { statusCode });
};

/**
 * Promised version of request(options) function.
 *
 * If response status code is >= 500 or RATE_LIMIT_EXCEEDED_STATUS_CODE then uses exponential backoff
 * alghorithm to repeat the request.
 *
 * Possible options parameters are:
 * - everything supported by 'request' npm package (mainly 'method', 'url' and 'qs')
 * - resolveWithResponse - to resolve promise with whole response instead of just body
 * - expBackOffMillis - initial wait time before next repeat in a case of error
 * - expBackOffMaxRepeats - maximal number of repeats
 */
export const requestPromise = (options, iteration = 0) => {
    const isApiV1 = options.isApiV1;

    const INVALID_PARAMETER_ERROR_TYPE = isApiV1 ? INVALID_PARAMETER_ERROR_TYPE_V1 : INVALID_PARAMETER_ERROR_TYPE_V2;
    const REQUEST_FAILED_ERROR_TYPE = isApiV1 ? REQUEST_FAILED_ERROR_TYPE_V1 : REQUEST_FAILED_ERROR_TYPE_V2;

    const PromisesDependency = options.promise;
    const expBackOffMillis = options.expBackOffMillis || EXP_BACKOFF_MILLIS;
    const expBackOffMaxRepeats = options.expBackOffMaxRepeats || EXP_BACKOFF_MAX_REPEATS;
    const method = _.isString(options.method) ? options.method.toLowerCase() : options.method;
    const resolveWithResponse = options.resolveWithResponse;

    // Add custom user-agent to all API calls
    options.headers = Object.assign({}, options.headers, { 'User-Agent': CLIENT_USER_AGENT });

    if (typeof PromisesDependency !== 'function') {
        throw new ApifyClientError(INVALID_PARAMETER_ERROR_TYPE, '"options.promise" parameter must be provided');
    }

    if (!method) {
        throw new ApifyClientError(INVALID_PARAMETER_ERROR_TYPE, '"options.method" parameter must be provided');
    }

    if (!request[method]) {
        throw new ApifyClientError(INVALID_PARAMETER_ERROR_TYPE, '"options.method" is not a valid http request method');
    }

    return new PromisesDependency((resolve, reject) => {
        // We have to use request[method]({ ... }) instead of request({ method, ... })
        // to be able to mock request when unit testing requestPromise().
        request[method](options, (error, response, body) => {
            const statusCode = response ? response.statusCode : null;

            // If status code is >= 500 or RATE_LIMIT_EXCEEDED_STATUS_CODE then we repeat the request.
            // We use exponential backoff alghorithm with up to `expBackOffMillis` repeats.
            if (error || statusCode >= 500 || statusCode === RATE_LIMIT_EXCEEDED_STATUS_CODE) {
                if (iteration >= expBackOffMaxRepeats) {
                    const errMessage = `Server request failed with ${iteration + 1} tries.`;
                    const errDetails = Object.assign(_.pick(options, 'url', 'method', 'qs'), {
                        hasBody: !!options.body,
                        statusCode,
                        iteration,
                        error,
                    });

                    return reject(new ApifyClientError(REQUEST_FAILED_ERROR_TYPE, errMessage, errDetails));
                }

                const waitMillis = _.random(expBackOffMillis, expBackOffMillis * 2);
                const repeatCall = () => {
                    const nextCallOptions = Object.assign({}, options, { expBackOffMillis: expBackOffMillis * 2 });

                    requestPromise(nextCallOptions, iteration + 1).then(resolve, reject);
                };

                if (iteration === Math.round(expBackOffMaxRepeats / 2)) {
                    log.warning(`Request failed ${iteration} times and will be repeated in ${waitMillis}ms`, {
                        hasBody: !!options.body,
                        statusCode,
                        iteration,
                        error,
                    });
                }

                return setTimeout(repeatCall, waitMillis);
            }

            // For status codes 300-499 except RATE_LIMIT_EXCEEDED_STATUS_CODE we immediately rejects the promise
            // since it's probably caused by invalid url (redirect 3xx) or invalid user input (4xx).
            if (statusCode >= 300) return reject(newApifyClientErrorFromResponse(statusCode, body, isApiV1));

            if (resolveWithResponse) resolve(response);
            else resolve(body);
        });
    });
};

/**
 * Checks that given parameter is of given type and throws ApifyClientError.
 * If errorMessage is not provided then error message is created from name and type of param.
 *
 * TODO: move this into apify-shared along with an ApifyClientError
 *
 * @param {String} value - user entered value of that parameter
 * @param {String} name - parameter name (crawlerId for options.crawlerId)
 * @param {String} type - "String", "Number", ... (see ee: https://github.com/gkz/type-check)
 * @param {String} errorMessage - optional error message
 */
export const checkParamOrThrow = (value, name, type, errorMessage, isApiV1) => {
    const INVALID_PARAMETER_ERROR_TYPE = isApiV1 ? INVALID_PARAMETER_ERROR_TYPE_V1 : INVALID_PARAMETER_ERROR_TYPE_V2;

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
export const gzipPromise = (Promise, buffer) => {
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

    switch (type) {
        case CONTENT_TYPE_JSON: return JSON.parse(body);
        case CONTENT_TYPE_XML:
        case CONTENT_TYPE_TEXT_HTML:
        case CONTENT_TYPE_TEXT_PLAIN: return body.toString();
        default: return body;
    }
};

/**
 * Wrap results from response and parse attributes from apifier headers.
 */
export function wrapArray(response) {
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
        limit: parseInt(response.headers['x-apifier-pagination-limit'] || response.headers['x-apify-pagination-limit'], 10),
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
