import _ from 'lodash';
import contentTypeParser from 'content-type';
import { parseType, parsedTypeCheck } from 'type-check';
import { gzip } from 'zlib';
import log from 'apify-shared/log';
import retry from 'async-retry';
import ApifyClientError, {
    INVALID_PARAMETER_ERROR_TYPE_V1,
    INVALID_PARAMETER_ERROR_TYPE_V2,
    REQUEST_FAILED_ERROR_TYPE_V1,
    REQUEST_FAILED_ERROR_TYPE_V2,
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
export const newApifyClientErrorFromResponse = (body, isApiV1, details) => {
    const REQUEST_FAILED_ERROR_TYPE = isApiV1 ? REQUEST_FAILED_ERROR_TYPE_V1 : REQUEST_FAILED_ERROR_TYPE_V2;
    let parsedBody = {};

    if (_.isObject(body)) parsedBody = body;
    else if (_.isString(body)) parsedBody = safeJsonParse(body);

    const error = parsedBody.error || parsedBody;
    const type = error.type || REQUEST_FAILED_ERROR_TYPE;
    const message = error.message || REQUEST_FAILED_ERROR_MESSAGE;

    return new ApifyClientError(type, message, details);
};

/**
 * Checks that given parameter is of given type and throws ApifyClientError.
 * If errorMessage is not provided then error message is created from name and type of param.
 *
 * @param value - user entered value of that parameter
 * @param {String} name - parameter name (crawlerId for options.crawlerId)
 * @param {String} type - "String", "Number", ... (see ee: https://github.com/gkz/type-check)
 * @param {String} [errorMessage] - optional error message
 * @param {Boolean} [isApiV1] - flag for legacy Crawler
 */
export const checkParamOrThrow = (value, name, type, errorMessage, isApiV1) => {
    // TODO: move this into apify-shared along with an ApifyClientError,
    // actually it shouldn't be ApifyClientError but ApifyError in most cases!

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

    return _.mapValues(obj, (val, key) => {
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

/**
 * Replaces slash with tilde to url save string.
 * @param stringWithSlash {String}
 * @return {String}
 * TODO: TEST
 */
export function replaceSlashWithTilde(stringWithSlash) {
    return stringWithSlash.replace('/', '~');
}

// TODO: Move to the apify-shared
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
                originalError: error.error.message,
                errorDetails: error.error.details,
            });
        }
    };
    const options = Object.assign({}, { onRetry }, opts);

    return retry(func, options);
};
