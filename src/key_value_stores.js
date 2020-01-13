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

export const SIGNED_URL_UPLOAD_MIN_BYTESIZE = 1024 * 256;

export default class KeyValueStores {
    constructor(httpClient) {
        this.basePath = '/v2/key-value-stores';
        this.client = httpClient;
    }

    _call(userOptions, endpointOptions) {
        const callOptions = this._getCallOptions(userOptions, endpointOptions);
        return this.client.call(callOptions);
    }

    _getCallOptions(userOptions, endpointOptions) {
        const { baseUrl, token } = userOptions;
        const callOptions = {
            basePath: this.basePath,
            json: true,
            ...endpointOptions,
        };
        if (baseUrl) callOptions.baseUrl = baseUrl;
        if (token) callOptions.token = token;
        return callOptions;
    }

    /**
     * Creates store of given name and returns it's object. If store with given name already exists then returns it's object.
     *
     * @memberof ApifyClient.keyValueStores
     * @instance
     * @param {Object} options
     * @param {String} options.storeName - Custom unique name to easily identify the store in the future.
     * @returns {KeyValueStore}
     */
    async getOrCreateStore(options) {
        const { storeName } = options;

        checkParamOrThrow(storeName, 'storeName', 'String');

        const qs = {
            name: storeName,
        };

        const endpointOptions = {
            url: '',
            method: 'POST',
            qs,
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

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
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Boolean} [options.desc] - If `true` then the objects are sorted by the startedAt field in descending order.
     * @param {Boolean} [options.unnamed] - If `true` then also unnamed stores will be returned. By default only named stores are returned.
     * @returns {PaginationList}
     */
    async listStores(options) {
        const { offset, limit, desc, unnamed } = options;

        checkParamOrThrow(limit, 'limit', 'Maybe Number');
        checkParamOrThrow(offset, 'offset', 'Maybe Number');
        checkParamOrThrow(desc, 'desc', 'Maybe Boolean');
        checkParamOrThrow(unnamed, 'unnamed', 'Maybe Boolean');

        const query = {};

        if (limit) query.limit = limit;
        if (offset) query.offset = offset;
        if (desc) query.desc = 1;
        if (unnamed) query.unnamed = 1;

        const endpointOptions = {
            url: '',
            method: 'GET',
            qs: query,
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * Gets key-value store.
     *
     * @memberof ApifyClient.keyValueStores
     * @instance
     * @param {Object} options
     * @param {String} options.storeId - Unique store ID
     * @param {String} [options.token] - Your API token at apify.com. This parameter is required
     *                                   only when using "username~store-name" format for storeId.
     * @returns {KeyValueStore}
     */
    async getStore(options) {
        const { storeId } = options;

        checkParamOrThrow(storeId, 'storeId', 'String');

        const endpointOptions = {
            url: `/${storeId}`,
            method: 'GET',
        };

        try {
            const response = await this._call(options, endpointOptions);
            return parseDateFields(pluckData(response));
        } catch (err) {
            return catchNotFoundOrThrow(err);
        }
    }

    /**
     * Deletes key-value store.
     *
     * @memberof ApifyClient.keyValueStores
     * @instance
     * @param {Object} options
     * @param {String} options.storeId - Unique store ID
     * @param {String} [options.token] - Your API token at apify.com. This parameter is required
     *                                   only when using "username~store-name" format for storeId.
     * @returns {*}
     */
    async deleteStore(options) {
        const { storeId } = options;

        checkParamOrThrow(storeId, 'storeId', 'String');

        const endpointOptions = {
            url: `/${storeId}`,
            method: 'DELETE',
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(response);
    }

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
     * @returns {KeyValueStoreRecord}
     */
    async getRecord(options) {
        const { storeId, key, disableBodyParser, disableRedirect } = options;

        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(key, 'key', 'String');
        checkParamOrThrow(disableBodyParser, 'disableBodyParser', 'Maybe Boolean');
        checkParamOrThrow(disableRedirect, 'disableRedirect', 'Maybe Boolean');

        const endpointOptions = {
            url: `/${storeId}/records/${key}`,
            method: 'GET',
            json: false,
            qs: {},
            gzip: true,
            resolveWithFullResponse: true,
            encoding: null,
        };

        if (disableRedirect) endpointOptions.qs.disableRedirect = 1;
        const parseResponse = (response) => {
            const responseBody = response.body;
            const contentType = response.headers['content-type'];
            const body = disableBodyParser ? responseBody.toString() : parseBody(responseBody, contentType);

            return {
                contentType,
                data: body,
            };
        };
        try {
            const response = await this._call(options, endpointOptions);
            return parseDateFields(pluckData(parseResponse(response)));
        } catch (err) {
            return catchNotFoundOrThrow(err);
        }
    }

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
     * @returns {*}
     */
    async putRecord(options) {
        const { storeId, key, body, contentType = 'text/plain; charset=utf-8' } = options;
        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(key, 'key', 'String');
        checkParamOrThrow(contentType, 'contentType', 'String');
        checkParamOrThrow(body, 'body', 'Buffer | String');

        const bufferForLengthCheck = Buffer.isBuffer(body) ? body : Buffer.from(body, 'utf-8');
        const gzipedBody = await gzipPromise(body);

        const endpointOptions = {
            url: `/${storeId}/records/${key}`,
            method: 'PUT',
            body: gzipedBody,
            json: false,
            headers: {
                'Content-Type': contentType,
                'Content-Encoding': 'gzip',
            },
        };

        // Uploading via our servers:
        if (bufferForLengthCheck.byteLength < SIGNED_URL_UPLOAD_MIN_BYTESIZE) return this._call(options, endpointOptions);

        // ... or via signed url directly to S3:
        const directEndpointOptions = {
            url: `/${storeId}/records/${key}/direct-upload-url`,
            method: 'GET',
        };
        const response = await this._call(options, directEndpointOptions);

        const { signedUrl } = response.data;
        const s3RequestOpts = Object.assign({}, endpointOptions, { url: signedUrl, qs: null });

        return this._call(options, s3RequestOpts);
    }

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
     */
    async deleteRecord(options) {
        const { storeId, key } = options;

        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(key, 'key', 'String');

        const endpointOptions = {
            url: `/${storeId}/record/${key}`,
            method: 'DELETE',
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(response);
    }

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
     * @returns {PaginationList}
     */
    async listKeys(options) {
        const { storeId, exclusiveStartKey, limit } = options;

        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(exclusiveStartKey, 'exclusiveStartKey', 'Maybe String');
        checkParamOrThrow(limit, 'limit', 'Maybe Number');

        const query = {};
        if (exclusiveStartKey) query.exclusiveStartKey = exclusiveStartKey;
        if (limit) query.limit = limit;

        const endpointOptions = {
            url: `/${storeId}/keys`,
            json: true,
            method: 'GET',
            qs: query,
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }
}
