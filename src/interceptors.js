const axios = require('axios');
const { maybeParseBody } = require('./body_parser');
const {
    isNode,
    maybeGzipValue,
} = require('./utils');

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
    if (config.headers['content-encoding']) return config;
    const maybeZippedData = await maybeGzipValue(config.data);
    if (config.data !== maybeZippedData) {
        config.headers['content-encoding'] = 'gzip';
        config.data = maybeZippedData;
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

const requestInterceptors = [maybeGzipRequest, serializeRequest];
const responseInterceptors = [parseResponseData];

module.exports = {
    InvalidResponseBodyError,
    requestInterceptors,
    responseInterceptors,
};
