const log = require('apify-shared/log');
const retry = require('async-retry');
const ow = require('ow');

const PARSE_DATE_FIELDS_MAX_DEPTH = 3; // obj.data.someArrayField.[x].field
const PARSE_DATE_FIELDS_KEY_SUFFIX = 'At';
const NOT_FOUND_STATUS_CODE = 404;
const NOT_FOUND_TYPE = 'record-not-found';
const NOT_FOUND_ON_S3 = '<Code>NoSuchKey</Code>';

/**
 * Returns object's 'data' property or throws if parameter is not an object,
 * or an object without a 'data' property.
 */
const pluckData = (obj) => {
    const isObject = !!obj && typeof obj === 'object';
    if (isObject && typeof obj.data !== 'undefined') {
        return obj.data;
    }
    throw new Error(`Expected response object with a "data" property, but received: ${obj}`);
};

/**
 * If given HTTP error has NOT_FOUND_STATUS_CODE status code then returns undefined.
 * Otherwise rethrows error.
 */
const catchNotFoundOrThrow = (err) => {
    const isNotFoundStatus = err.statusCode === NOT_FOUND_STATUS_CODE;
    const isNotFoundMessage = err.type === NOT_FOUND_TYPE || err.message.includes(NOT_FOUND_ON_S3);
    const isNotFoundError = isNotFoundStatus && isNotFoundMessage;
    if (!isNotFoundError) throw err;
};

/**
 * Helper function that traverses JSON structure and parses fields such as modifiedAt or createdAt to dates.
 */
function parseDateFields(input, depth = 0) {
    if (depth > PARSE_DATE_FIELDS_MAX_DEPTH) return input;
    if (Array.isArray(input)) return input.map((child) => parseDateFields(child, depth + 1));
    if (!input || typeof input !== 'object') return input;

    return Object.entries(input).reduce((output, [k, v]) => {
        const isValObject = !!v && typeof v === 'object';
        if (k.endsWith(PARSE_DATE_FIELDS_KEY_SUFFIX)) {
            output[k] = v ? new Date(v) : v;
        } else if (isValObject || Array.isArray(v)) {
            output[k] = parseDateFields(v, depth + 1);
        } else {
            output[k] = v;
        }
        return output;
    }, {});
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

/**
 * @return {boolean}
 */
const isNode = () => !!(typeof process !== 'undefined' && process.versions && process.versions.node);

/**
 * @param {*} value
 * @return {boolean}
 */
const isBuffer = (value) => ow.isValid(value, ow.any(ow.buffer, ow.arrayBuffer, ow.typedArray));

/**
 * @param {*} value
 * @return {boolean}
 */
const isStream = (value) => ow.isValid(value, ow.object.hasKeys('on', 'pipe'));

module.exports = {
    isNode,
    isBuffer,
    isStream,
    retryWithExpBackoff,
    stringifyWebhooksToBase64,
    parseDateFields,
    catchNotFoundOrThrow,
    pluckData,
};
