import { checkParamOrThrow, gzipPromise, pluckData, catchNotFoundOrThrow, parseBody } from './utils';

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
 * apifyClient.setOptions({ storeId: store._id });
 * await keyValueStores.putRecord({
 *      key: 'foo',
 *      body: 'bar',
 *      contentType: 'text/plain',
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
        .then(pluckData);
    },

    /**
     * Gets list of key-value stores.
     * @descriptions By default, the objects are sorted by the createdAt field in ascending order,
     * therefore you can use pagination to incrementally fetch all stores while new ones are still being created.
     * To sort them in descending order, use desc: 1 parameter.
     * The endpoint supports pagination using limit and offset parameters and it will not return more than 1000 array elements.
     * @memberof ApifyClient.keyValueStores
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Number} [options.desc] - If 1 then the objects are sorted by the startedAt field in descending order.
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
        .then(pluckData);
    },

    /**
     * Gets key-value store.
     *
     * @memberof ApifyClient.keyValueStores
     * @instance
     * @param {Object} options
     * @param {String} options.storeId - Unique store Id
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
     * @memberof ApifyClient.keyValueStores
     * @instance
     * @param {Object} options
     * @param {String} options.storeId - Store Id
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
     * @memberof ApifyClient.keyValueStores
     * @instance
     * @param {Object} options
     * @param {String} options.storeId - Unique store Id
     * @param {String} options.key - Key of the record
     * @param {Boolean} [options.rawBody] - If true parameter is set then response to this request will be raw value stored under
     *                                  the given key. Otherwise the value is wrapped in JSON object with additional info.
     * @param {Boolean} [options.disableBodyParser] - It true, it doesn't parse record's body based on content type.
     * @param {Boolean} [options.disableRedirect] - If rawBody=1 then API by default redirects user to record url for faster download.
                                                    If disableRedirect=1 is set then API returns the record value directly.
     * @param callback
     * @returns {KeyValueStoreRecord|*}
     */
    getRecord: (requestPromise, options) => {
        const { baseUrl, storeId, key, rawBody, disableBodyParser, disableRedirect } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(key, 'key', 'String');
        checkParamOrThrow(rawBody, 'rawBody', 'Maybe Boolean');
        checkParamOrThrow(disableBodyParser, 'disableBodyParser', 'Maybe Boolean');
        checkParamOrThrow(disableRedirect, 'disableRedirect', 'Maybe Boolean');

        const requestOpts = {
            url: `${baseUrl}${BASE_PATH}/${storeId}/records/${key}`,
            method: 'GET',
            json: !rawBody,
            qs: {},
            gzip: true,
        };

        if (rawBody) {
            requestOpts.resolveWithResponse = true;
            requestOpts.encoding = null;
            requestOpts.qs.rawBody = 1;
        }

        if (disableRedirect) requestOpts.qs.disableRedirect = 1;

        const parseResponse = (responseBody) => {
            const data = pluckData(responseBody);

            if (!disableBodyParser) data.body = parseBody(data.body, data.contentType);

            return data;
        };

        const parseRawBodyResponse = (response) => {
            const responseBody = response.body;
            const contentType = response.headers['content-type'];

            return disableBodyParser ? responseBody : parseBody(responseBody, contentType);
        };

        const responseParser = rawBody ? parseRawBodyResponse : parseResponse;

        return requestPromise(requestOpts).then(responseParser, catchNotFoundOrThrow);
    },

    /**
     * Saves the record into key-value store.
     *
     * @memberof ApifyClient.keyValueStores
     * @instance
     * @param {Object} options
     * @param {String} options.storeId - Unique store Id
     * @param {String} options.key - Key of the record
     * @param {String} options.contentType - Content type of body
     * @param {string|Buffer} options.body - Body in string or Buffer
     * @param callback
     * @returns {*}
     */
    putRecord: (requestPromise, options) => {
        const { baseUrl, storeId, key, body, contentType = 'text/plain' } = options;
        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(key, 'key', 'String');
        checkParamOrThrow(contentType, 'contentType', 'String');

        checkParamOrThrow(body, 'body', 'Buffer | String');

        return gzipPromise(options.promise, body)
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
     * @memberof ApifyClient.keyValueStores
     * @instance
     * @param {Object} options
     * @param {String} options.storeId - Unique store Id
     * @param {String} options.key - Key of the record
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
     * @description You can paginated using exclusiveStartKey and limit parameters.
     * @memberof ApifyClient.keyValueStores
     * @instance
     * @param requestPromise
     * @param {Object} options
     * @param {String} options.storeId - Unique store Id
     * @param {String} [options.exclusiveStartKey] - All keys up to this one (including) are skipped from the result.
     * @param {Number} [options.limit] - Number of keys to be returned. Maximum value is 1000
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
};
