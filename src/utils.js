import isObject from 'lodash/isObject';
import isString from 'lodash/isString';
import isFunction from 'lodash/isFunction';
import isUndefined from 'lodash/isUndefined';
import isArray from 'lodash/isArray';
import mapValues from 'lodash/mapValues';
import isEmpty from 'lodash/isEmpty';
import contentTypeParser from 'content-type';
import { parseType, parsedTypeCheck } from 'type-check';
import { gzip } from 'zlib';
import log from 'apify-shared/log';
import retry from 'async-retry';
import ApifyClientError, {
    INVALID_PARAMETER_ERROR_TYPE,
    REQUEST_FAILED_ERROR_TYPE,
    REQUEST_FAILED_ERROR_MESSAGE,
    NOT_FOUND_STATUS_CODE,
} from './apify_error';

export const CONTENT_TYPE_JSON = 'application/json';
const CONTENT_TYPE_XML = 'application/xml';
const CONTENT_TYPE_TEXT_PREFIX = 'text/';
const PARSE_DATE_FIELDS_MAX_DEPTH = 3; // obj.data.someArrayField.[x].field
const PARSE_DATE_FIELDS_KEY_SUFFIX = 'At';

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

    if (isObject(body)) parsedBody = body;
    else if (isString(body)) parsedBody = safeJsonParse(body);

    const error = parsedBody.error || parsedBody;
    const type = error.type || REQUEST_FAILED_ERROR_TYPE;
    const message = error.message || REQUEST_FAILED_ERROR_MESSAGE;

    return new ApifyClientError(type, message, details);
};

/**
 * Checks that given parameter is of given type and throws ApifyClientError.
 * If errorMessage is not provided then error message is created from name and type of param.
 *
 * @param {String} value - user entered value of that parameter
 * @param {String} name - parameter name (actId for options.actId)
 * @param {String} type - "String", "Number", ... (see ee: https://github.com/gkz/type-check)
 * @param {String} [errorMessage] - optional error message
 * @param {Boolean} [isApiV1] - flag for legacy Crawler
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
    if (allowsFunction && isFunction(value)) return;

    // This will ignore Buffer type.
    if (!parsedTypeCheck(allowedTypes, value)) {
        throw new ApifyClientError(INVALID_PARAMETER_ERROR_TYPE, errorMessage);
    }
};

/**
 * Returns object's data property or null if parameter is not an object.
 */
export const pluckData = obj => (isObject(obj) && !isUndefined(obj.data) ? obj.data : null);

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
    const { type } = contentTypeParser.parse(contentType);

    if (type.startsWith(CONTENT_TYPE_TEXT_PREFIX)) return isomorphicBufferToString(body);

    switch (type) {
        case CONTENT_TYPE_JSON: return JSON.parse(isomorphicBufferToString(body));
        case CONTENT_TYPE_XML: return isomorphicBufferToString(body);
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
    if (isArray(obj)) return obj.map(child => parseDateFields(child, depth + 1));
    if (!isObject(obj)) return obj;

    return mapValues(obj, (val, key) => {
        if (key.endsWith(PARSE_DATE_FIELDS_KEY_SUFFIX)) return val ? new Date(val) : val;
        if (isArray(val) || isObject(val)) return parseDateFields(val, depth + 1);
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

/**
 * Replaces slash with tilde to url save string.
 * @param stringWithSlash {String}
 * @return {String}
 */
export function replaceSlashWithTilde(stringWithSlash) {
    return stringWithSlash.replace('/', '~');
}

/**
 *
 * @param func
 * @param opts
 * @return {Promise | Promise<any>}
 */
export const retryWithExpBackoff = (func, opts) => {
    let retryCount = 0;
    const onRetry = (error) => {
        retryCount += 1;
        if (retryCount === Math.round(opts.retries / 2)) {
            log.warning(`Retry failed ${retryCount} times and will be repeated later`, {
                originalError: error.error ? error.error.message : error,
                errorDetails: error.error ? error.error.details : error,
            });
        }
    };
    const options = Object.assign({}, { onRetry }, opts);

    return retry(func, options);
};

export const isomorphicBufferToString = (buffer) => {
    if (buffer.constructor.name !== ArrayBuffer.name) {
        return buffer.toString();
    }

    // expect UTF-8
    const utf8decoder = new TextDecoder();
    return utf8decoder.decode(new Uint8Array(buffer));
};
export const isNode = () => !!(typeof process !== 'undefined' && process.versions && process.versions.node);

export const gzipRequest = async (options) => {
    if (!isNode()) return options;

    if (isEmpty(options.data)) return options;

    options.headers['content-encoding'] = 'gzip';
    const data = (typeof options.data === 'string') || Buffer.isBuffer(options.data) ? options.data : JSON.stringify(options.data);
    options.data = await gzipPromise(data);


    return options;
};
