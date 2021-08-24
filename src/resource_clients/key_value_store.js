const ow = require('ow').default;
const { default: log } = require('@apify/log');
const ResourceClient = require('../base/resource_client');
const { isBuffer, isStream } = require('../utils');
const {
    pluckData,
    parseDateFields,
    catchNotFoundOrThrow,
    isNode,
} = require('../utils');

/**
 * @hideconstructor
 */
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

    /**
     * https://docs.apify.com/api/v2#/reference/key-value-stores/store-object/get-store
     * @return {Promise<KeyValueStore>}
     */
    async get() {
        return this._get();
    }

    /**
     * https://docs.apify.com/api/v2#/reference/key-value-stores/store-object/update-store
     * @param {object} newFields
     * @return {Promise<KeyValueStore>}
     */
    async update(newFields) {
        ow(newFields, ow.object);
        return this._update(newFields);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/key-value-stores/store-object/delete-store
     * @return {Promise<void>}
     */
    async delete() {
        return this._delete();
    }

    /**
     * https://docs.apify.com/api/v2#/reference/key-value-stores/key-collection/get-list-of-keys
     * @param {object} [options]
     * @param {object} [options.limit]
     * @param {string} [options.exclusiveStartKey]
     * @return {Promise<object>}
     */
    async listKeys(options = {}) {
        ow(options, ow.object.exactShape({
            limit: ow.optional.number,
            exclusiveStartKey: ow.optional.string,
        }));
        const response = await this.httpClient.call({
            url: this._url('keys'),
            method: 'GET',
            params: options,
        });
        return parseDateFields(pluckData(response.data));
    }

    /**
     * You can use the `buffer` option to get the value in a Buffer (Node.js)
     * or ArrayBuffer (browser) format. In Node.js (not in browser) you can also
     * use the `stream` option to get a Readable stream.
     *
     * When the record does not exist, the function resolves to `undefined`. It does
     * NOT resolve to a `KeyValueStore` record with an `undefined` value.
     * https://docs.apify.com/api/v2#/reference/key-value-stores/record/get-record
     * @param {string} key
     * @param {object} [options]
     * @param {boolean} [options.buffer]
     * @param {boolean} [options.stream]
     * @return {Promise<KeyValueStoreRecord | undefined>}
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

        if ('disableRedirect' in options) {
            log.deprecated('The disableRedirect option for getRecord() is deprecated. '
                + 'It has no effect and will be removed in the following major release.');
        }

        const requestOpts = {
            url: this._url(`records/${key}`),
            method: 'GET',
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
     * https://docs.apify.com/api/v2#/reference/key-value-stores/record/put-record
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

        const uploadOpts = {
            url: this._url(`records/${key}`),
            method: 'PUT',
            data: value,
            headers: contentType && { 'content-type': contentType },
        };

        await this.httpClient.call(uploadOpts);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/key-value-stores/record/delete-record
     * @param {string} key
     * @return {Promise<void>}
     */
    async deleteRecord(key) {
        ow(key, ow.string);

        await this.httpClient.call({
            url: this._url(`records/${key}`),
            method: 'DELETE',
        });
    }
}

module.exports = KeyValueStoreClient;

/**
 * @typedef {object} KeyValueStoreRecord
 * @property {string} key
 * @property {null|string|number|object} value
 * @property {string} [contentType]
 */
