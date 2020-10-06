const ow = require('ow');
const ResourceClient = require('../base/resource_client');
const { isBuffer, isStream } = require('../utils');
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

    /**
     * @param {string} key
     * @param {object} [options]
     * @param {boolean} [options.buffer]
     * @param {boolean} [options.stream]
     * @param {boolean} [options.disableRedirect]
     * @return KeyValueStoreRecord
     */
    async getRecord(key, options = {}) {
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
                key,
                value: response.data,
                contentType: response.headers['content-type'],
            };
        } catch (err) {
            return catchNotFoundOrThrow(err);
        }
    }

    /**
     * @param {KeyValueStoreRecord} record
     * @return {Promise<void>}
     */
    async setRecord(record) {
        ow(record, ow.object.exactShape({
            key: ow.string,
            value: ow.any(ow.null, ow.string, ow.number, ow.object),
            contentType: ow.optional.string.nonEmpty,
        }));

        const { key } = record;
        let { value, contentType } = record;

        const isValueStreamOrBuffer = isStream(value) || isBuffer(value);
        // To allow saving Objects to JSON without providing content type
        if (!contentType) {
            if (isValueStreamOrBuffer) contentType = 'application/octet-stream';
            else if (typeof value === 'string') contentType = 'text/plain; charset=utf-8';
            else contentType = 'application/json; charset=utf-8';
        }

        const isContentTypeJson = /^application\/json/.test(contentType);
        if (isContentTypeJson && !isValueStreamOrBuffer && typeof value !== 'string') {
            try {
                value = JSON.stringify(value, null, 2);
            } catch (err) {
                const msg = `The record value cannot be stringified to JSON. Please provide other content type.\nCause: ${err.message}`;
                throw new Error(msg);
            }
        }

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
        if (contentType) {
            uploadOpts.headers = {
                'Content-Type': contentType,
            };
        }

        await this.httpClient.call(uploadOpts);
    }

    /**
     * @param {string} key
     * @return {Promise<void>}
     */
    async deleteRecord(key) {
        ow(key, ow.string);

        await this.httpClient.call({
            url: this._url(`records/${key}`),
            method: 'DELETE',
            params: this._params(),
        });
    }

    /**
     * @param {string|Buffer|stream.Readable} value
     * @return {boolean}
     * @private
     */
    _shouldUseDirectUpload(value) {
        let bytes = -1;
        if (typeof value === 'string') {
            // We could encode this to measure precisely,
            // but it's not worth the extra computation.
            bytes = value.length;
        }
        if (isBuffer(value)) {
            bytes = value.byteLength;
        }
        if (isStream(value)) {
            // Streams can't be counted but let's assume it's big.
            bytes = Infinity;
        }
        return bytes >= SIGNED_URL_UPLOAD_MIN_BYTES;
    }
}

module.exports = KeyValueStoreClient;

/**
 * @typedef {object} KeyValueStoreRecord
 * @property {string} key
 * @property {null|string|number|object} value
 * @property {string} [contentType]
 */
