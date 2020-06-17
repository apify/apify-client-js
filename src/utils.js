const isObject = require('lodash/isObject');
const isUndefined = require('lodash/isUndefined');
const isArray = require('lodash/isArray');
const mapValues = require('lodash/mapValues');
const contentTypeParser = require('content-type');
const { gzip } = require('zlib');
const log = require('apify-shared/log');
const retry = require('async-retry');

const CONTENT_TYPE_JSON = 'application/json';
const CONTENT_TYPE_XML = 'application/xml';
const CONTENT_TYPE_TEXT_PREFIX = 'text/';
const PARSE_DATE_FIELDS_MAX_DEPTH = 3; // obj.data.someArrayField.[x].field
const PARSE_DATE_FIELDS_KEY_SUFFIX = 'At';
const NOT_FOUND_STATUS_CODE = 404;

/**
 * Parses a JSON string. If string is not JSON then catches an error and returns empty object.
 */
const safeJsonParse = (str) => {
    let parsed;

    try {
        parsed = JSON.parse(str);
    } catch (err) {
        parsed = {};
    }

    return parsed;
};

/**
 * Returns object's data property or null if parameter is not an object.
 */
const pluckData = (obj) => (isObject(obj) && !isUndefined(obj.data) ? obj.data : null);

/**
 * If given HTTP error has NOT_FOUND_STATUS_CODE status code then returns undefined.
 * Otherwise rethrows error.
 */
const catchNotFoundOrThrow = (err) => {
    if (err.statusCode === NOT_FOUND_STATUS_CODE) return;
    throw err;
};

/**
 * Promisified zlib.gzip().
 */
const gzipPromise = (buffer) => {
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
const parseBody = (body, contentType) => {
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
function wrapArray(response) {
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
function parseDateFields(obj, depth = 0) {
    if (depth > PARSE_DATE_FIELDS_MAX_DEPTH) return obj;
    if (isArray(obj)) return obj.map((child) => parseDateFields(child, depth + 1));
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
function stringifyWebhooksToBase64(webhooks) {
    if (!webhooks) return;
    const webhooksJson = JSON.stringify(webhooks);
    return Buffer.from(webhooksJson, 'utf8').toString('base64');
}

/**
 * Replaces slash with tilde to url save string.
 * @param stringWithSlash {String}
 * @return {String}
 */
function replaceSlashWithTilde(stringWithSlash) {
    return stringWithSlash.replace('/', '~');
}

/**
 *
 * @param func
 * @param opts
 * @return {Promise | Promise<any>}
 */
const retryWithExpBackoff = (func, opts) => {
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
    const options = { onRetry, ...opts };

    return retry(func, options);
};

const isomorphicBufferToString = (buffer) => {
    if (buffer.constructor.name !== ArrayBuffer.name) {
        return buffer.toString();
    }

    // expect UTF-8
    const utf8decoder = new TextDecoder();
    return utf8decoder.decode(new Uint8Array(buffer));
};
const isNode = () => !!(typeof process !== 'undefined' && process.versions && process.versions.node);

const MIN_GZIP_BYTES = 1024;

const maybeGzipRequest = async (config) => {
    if (!isNode()) return config;
    if (config.data == null) return config;

    // Request compression is not that important so let's
    // skip it instead of throwing for unsupported types.
    const areDataStringOrBuffer = (typeof config.data === 'string') || Buffer.isBuffer(config.data);
    if (areDataStringOrBuffer) {
        const areDataLargeEnough = Buffer.byteLength(config.data) >= MIN_GZIP_BYTES;
        if (areDataLargeEnough) {
            config.headers['Content-Encoding'] = 'gzip';
            config.data = await gzipPromise(config.data);
        }
    }

    return config;
};

module.exports = {
    isNode,
    maybeGzipRequest,
    isomorphicBufferToString,
    retryWithExpBackoff,
    replaceSlashWithTilde,
    stringifyWebhooksToBase64,
    parseDateFields,
    wrapArray,
    parseBody,
    gzipPromise,
    catchNotFoundOrThrow,
    pluckData,
    safeJsonParse,
    CONTENT_TYPE_JSON,
};
