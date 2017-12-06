import _ from 'underscore';
import { checkParamOrThrow, gzipPromise, pluckData, catchNotFoundOrThrow, parseBody } from './utils';

/**
 * Sequential Stores
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
 * const sequentialStores = apifyClient.sequentialStores;
 *
 * const store = await sequentialStores.getOrCreateStore({ storeName: 'my-store' });
 * apifyClient.setOptions({ storeId: store.id });
 * await sequentialStores.putRecord({
 *      data: { foo: 'bar' }
 * });
 * const records = await sequentialStores.getRecords();
 * await sequentialStores.deleteStore();
 * ```
 *
 * Every method can be used as either promise or with callback. If your Node version supports await/async then you can await promise result.
 * ```javascript
 * // Awaited promise
 * try {
 *      const records = await sequentialStores.getRecords();
 *      // Do something with the records ...
 * } catch (err) {
 *      // Do something with error ...
 * }
 *
 * // Promise
 * sequentialStores.getRecords()
 * .then((records) => {
 *      // Do something with records ...
 * })
 * .catch((err) => {
 *      // Do something with error ...
 * });
 *
 * // Callback
 * sequentialStores.getRecords((err, records) => {
 *      // Do something with error or records ...
 * });
 * ```
 * @namespace sequentialStores
 */

export const BASE_PATH = '/v2/sequential-stores';
export const SIGNED_URL_UPLOAD_MIN_BYTESIZE = 1024 * 256;

export default {
    /**
     * Creates store of given name and returns it's object. If store with given name already exists then returns it's object.
     *
     * @memberof ApifyClient.sequentialStores
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.storeName - Custom unique name to easily identify the store in the future.
     * @param callback
     * @returns {SequentialStore}
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
     * Gets list of sequential stores.
     * @descriptions By default, the objects are sorted by the createdAt field in ascending order,
     * therefore you can use pagination to incrementally fetch all stores while new ones are still being created.
     * To sort them in descending order, use desc: 1 parameter.
     * The endpoint supports pagination using limit and offset parameters and it will not return more than 1000 array elements.
     * @memberof ApifyClient.sequentialStores
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
     * Gets sequential store.
     *
     * @memberof ApifyClient.sequentialStores
     * @instance
     * @param {Object} options
     * @param {String} options.storeId - Unique store Id
     * @param callback
     * @returns {SequentialStore}
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
     * Deletes sequential store.
     *
     * @memberof ApifyClient.sequentialStores
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
     * Gets records stored in the sequential store based based on the provided parameters
     *
     * @memberof ApifyClient.sequentialStores
     * @instance
     * @param {Object} options
     * @param {String} options.storeId - Unique store Id
     * @param {String} [options.format='json'] - Format of the records, possible values are: json, csv, xlsx, html, xml and rss.
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=100000] - Maximum number of array elements to return.
     * @param {Number} [options.desc] - If 1 then the objects are sorted by createdAt in descending order.
     * @param {Array} [options.fields] - If provided then returned objects will only contain specified keys
     * @param {String} [options.unwind] - If provided then objects will be unwound based on provided field
     * @param {Boolean} [options.disableBodyParser] - If true then response from API will not be parsed
     * @param {Number} [options.attachment] - If 1 then the response will define the Content-Disposition: attachment header, forcing a web
     *                                        browser to download the file rather than to display it. By default this header is not present.
     * @param {String} [options.delimiter=','] - A delimiter character for CSV files, only used if format=csv. You might need to URL-encode
     *                                           the character (e.g. use %09 for tab or %3B for semicolon).
     * @param {Number} [options.bom] - All responses are encoded in UTF-8 encoding. By default, the csv files are prefixed with the UTF-8 Byte
     *                                 Order Mark (BOM), while json, jsonl, xml, html and rss files are not. If you want to override this default
     *                                 behavior, specify bom=1 query parameter to include the BOM or bom=0 to skip it.
     * @param {String} [options.xmlRoot] - Overrides default root element name of xml output. By default the root element is results.
     * @param {String} [options.xmlRow] - Overrides default element name that wraps each page or page function result object in xml output.
     *                                    By default the element name is page or result based on value of simplified parameter.
     * @param callback
     * @returns {SequentialStoreRecords}
     */
    getRecords: (requestPromise, options) => {
        const {
            baseUrl,
            storeId,
            offset,
            limit,
            fields,
            unwind,
            desc,
            bom,
            attachment,
            delimiter,
            disableBodyParser,
            xmlRoot,
            xmlRow,
        } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(limit, 'limit', 'Maybe Number');
        checkParamOrThrow(offset, 'offset', 'Maybe Number');
        checkParamOrThrow(fields, 'fields', 'Maybe Array');
        checkParamOrThrow(unwind, 'unwind', 'Maybe String');
        checkParamOrThrow(desc, 'desc', 'Maybe Boolean');
        checkParamOrThrow(bom, 'bom', 'Maybe Boolean');
        checkParamOrThrow(attachment, 'attachment', 'Maybe Boolean');
        checkParamOrThrow(delimiter, 'delimiter', 'Maybe String');
        checkParamOrThrow(xmlRoot, 'xmlRoot', 'Maybe String');
        checkParamOrThrow(xmlRow, 'xmlRow', 'Maybe String');

        const requestOpts = {
            url: `${baseUrl}${BASE_PATH}/${storeId}/records`,
            method: 'GET',
            qs: {},
            json: false,
            gzip: true,
            resolveWithResponse: true,
            encoding: null,
        };

        const queryString = _.pick(options,
            'format', 'fields', 'unwind', 'offset',
            'limit', 'desc', 'attachment',
            'delimiter', 'bom', 'xmlRoot', 'xmlRow');

        if (!_.isEmpty(queryString)) {
            if (queryString && queryString.fields) queryString.fields = queryString.fields.join(',');
            requestOpts.qs = queryString;
        }

        const parseResponse = (response) => {
            const responseBody = response.body;
            const contentType = response.headers['content-type'];
            const body = disableBodyParser ? responseBody : parseBody(responseBody, contentType);
            return body;
        };

        return requestPromise(requestOpts)
            .then(parseResponse)
            .catch(catchNotFoundOrThrow);
    },

    /**
     * Saves the record into sequential store.
     *
     * @memberof ApifyClient.sequentialStores
     * @instance
     * @param {Object} options
     * @param {String} options.storeId - Unique store Id
     * @param {Object} options.data - Object to store only objects that can be JSON.stringified are allowed
     * @param callback
     * @returns {*}
     */
    putRecord: (requestPromise, options) => {
        const { baseUrl, storeId, data } = options;
        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(data, 'data', 'Object');

        return gzipPromise(options.promise, JSON.stringify(data))
            .then((gzipedBody) => {
                const requestOpts = {
                    url: `${baseUrl}${BASE_PATH}/${storeId}/records`,
                    method: 'POST',
                    body: gzipedBody,
                    json: false,
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8',
                        'Content-Encoding': 'gzip',
                    },
                };

                // Uploading via our servers:
                return requestPromise(requestOpts);
            });
    },
};
