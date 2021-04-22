const axios = require('axios');
const contentTypeParser = require('content-type');
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

    // The function not only serializes data, but it also adds correct headers.
    const data = defaultTransform(config.data, config.headers);

    // Actor inputs can include functions and we don't want to omit those,
    // because it's convenient for users. JSON.stringify removes them.
    // It's a bit inefficient that we serialize the JSON twice, but I feel
    // it's a small price to pay. The axios default transform does a lot
    // of body type checks and we would have to copy all of them to the resource clients.
    if (config.stringifyFunctions) {
        const contentTypeHeader = config.headers['Content-Type'] || config.headers['content-type'];
        try {
            const { type } = contentTypeParser.parse(contentTypeHeader);
            if (type === 'application/json' && typeof config.data === 'object') {
                config.data = stringifyWithFunctions(config.data);
            } else {
                config.data = data;
            }
        } catch (err) {
            config.data = data;
        }
    } else {
        config.data = data;
    }

    return config;
}

/**
 * JSON.stringify() that serializes functions to string instead
 * of replacing them with null or removing them.
 * @param {object} obj
 * @return {string}
 */
function stringifyWithFunctions(obj) {
    return JSON.stringify(obj, (key, value) => {
        return typeof value === 'function' ? value.toString() : value;
    });
}

/**
 * @param {object} config
 * @return {Promise<object>}
 */
async function maybeGzipRequest(config) {
    if (config.headers['content-encoding']) return config;
    const maybeZippedData = await maybeGzipValue(config.data);
    if (maybeZippedData) {
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
