const _ = require('lodash');
const ow = require('ow');
const ResourceClient = require('../base/resource_client');
const {
    pluckData,
    parseDateFields,
    catchNotFoundOrThrow,
    isNode,
} = require('../utils');

const SIGNED_URL_UPLOAD_MIN_BYTES = 1024 * 256;

class KeyValueStoreClient extends ResourceClient {
    /**
     * @param {ApiClientOptions} options
     */
    constructor(options) {
        super({
            resourcePath: 'key-value-stores',
            ...options,
        });
    }

    async listKeys(options = {}) {
        ow(options, ow.object.exactShape({
            limit: ow.optional.number,
            exclusiveStartKey: ow.optional.string,
            desc: ow.optional.boolean,
        }));
        const response = await this.httpClient.call({
            url: this._url('keys'),
            method: 'GET',
            params: this._params(options),
        });
        return parseDateFields(pluckData(response.data));
    }

    async getValue(key, options = {}) {
        ow(key, ow.string);
        ow(options, ow.object.exactShape({
            buffer: ow.optional.boolean,
            stream: ow.optional.boolean,
            disableRedirect: ow.optional.boolean,
        }));
        if (options.stream && !isNode()) {
            throw new Error('The stream option can only be used in Node.js environment.');
        }

        const params = {
            disableRedirect: options.disableRedirect,
        };

        const requestOpts = {
            url: this._url(`records/${key}`),
            method: 'GET',
            params: this._params(params),
        };

        if (options.buffer) requestOpts.forceBuffer = true;
        if (options.stream) requestOpts.responseType = 'stream';

        try {
            const response = await this.httpClient.call(requestOpts);
            return {
                contentType: response.headers['content-type'],
                body: response.data,
            };
        } catch (err) {
            return catchNotFoundOrThrow(err);
        }
    }

    async setValue(key, value, options = {}) {
        ow(key, ow.string);
        // value can be anything
        ow(options, ow.object.exactShape({
            contentType: ow.optional.string,
        }));

        const isJson = !options.contentType || /^application\/json/.test(options.contentType);
        if (isJson) value = JSON.stringify(value, null, 2); // for readability

        let uploadUrl = this._url(`records/${key}`);
        if (this._shouldUseDirectUpload(value)) {
            const response = await this.httpClient.call({
                url: this._url(`records/${key}/direct-upload-url`),
                method: 'GET',
            });
            uploadUrl = response.data.signedUrl;
        }

        const uploadOpts = {
            url: uploadUrl,
            method: 'PUT',
            params: this._params(),
            data: value,
        };
        if (options.contentType) {
            uploadOpts.headers = {
                'Content-Type': options.contentType,
            };
        }

        await this.httpClient.call(uploadOpts);
    }

    async deleteValue(key) {
        ow(key, ow.string);

        await this.httpClient.call({
            url: this._url(`records/${key}`),
            method: 'DELETE',
            params: this._params(),
        });
    }

    _shouldUseDirectUpload(value) {
        let bytes = Infinity;
        if (typeof value === 'string') {
            // We could encode this to measure precisely,
            // but it's not worth the extra computation.
            bytes = value.length;
        }
        if (
            _.isBuffer(value)
            || _.isArrayBuffer(value)
            || _.isTypedArray(value)
        ) {
            bytes = value.byteLength;
        }
        return bytes >= SIGNED_URL_UPLOAD_MIN_BYTES;
    }
}

module.exports = KeyValueStoreClient;
