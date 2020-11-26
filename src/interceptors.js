const axios = require('axios');
const util = require('util');
const zlib = require('zlib');
const { maybeParseBody } = require('./body_parser');
const { isNode } = require('./utils');

const MIN_GZIP_BYTES = 1024;

let gzipPromise;

/**
 * This error exists for the quite common situation, where only a partial JSON response is received and
 * an attempt to parse the JSON throws an error. In most cases this can be resolved by retrying the
 * request. We do that by identifying this error in HttpClient.
 *
 * The properties mimic AxiosError for easier integration in HttpClient error handling.
 */
class InvalidResponseBodyError extends Error {
    constructor(response, cause) {
        super(`Response body could not be parsed.\nCause:${cause.message}`);
        this.name = this.constructor.name;
        this.code = 'invalid-response-body';
        this.response = response;
        this.cause = cause;
    }
}

/**
 * @param {object} config
 * @return {object}
 */
function serializeRequest(config) {
    const [defaultTransform] = axios.defaults.transformRequest;
    config.data = defaultTransform(config.data, config.headers);
    return config;
}

/**
 * @param {object} config
 * @return {Promise<object>}
 */
async function maybeGzipRequest(config) {
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
}

/**
 * @param {AxiosResponse} response
 * @return {AxiosResponse}
 */
function parseResponseData(response) {
    if (
        !response.data // Nothing to do here.
        || response.config.responseType !== 'arraybuffer' // We don't want to parse custom response types.
        || response.config.forceBuffer // Apify custom property to prevent parsing of buffer.
    ) {
        return response;
    }

    const isBufferEmpty = isNode() ? !response.data.length : !response.data.byteLength;
    if (isBufferEmpty) {
        // undefined is better than an empty buffer
        response.data = undefined;
        return response;
    }

    const contentTypeHeader = response.headers['content-type'];
    try {
        response.data = maybeParseBody(response.data, contentTypeHeader);
    } catch (err) {
        throw new InvalidResponseBodyError(response, err);
    }

    return response;
}

const requestInterceptors = [serializeRequest];
const responseInterceptors = [parseResponseData];

if (isNode()) {
    gzipPromise = util.promisify(zlib.gzip);
    // Interceptors are executed in reverse order.
    requestInterceptors.unshift(maybeGzipRequest);
}

module.exports = {
    InvalidResponseBodyError,
    requestInterceptors,
    responseInterceptors,
};
