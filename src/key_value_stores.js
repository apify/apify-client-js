import _ from 'underscore';
import { checkParamOrThrow, gzipPromise, pluckData, catchNotFoundOrThrow, parseBody, parseDateFields } from './utils';

/**
 * Key-value Stores
 * @memberOf ApifyClient
 * @description
 * ### Basic usage
 * ```javascript
 * const ApifyClient = require('apify-client');
 *
 * const apifyClient = new ApifyClient({
 *        userId: 'RWnGtczasdwP63Mak',
 *        token: 'f5J7XsdaKDyRywwuGGo9',
 * });
 * const keyValueStores = apifyClient.keyValueStores;
 *
 * const store = await keyValueStores.getOrCreateStore({ storeName: 'my-store' });
 * apifyClient.setOptions({ storeId: store.id });
 * await keyValueStores.putRecord({
 *      key: 'foo',
 *      body: 'bar',
 *      contentType: 'text/plain; charset=utf-8',
 * });
 * const record = await keyValueStores.getRecord({ key: 'foo' });
 * const keys = await keyValueStores.getRecordsKeys();
 * await keyValueStores.deleteRecord({ key: 'foo' });
 * ```
 *
 * Every method can be used as either promise or with callback. If your Node version supports await/async then you can await promise result.
 * ```javascript
 * // Awaited promise
 * try {
 *      const record = await keyValueStores.getRecord({ key: 'foo' });
 *      // Do something record ...
 * } catch (err) {
 *      // Do something with error ...
 * }
 *
 * // Promise
 * keyValueStores.getRecord({ key: 'foo' })
 * .then((RECORD) => {
 *      // Do something record ...
 * })
 * .catch((err) => {
 *      // Do something with error ...
 * });
 *
 * // Callback
 * keyValueStores.getRecord({ key: 'foo' }, (err, record) => {
 *      // Do something with error or record ...
 * });
 * ```
 * @namespace keyValueStores
 */

export const BASE_PATH = '/v2/key-value-stores';
export const SIGNED_URL_UPLOAD_MIN_BYTESIZE = 1024 * 256;

export default {
    /**
     * Creates store of given name and returns it's object. If store with given name already exists then returns it's object.
     *
     * @memberof ApifyClient.keyValueStores
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.storeName - Custom unique name to easily identify the store in the future.
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
            .then(pluckData)
            .then(parseDateFields);
    },

    /**
     * Gets list of key-value stores.
     *
     * By default, the objects are sorted by the createdAt field in ascending order,
     * therefore you can use pagination to incrementally fetch all stores while new ones are still being created.
     * To sort them in descending order, use desc: `true` parameter.
     * The endpoint supports pagination using limit and offset parameters and it will not return more than 1000 array elements.
     *
     * @memberof ApifyClient.keyValueStores
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Boolean} [options.desc] - If `true` then the objects are sorted by the startedAt field in descending order.
     * @param {Boolean} [options.unnamed] - If `true` then also unnamed stores will be returned. By default only named stores are returned.
     * @param callback
     * @returns {PaginationList}
     */
    listStores: (requestPromise, options) => {
        const { baseUrl, token, offset, limit, desc, unnamed } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(limit, 'limit', 'Maybe Number');
        checkParamOrThrow(offset, 'offset', 'Maybe Number');
        checkParamOrThrow(desc, 'desc', 'Maybe Boolean');
        checkParamOrThrow(unnamed, 'unnamed', 'Maybe Boolean');

        const query = { token };

        if (limit) query.limit = limit;
        if (offset) query.offset = offset;
        if (desc) query.desc = 1;
        if (unnamed) query.unnamed = 1;

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}`,
            json: true,
            method: 'GET',
            qs: query,
        })
            .then(pluckData)
            .then(parseDateFields);
    },

    /**
     * Gets key-value store.
     *
     * @memberof ApifyClient.keyValueStores
     * @instance
     * @param {Object} options
     * @param {String} options.storeId - Unique store ID
     * @param {String} [options.token] - Your API token at apify.com. This parameter is required
     *                                   only when using "username~store-name" format for storeId.
     * @param callback
     * @returns {KeyValueStore}
     */
    getStore: (requestPromise, options) => {
        const { baseUrl, storeId, token } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(token, 'token', 'Maybe String');

        const query = {};
        if (token) query.token = token;

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${storeId}`,
            json: true,
            method: 'GET',
            qs: query,
        })
            .then(pluckData)
            .then(parseDateFields)
            .catch(catchNotFoundOrThrow);
    },

    /**
     * Updates key-value store.
     *
     * @memberof ApifyClient.stores
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.storeId - Unique store ID
     * @param {Object} options.store
     * @param callback
     * @returns {KeyValueStore}
     */
    updateStore: (requestPromise, options) => {
        const { baseUrl, token, storeId, store } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(store, 'store', 'Object');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${storeId}`,
            json: true,
            method: 'PUT',
            qs: { token },
            body: _.omit(store, 'id'),
        })
            .then(pluckData)
            .then(parseDateFields);
    },

    /**
     * Deletes key-value store.
     *
     * @memberof ApifyClient.keyValueStores
     * @instance
     * @param {Object} options
     * @param {String} options.storeId - Unique store ID
     * @param {String} [options.token] - Your API token at apify.com. This parameter is required
     *                                   only when using "username~store-name" format for storeId.
     * @param callback
     * @returns {*}
     */
    deleteStore: (requestPromise, options) => {
        const { baseUrl, storeId, token } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(token, 'token', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${storeId}`,
            json: true,
            method: 'DELETE',
            qs: { token },
        });
    },

    /**
     * Gets value stored in the key-value store under the given key.
     *
     * @memberof ApifyClient.keyValueStores
     * @instance
     * @param {Object} options
     * @param {String} options.storeId - Unique store ID
     * @param {String} options.key - Key of the record
     * @param {Boolean} [options.disableBodyParser] - It true, it doesn't parse record's body based on content type.
     * @param {Boolean} [options.disableRedirect] - API by default redirects user to signed record url for faster download.
                                                    If disableRedirect=1 is set then API returns the record value directly.
     * @param {String} [options.token] - Your API token at apify.com. This parameter is required
     *                                   only when using "username~store-name" format for storeId.
     * @param callback
     * @returns {KeyValueStoreRecord}
     */
    getRecord: (requestPromise, options) => {
        const { baseUrl, storeId, key, disableBodyParser, disableRedirect, token } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(key, 'key', 'String');
        checkParamOrThrow(disableBodyParser, 'disableBodyParser', 'Maybe Boolean');
        checkParamOrThrow(disableRedirect, 'disableRedirect', 'Maybe Boolean');
        checkParamOrThrow(token, 'token', 'Maybe String');

        const requestOpts = {
            url: `${baseUrl}${BASE_PATH}/${storeId}/records/${key}`,
            method: 'GET',
            json: false,
            qs: {},
            gzip: true,
            resolveWithFullResponse: true,
            encoding: null,
        };

        if (disableRedirect) requestOpts.qs.disableRedirect = 1;
        if (token) requestOpts.qs.token = token;

        const parseResponse = (response) => {
            const responseBody = response.body;
            const contentType = response.headers['content-type'];
            const body = disableBodyParser ? responseBody : parseBody(responseBody, contentType);

            return {
                contentType,
                body,
            };
        };

        return requestPromise(requestOpts)
            .then(parseResponse)
            .catch(catchNotFoundOrThrow);
    },

    /**
     * Saves the record into key-value store.
     *
     * @memberof ApifyClient.keyValueStores
     * @instance
     * @param {Object} options
     * @param {String} options.storeId - Unique store ID
     * @param {String} options.key - Key of the record
     * @param {String} options.contentType - Content type of body
     * @param {string|Buffer} options.body - Body in string or Buffer
     * @param {String} [options.token] - Your API token at apify.com. This parameter is required
     *                                   only when using "username~store-name" format for storeId.
     * @param callback
     * @returns {*}
     */
    putRecord: (requestPromise, options) => {
        const { baseUrl, storeId, key, body, contentType = 'text/plain; charset=utf-8', token } = options;
        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(key, 'key', 'String');
        checkParamOrThrow(contentType, 'contentType', 'String');
        checkParamOrThrow(body, 'body', 'Buffer | String');
        checkParamOrThrow(token, 'token', 'String');

        const bufferForLengthCheck = Buffer.isBuffer(body) ? body : Buffer.from(body, 'utf-8');

        return gzipPromise(body)
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
                    qs: { token },
                };

                // Uploading via our servers:
                if (bufferForLengthCheck.byteLength < SIGNED_URL_UPLOAD_MIN_BYTESIZE) return requestPromise(requestOpts);

                // ... or via signed url directly to S3:
                return requestPromise({
                    url: `${baseUrl}${BASE_PATH}/${storeId}/records/${key}/direct-upload-url`,
                    method: 'GET',
                    json: true,
                    headers: {
                        'Content-Type': contentType,
                    },
                    qs: { token },
                })
                    .then((response) => {
                        const signedUrl = response.data.signedUrl;
                        const s3RequestOpts = Object.assign({}, requestOpts, { url: signedUrl, qs: null });

                        return requestPromise(s3RequestOpts);
                    });
            });
    },

    /**
     * Deletes given record.
     *
     * @memberof ApifyClient.keyValueStores
     * @instance
     * @param {Object} options
     * @param {String} options.storeId - Unique store ID
     * @param {String} options.key - Key of the record
     * @param {String} [options.token] - Your API token at apify.com. This parameter is required
     *                                   only when using "username~store-name" format for storeId.
     * @param callback
     */
    deleteRecord: (requestPromise, options) => {
        const { baseUrl, storeId, key, token } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(key, 'key', 'String');
        checkParamOrThrow(token, 'token', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${storeId}/records/${key}`,
            json: true,
            method: 'DELETE',
            qs: { token },
        });
    },

    /**
     * Returns an array containing objects representing keys in given store.
     *
     * You can paginated using exclusiveStartKey and limit parameters.
     *
     * @memberof ApifyClient.keyValueStores
     * @instance
     * @param {Object} options
     * @param {String} options.storeId - Unique store ID
     * @param {String} [options.exclusiveStartKey] - All keys up to this one (including) are skipped from the result.
     * @param {Number} [options.limit] - Number of keys to be returned. Maximum value is 1000
     * @param {String} [options.token] - Your API token at apify.com. This parameter is required
     *                                   only when using "username~store-name" format for storeId.
     * @param callback
     * @returns {PaginationList}
     */
    listKeys: (requestPromise, options) => {
        const { baseUrl, storeId, exclusiveStartKey, limit, token } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(exclusiveStartKey, 'exclusiveStartKey', 'Maybe String');
        checkParamOrThrow(limit, 'limit', 'Maybe Number');
        checkParamOrThrow(token, 'token', 'Maybe String');

        const query = {};
        if (token) query.token = token;
        if (exclusiveStartKey) query.exclusiveStartKey = exclusiveStartKey;
        if (limit) query.limit = limit;

        const requestOpts = {
            url: `${baseUrl}${BASE_PATH}/${storeId}/keys`,
            json: true,
            method: 'GET',
            qs: query,
        };

        return requestPromise(requestOpts)
            .then(pluckData)
            .then(parseDateFields);
    },
};
