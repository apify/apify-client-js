const isObject = require('lodash/isObject');
const isUndefined = require('lodash/isUndefined');
const isArray = require('lodash/isArray');
const mapValues = require('lodash/mapValues');
const log = require('apify-shared/log');
const retry = require('async-retry');

const PARSE_DATE_FIELDS_MAX_DEPTH = 3; // obj.data.someArrayField.[x].field
const PARSE_DATE_FIELDS_KEY_SUFFIX = 'At';
const NOT_FOUND_STATUS_CODE = 404;

/**
 * Returns object's 'data' property or throws if parameter is not an object,
 * or an object without a 'data' property.
 */
const pluckData = (obj) => {
    if (isObject(obj) && !isUndefined(obj.data)) {
        return obj.data;
    }
    throw new Error(`Expected response object with a "data" property, but received: ${obj}`);
};

/**
 * If given HTTP error has NOT_FOUND_STATUS_CODE status code then returns undefined.
 * Otherwise rethrows error.
 */
const catchNotFoundOrThrow = (err) => {
    if (err.statusCode === NOT_FOUND_STATUS_CODE) return;
    throw err;
};

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
    if (isNode()) {
        return Buffer.from(webhooksJson, 'utf8').toString('base64');
    }
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(webhooksJson);
    return btoa(String.fromCharCode(...uint8Array));
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

const isNode = () => !!(typeof process !== 'undefined' && process.versions && process.versions.node);

module.exports = {
    isNode,
    retryWithExpBackoff,
    stringifyWebhooksToBase64,
    parseDateFields,
    catchNotFoundOrThrow,
    pluckData,
};
