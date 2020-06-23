const axios = require('axios');
const util = require('util');
const zlib = require('zlib');
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

function parseJsonResponse(response) {
    if (typeof response.data === 'string' && response.data.length) {
        const contentType = response.headers['content-type'];
        const isJson = /^application\/json/.test(contentType);
        if (isJson) response.data = JSON.parse(response.data);
    }
    return response;
}

const requestInterceptors = [inferRequestHeaders];
const responseInterceptors = [parseJsonResponse];

if (isNode()) {
    gzipPromise = util.promisify(zlib.gzip);
    // Interceptors are executed in reverse order.
    requestInterceptors.unshift(maybeGzipRequest);
}

module.exports = {
    requestInterceptors,
    responseInterceptors,
};
