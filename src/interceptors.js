const axios = require('axios');
const util = require('util');
const zlib = require('zlib');
const { maybeParseBody } = require('./body_parser');
const { isNode } = require('./utils');

const MIN_GZIP_BYTES = 1024;

let gzipPromise;

function inferRequestHeaders(config) {
    const [defaultTransform] = axios.defaults.transformRequest;
    config.data = defaultTransform(config.data, config.headers);
    const hasBody = config.data != null;
    const isContentTypeMissing = !config.headers['Content-Type'];
    if (hasBody && isContentTypeMissing) {
        config.headers['Content-Type'] = 'application/json; charset=utf-8';
    }
    return config;
}

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
    response.data = maybeParseBody(response.data, contentTypeHeader);
    return response;
}

const requestInterceptors = [inferRequestHeaders];
const responseInterceptors = [parseResponseData];

if (isNode()) {
    gzipPromise = util.promisify(zlib.gzip);
    // Interceptors are executed in reverse order.
    requestInterceptors.unshift(maybeGzipRequest);
}

module.exports = {
    requestInterceptors,
    responseInterceptors,
};
