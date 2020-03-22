import omit from 'lodash/omit';
import { checkParamOrThrow, pluckData, catchNotFoundOrThrow, parseBody, parseDateFields, isomorphicBufferToString } from './utils';
import Resource from './resource';

/**
 * Key-value Stores
 * @memberOf ApifyClient
 * @description
 * This section describes API endpoints to manage Key-value stores.
 * Key-value store is a simple storage for saving and reading data records or files.
 * Each data record is represented by a unique key and associated with a MIME content type.
 * Key-value stores are ideal for saving screenshots, actor inputs and outputs, web pages, PDFs or to persist the state of crawlers.
 * For more information, see the (Key-value store documentation)[https://docs.apify.com/storage/key-value-store].
 * Note that some of the endpoints do not require the authentication token,
 * the calls are authenticated using a hard-to-guess ID of the key-value store.
 *
 * For more details see [Key-value store endpoint](https://docs.apify.com/api/v2#/reference/key-value-stores)
 *
 * @namespace keyValueStores
 */

export const SIGNED_URL_UPLOAD_MIN_BYTESIZE = 1024 * 256;

export default class KeyValueStores extends Resource {
    constructor(httpClient) {
        super(httpClient, '/v2/key-value-stores');
    }

    /**
     * Creates a key-value store with a specific name.
     * If there is another store with the same name, the endpoint does not create a new one and returns the existing object instead.
     *
     * For more details see
     * [create key-value store endpoint](https://docs.apify.com/api/v2#/reference/key-value-stores/store-collection/create-key-value-store)
     *
     * @memberof ApifyClient.keyValueStores
     * @param {Object} options
     * @param {String} options.storeName - Custom unique name to easily identify the store in the future.
     * @returns {KeyValueStore}
     */
    async getOrCreateStore(options = {}) {
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
     * For more details see
     *[get list of key-value stores endpoint](https://docs.apify.com/api/v2#/reference/key-value-stores/store-collection/get-list-of-key-value-stores)
     *
     * @memberof ApifyClient.keyValueStores
     * @param {Object} options
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Boolean} [options.desc] - If `true` then the objects are sorted by the startedAt field in descending order.
     * @param {Boolean} [options.unnamed] - If `true` then also unnamed stores will be returned. By default only named stores are returned.
     * @returns {PaginationList}
     */
    async listStores(options = {}) {
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
     * Gets an object that contains all the details about a specific key-value store.
     *
     * For more details see
     * [get key-value store endpoint](https://docs.apify.com/api/v2#/reference/key-value-stores/store-object/get-store)
     *
     * @memberof ApifyClient.keyValueStores
     * @param {Object} options
     * @param {String} options.storeId - Key-value store ID or username~store-name.
     * @param {String} [options.token] - Your API token at apify.com. This parameter is required
     *                                   only when using "username~store-name" format for storeId.
     * @returns {KeyValueStore}
     */
    async getStore(options = {}) {
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
     * Updates key-value store.
     * For more details see
     * [update key-value store endpoint](https://docs.apify.com/api/v2#/reference/key-value-stores/store-object/update-store)
     * @memberof ApifyClient.stores
     * @param {Object} options
     * @param options.token
     * @param {String} options.storeId - Key-value store ID or username~store-name.
     * @param {Object} options.store
     * @returns {KeyValueStore}
     */
    async updateStore(options = {}) {
        const { storeId, store } = options;

        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(store, 'store', 'Object');

        const endpointOptions = {
            url: `/${storeId}`,
            method: 'PUT',
            qs: {},
            body: omit(store, 'id'),
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * Deletes key-value store.
     *
     * For more details see
     * [delete key-value store endpoint](https://docs.apify.com/api/v2#/reference/key-value-stores/store-object/get-store)
     *
     * @memberof ApifyClient.keyValueStores
     * @param {Object} options
     * @param {String} options.storeId - Key-value store ID or username~store-name.
     * @param {String} [options.token] - Your API token at apify.com. This parameter is required
     *                                   only when using "username~store-name" format for storeId.
     * @returns {*}
     */
    async deleteStore(options = {}) {
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
     * For more details see [get record endpoint](https://docs.apify.com/api/v2#/reference/key-value-stores/record/get-record)
     *
     * @memberof ApifyClient.keyValueStores
     * @param {Object} options
     * @param {String} options.storeId - Key-value store ID or username~store-name.
     * @param {String} options.key - Key of the record
     * @param {Boolean} [options.disableBodyParser] - It true, it doesn't parse record's body based on content type.
     * @param {Boolean} [options.disableRedirect] - API by default redirects user to signed record url for faster download.
                                                    If disableRedirect=1 is set then API returns the record value directly.
     * @param {String} [options.token] - Your API token at apify.com. This parameter is required
     *                                   only when using "username~store-name" format for storeId.
     * @returns {KeyValueStoreRecord}
     */
    async getRecord(options = {}) {
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
            headers: {
                'content-type': null,
            },
        };

        if (disableRedirect) endpointOptions.qs.disableRedirect = 1;
        const parseResponse = (response) => {
            const responseBody = response.body;
            const contentType = response.headers['content-type'];
            const body = disableBodyParser ? responseBody : parseBody(responseBody, contentType);

            return {
                contentType,
                body,
            };
        };
        try {
            const response = await this._call(options, endpointOptions);
            return parseResponse(response);
        } catch (err) {
            return catchNotFoundOrThrow(err);
        }
    }

    /**
     * Saves the record into key-value store.
     * Stores a value under a specific key to the key-value store.
     * The value is passed as the `body` option and it is stored with a MIME content type defined by the `contentType` option.
     *
     * For more details see [put record endpoint](https://docs.apify.com/api/v2#/reference/key-value-stores/record/put-record)
     *
     * @memberof ApifyClient.keyValueStores
     * @param {Object} options
     * @param {String} options.storeId - Key-value store ID or username~store-name.
     * @param {String} options.key - Key of the record
     * @param {String} options.contentType - Content type of body
     * @param {string|Buffer} options.body - Body in string or Buffer
     * @param {String} [options.token] - Your API token at apify.com. This parameter is required
     *                                   only when using "username~store-name" format for storeId.
     * @returns {*}
     */
    async putRecord(options = {}) {
        const { storeId, key, body, contentType = 'text/plain; charset=utf-8' } = options;
        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(key, 'key', 'String');
        checkParamOrThrow(contentType, 'contentType', 'String');
        checkParamOrThrow(body, 'body', 'Buffer | String');

        const endpointOptions = {
            url: `/${storeId}/records/${key}`,
            method: 'PUT',
            body,
            json: false,
            headers: {
                'content-type': contentType,
            },
        };

        // Uploading via our servers:
        if (Buffer.byteLength(body) < SIGNED_URL_UPLOAD_MIN_BYTESIZE) return this._call(options, endpointOptions);

        // ... or via signed url directly to S3:
        const directResourceOptions = {
            url: `/${storeId}/records/${key}/direct-upload-url`,
            method: 'GET',
        };
        const response = await this._call(options, directResourceOptions);

        const { signedUrl } = response.data;
        const s3RequestOpts = Object.assign({}, endpointOptions, { url: signedUrl, qs: null });

        return this._call(options, s3RequestOpts);
    }

    /**
     * Removes a record specified by a key from the key-value store.
     *
     * For more details see [delete record endpoint](https://docs.apify.com/api/v2#/reference/key-value-stores/record/delete-record)
     *
     * @memberof ApifyClient.keyValueStores
     * @param {Object} options
     * @param {String} options.storeId - Key-value store ID or username~store-name.
     * @param {String} options.key - Key of the record
     * @param {String} [options.token] - Your API token at apify.com. This parameter is required
     *                                   only when using "username~store-name" format for storeId.
     */
    async deleteRecord(options = {}) {
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
     * Returns a list of objects describing keys of a given key-value store, as well as some information about the values (e.g. size).
     * This endpoint is paginated using exclusiveStartKey and limit parameters -
     * see [Pagination](https://docs.apify.com/api/v2#/introduction/response-structure) for more details.
     *
     * For more details see [get list of keys endpoint](https://docs.apify.com/api/v2#/reference/key-value-stores/key-collection/get-list-of-keys)
     *
     * @memberof ApifyClient.keyValueStores
     * @param {Object} options
     * @param {String} options.storeId - Key-value store ID or username~store-name.
     * @param {String} [options.exclusiveStartKey] - All keys up to this one (including) are skipped from the result.
     * @param {Number} [options.limit] - Number of keys to be returned. Maximum value is 1000
     * @param {String} [options.token] - Your API token at apify.com. This parameter is required
     *                                   only when using "username~store-name" format for storeId.
     * @returns {PaginationList}
     */
    async listKeys(options = {}) {
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
