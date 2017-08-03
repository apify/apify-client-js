import _ from 'underscore';
import { checkParamOrThrow, gzipPromise, pluckData, catchNotFoundOrThrow, decodeBody, encodeBody } from './utils';

/**
 * Key-value Store
 * @memberOf ApifyClient
 * @namespace keyValueStore
 */

export const BASE_PATH = '/v2/key-value-stores';
export const SIGNED_URL_UPLOAD_MIN_BYTESIZE = 1024 * 256;

export default {
    /**
     * Creates store of given name and returns it's object. If store with given name already exists then returns it's object.
     *
     * @memberof ApifyClient.keyValueStore
     * @instance
     * @param options
     * @param options.token
     * @param {string} options.storeName - Custom unique name to easily identify the store in the future.
     * @param callback
     * @returns {KeyValueStore}
     */
    getOrCreateStore: (requestPromise, options) => {
        const { baseUrl, token, storeName } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(storeName, 'storeName', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}`,
            json: true,
            method: 'POST',
            qs: { name: storeName, token },
        })
        .then(pluckData);
    },

    /**
     * Gets list of key-value stores.
     *
     * @memberof ApifyClient.keyValueStore
     * @instance
     * @param options
     * @param options.token
     * @param {number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {number} [options.desc] - If 1 then the objects are sorted by the startedAt field in descending order.
     * @param callback
     * @returns {PaginationList}
     */
    listStores: (requestPromise, options) => {
        const { baseUrl, token, offset, limit } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(limit, 'limit', 'Maybe Number');
        checkParamOrThrow(offset, 'offset', 'Maybe Number');

        const query = { token };

        if (limit) query.limit = limit;
        if (offset) query.offset = offset;

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}`,
            json: true,
            method: 'GET',
            qs: query,
        })
        .then(pluckData);
    },

    /**
     * Gets key-value store.
     *
     * @memberof ApifyClient.keyValueStore
     * @instance
     * @param options
     * @param {string} options.storeId - Unique store Id
     * @param callback
     * @returns {KeyValueStore}
     */
    getStore: (requestPromise, options) => {
        const { baseUrl, storeId } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${storeId}`,
            json: true,
            method: 'GET',
        })
        .then(pluckData)
        .catch(catchNotFoundOrThrow);
    },

    /**
     * Deletes key-value store.
     *
     * @memberof ApifyClient.keyValueStore
     * @instance
     * @param options
     * @param {string} options.storeId - Store Id
     * @param callback
     * @returns {*}
     */
    deleteStore: (requestPromise, options) => {
        const { baseUrl, storeId } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${storeId}`,
            json: true,
            method: 'DELETE',
        });
    },

    /**
     * Gets value stored in the key-value store under the given key.
     *
     * @memberof ApifyClient.keyValueStore
     * @instance
     * @param options
     * @param {string} options.storeId - Unique store Id
     * @param {string} options.key - Key of the record
     * @param {boolean} [options.raw] - If true parameter is set then response to this request will be raw value stored under the given key. Otherwise the value is wrapped in JSON object with additional info.
     * @param {boolean} [options.useRawBody] - It true, it doesn't decode response body TODO
     * @param {boolean} [options.url] - If true, it downloads data through aws sign url
     * @param callback
     * @returns {KeyValueStoreRecord|*}
     */
    // TODO: Ensure that body is null or string or buffer
    getRecord: (requestPromise, options) => {
        const { baseUrl, storeId, key, raw, useRawBody, url } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(key, 'key', 'String');
        checkParamOrThrow(raw, 'raw', 'Maybe Boolean');
        checkParamOrThrow(useRawBody, 'useRawBody', 'Maybe Boolean');
        checkParamOrThrow(url, 'url', 'Maybe Boolean');

        const requestOpts = {
            url: `${baseUrl}${BASE_PATH}/${storeId}/records/${key}`,
            method: 'GET',
            json: !raw,
            qs: {},
            gzip: true,
        };

        if (raw) {
            requestOpts.encoding = null;
            requestOpts.qs.raw = 1;
        }

        const parseResponse = (response) => {
            if (raw) return response;

            const data = pluckData(response);

            if (!useRawBody) data.body = decodeBody(data.body, data.contentType);

            return data;
        };

        // Downloading via our servers:
        if (!url) return requestPromise(requestOpts).then(parseResponse, catchNotFoundOrThrow);

        // ... or via signed url directly to S3:
        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${storeId}/records/${key}/direct-download-url`,
            method: 'GET',
            json: true,
            gzip: true,
            qs: requestOpts.qs,
        })
        .then((response) => {
            const meta = _.omit(response.data, 'signedUrl');

            return requestPromise({
                method: 'GET',
                url: response.data.signedUrl,
                json: false,
                gzip: true,
            })
            .then((body) => {
                return raw ? body : { data: Object.assign({}, _.omit(meta, 'contentEncoding'), { body }) };
            })
            .then(parseResponse, catchNotFoundOrThrow);
        });
    },

    /**
     * Saves the record into key-value store.
     *
     * @memberof ApifyClient.keyValueStore
     * @instance
     * @param options
     * @param {string} options.storeId - Unique store Id
     * @param {string} options.key - Key of the record
     * @param {string} options.contentType - Content type of body
     * @paramm {string|Buffer} options.body - Body in string or Buffer
     * @param {boolean} [options.useRawBody] - It true, it doesn't decode response body TODO
     * @param callback
     * @returns {*}
     */
    // TODO: check that body is buffer or string
    putRecord: (requestPromise, options) => {
        const { baseUrl, storeId, key, body, contentType = 'text/plain', useRawBody } = options;
        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(key, 'key', 'String');
        checkParamOrThrow(contentType, 'contentType', 'String');
        checkParamOrThrow(useRawBody, 'useRawBody', 'Maybe Boolean');

        const encodedBody = useRawBody ? body : encodeBody(body, contentType);

        return gzipPromise(options.promise, encodedBody)
            .then((gzipedBody) => {
                const requestOpts = {
                    url: `${baseUrl}${BASE_PATH}/${storeId}/records/${key}`,
                    method: 'PUT',
                    body: gzipedBody,
                    json: false,
                    headers: {
                        'Content-Type': contentType,
                        'Content-Encoding': 'gzip',
                    },
                };

                // Uploading via our servers:
                if (gzipedBody.length < SIGNED_URL_UPLOAD_MIN_BYTESIZE) return requestPromise(requestOpts);

                // ... or via signed url directly to S3:
                return requestPromise({
                    url: `${baseUrl}${BASE_PATH}/${storeId}/records/${key}/direct-upload-url`,
                    method: 'GET',
                    json: true,
                    headers: {
                        'Content-Type': contentType,
                    },
                })
                .then((response) => {
                    const signedUrl = response.data.signedUrl;
                    const s3RequestOpts = Object.assign({}, requestOpts, { url: signedUrl });

                    return requestPromise(s3RequestOpts);
                });
            });
    },

    /**
     * Deletes given record.
     *
     * @memberof ApifyClient.keyValueStore
     * @instance
     * @param options
     * @param {string} options.storeId - Unique store Id
     * @param {string} options.key - Key of the record
     * @param callback
     */
    deleteRecord: (requestPromise, options) => {
        const { baseUrl, storeId, key } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(key, 'key', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${storeId}/records/${key}`,
            json: true,
            method: 'DELETE',
        });
    },

    /**
     * Returns an array containing objects representing keys in given store.
     *
     * @memberof ApifyClient.keyValueStore
     * @instance
     * @param requestPromise
     * @param options
     * @param {string} options.storeId - Unique store Id
     * @param {string} [options.exclusiveStartKey] - All keys up to this one (including) are skipped from the result.
     * @param {number} [options.limit] - Number of keys to be returned. Maximum value is 1000
     * @param callback
     * @returns {PaginationList}
     */
    listKeys: (requestPromise, options) => {
        const { baseUrl, storeId, exclusiveStartKey, limit } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(exclusiveStartKey, 'exclusiveStartKey', 'Maybe String');
        checkParamOrThrow(limit, 'limit', 'Maybe Number');

        const query = {};

        if (exclusiveStartKey) query.exclusiveStartKey = exclusiveStartKey;
        if (limit) query.limit = limit;

        const requestOpts = {
            url: `${baseUrl}${BASE_PATH}/${storeId}/keys`,
            json: true,
            method: 'GET',
            qs: query,
        };

        return requestPromise(requestOpts).then(pluckData);
    },

    /**
     * Returns an array containing objects representing key value pairs in given store.
     *
     * @memberof ApifyClient.keyValueStore
     * @instance
     * @param options
     * @param {string} options.storeId - Unique store Id
     * @param {string} [options.exclusiveStartKey] - All keys up to this one (including) are skipped from the result.
     * @param {number} [options.limit] - Number of keys to be returned. Maximum value is 1000
     * @param {boolean} [options.useRawBody] - It true, it doesn't decode response body TODO
     * @param callback
     * @returns {PaginationList}
     */
    listRecords: (requestPromise, options) => {
        const { baseUrl, storeId, exclusiveStartKey, limit, useRawBody } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(exclusiveStartKey, 'exclusiveStartKey', 'Maybe String');
        checkParamOrThrow(limit, 'limit', 'Maybe Number');
        checkParamOrThrow(useRawBody, 'useRawBody', 'Maybe Boolean');

        const query = {};

        if (exclusiveStartKey) query.exclusiveStartKey = exclusiveStartKey;
        if (limit) query.limit = limit;

        const requestOpts = {
            url: `${baseUrl}${BASE_PATH}/${storeId}/records`,
            json: true,
            method: 'GET',
            qs: query,
        };

        const transformItem = (item) => {
            if (!useRawBody) item.body = decodeBody(item.body, item.contentType);

            return item;
        };

        return requestPromise(requestOpts)
            .then(pluckData)
            .then((data) => {
                data.items = data.items.map(transformItem);

                return data;
            });
    },
};
