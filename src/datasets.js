import _ from 'underscore';
import { retryWithExpBackoff, RetryableError } from 'apify-shared/exponential_backoff';
import {
    checkParamOrThrow,
    gzipPromise,
    pluckData,
    catchNotFoundOrThrow,
    wrapArray,
    parseDateFields,
} from './utils'; // eslint-disable-line import/no-duplicates
import * as Utils from './utils'; // eslint-disable-line import/no-duplicates


/**
 * Datasets
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
 * const datasets = apifyClient.datasets;
 *
 * // Get dataset with name 'my-dataset' and set it as default
 * // to be used in following commands.
 * const dataset = await datasets.getOrCreateDataset({
 *     datasetName: 'my-dataset',
 * });
 * apifyClient.setOptions({ datasetId: dataset.id });
 *
 * // Save some object and array of objects to dataset.
 * await datasets.putItems({
 *      data: { foo: 'bar' }
 * });
 * await datasets.putItems({
 *      data: [{ foo: 'hotel' }, { foo: 'restaurant' }],
 * });
 *
 * // Get items from dataset and delete it.
 * const paginationList = await datasets.getItems();
 * const items = paginationList.items;
 * await datasets.deleteDataset();
 * ```
 *
 * Every method can be used as either promise or with callback. If your Node version supports await/async then you can await promise result.
 * ```javascript
 * // Awaited promise
 * try {
 *      const items = await datasets.getItems();
 *      // Do something with the items ...
 * } catch (err) {
 *      // Do something with error ...
 * }
 *
 * // Promise
 * datasets.getItems()
 * .then((paginationList) => {
 *      console.log(paginationList.items)
 *      // Do something with items ...
 * })
 * .catch((err) => {
 *      // Do something with error ...
 * });
 *
 * // Callback
 * datasets.getItems((err, paginationList) => {
 *      console.log(paginationList.items)
 *      // Do something with error or items ...
 * });
 * ```
 * @namespace datasets
 */

export const BASE_PATH = '/v2/datasets';
export const SIGNED_URL_UPLOAD_MIN_BYTESIZE = 1024 * 256;

export default {
    /**
     * Creates dataset of given name and returns it's object. If data with given name already exists then returns it's object.
     *
     * @memberof ApifyClient.datasets
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.datasetName - Custom unique name to easily identify the dataset in the future.
     * @param callback
     * @returns {Dataset}
     */
    getOrCreateDataset: (requestPromise, options) => {
        const { baseUrl, token, datasetName } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(datasetName, 'datasetName', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}`,
            json: true,
            method: 'POST',
            qs: { name: datasetName, token },
        })
            .then(pluckData)
            .then(parseDateFields);
    },

    /**
     * Returns a list of datasets owned by a user.
     *
     * By default, the objects are sorted by the createdAt field in ascending order,
     * therefore you can use pagination to incrementally fetch all datasets while new ones are still being created.
     * To sort them in descending order, use `desc: true` option.
     * The endpoint supports pagination using limit and offset parameters and it will not return more than 1000 array elements.
     *
     * @memberof ApifyClient.datasets
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {Number} [options.offset=0]
     *   Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000]
     *   Maximum number of array elements to return.
     * @param {Boolean} [options.desc]
     *   If `true` then the objects are sorted by the startedAt field in descending order.
     * @param {Boolean} [options.unnamed]
     *   If `true` then also unnamed stores will be returned. By default only named stores are returned.
     * @param callback
     * @returns {PaginationList}
     */
    listDatasets: (requestPromise, options) => {
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
     * Returns given dataset.
     *
     * @memberof ApifyClient.datasets
     * @instance
     * @param {Object} options
     * @param {String} options.datasetId - Unique dataset ID
     * @param {String} [options.token] - Your API token at apify.com. This parameter is required
     *                                   only when using "username~dataset-name" format for datasetId.
     * @param callback
     * @returns {Dataset}
     */
    getDataset: (requestPromise, options) => {
        const { baseUrl, datasetId, token } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(datasetId, 'datasetId', 'String');
        checkParamOrThrow(token, 'token', 'Maybe String');

        const query = {};
        if (token) query.token = token;

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${datasetId}`,
            json: true,
            method: 'GET',
            qs: query,
        })
            .then(pluckData)
            .then(parseDateFields)
            .catch(catchNotFoundOrThrow);
    },

    /**
     * Deletes given dataset.
     *
     * @memberof ApifyClient.datasets
     * @instance
     * @param {Object} options
     * @param {String} options.datasetId - Unique dataset ID
     * @param {String} [options.token] - Your API token at apify.com. This parameter is required
     *                                   only when using "username~dataset-name" format for datasetId.
     * @param callback
     * @returns {*}
     */
    deleteDataset: (requestPromise, options) => {
        const { baseUrl, datasetId, token } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(datasetId, 'datasetId', 'String');
        checkParamOrThrow(token, 'token', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${datasetId}`,
            json: true,
            method: 'DELETE',
            qs: { token },
        });
    },

    /**
     * Returns items in the dataset based on the provided parameters
     *
     * @memberof ApifyClient.datasets
     * @instance
     * @param {Object} options
     * @param {String} options.datasetId
     *   Unique dataset ID
     * @param {String} [options.format='json']
     *   Format of the items, possible values are: json, csv, xlsx, html, xml and rss.
     * @param {Number} [options.offset=0]
     *   Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=100000]
     *   Maximum number of array elements to return.
     * @param {Number} [options.desc]
     *   If `true` then the objects are sorted by `createdAt` in descending order.
     *   Otherwise they are sorted in ascending order.
     * @param {Array} [options.fields]
     *   An array of field names that will be included in the result. If omitted, all fields are included in the results.
     * @param {String} [options.unwind]
     *   Specifies a name of the field in the result objects that will be used to unwind the resulting objects.
     *   By default, the results are returned as they are.
     * @param {Boolean} [options.disableBodyParser]
     *   If `true` then response from API will not be parsed
     * @param {Number} [options.attachment]
     *   If `true` then the response will define the `Content-Disposition: attachment` HTTP header, forcing a web
     *   browser to download the file rather than to display it. By default, this header is not present.
     * @param {String} [options.delimiter=',']
     *   A delimiter character for CSV files, only used if `format` is `csv`.
     *   You might need to URL-encode the character (e.g. use `%09` for tab or `%3B` for semicolon).
     * @param {Number} [options.bom]
     *   All responses are encoded in UTF-8 encoding. By default, the CSV files are prefixed with the UTF-8 Byte
     *   Order Mark (BOM), while JSON, JSONL, XML, HTML and RSS files are not. If you want to override this default
     *   behavior, set `bom` option to `true` to include the BOM, or set `bom` to `false` to skip it.
     * @param {String} [options.xmlRoot]
     *   Overrides the default root element name of the XML output. By default, the root element is `results`.
     * @param {String} [options.xmlRow]
     *   Overrides the default element name that wraps each page or page function result object in XML output.
     *   By default, the element name is `page` or `result`, depending on the value of the `simplified` option.
     * @param {Boolean} [options.skipHeaderRow]
     *   If set to `true` then header row in csv format is skipped.
     * @param {Boolean} [options.clean]
     *   If `true` then the function returns only non-empty items and skips hidden fields (i.e. fields starting with `#` character).
     *   Note that the `clean` parameter is a shortcut for `skipHidden: true` and `skipEmpty: true` options.
     * @param {Boolean} [options.skipHidden]
     *   If `true` then the function doesn't return hidden fields (fields starting with "#" character).
     * @param {Boolean} [options.skipEmpty]
     *   If `true` then the function doesn't return empty items.
     *   Note that in this case the returned number of items might be lower than limit parameter and pagination must be done using the `limit` value.
     * @param {String} [options.token]
     *   Your API token at apify.com. This parameter is required
     *   only when using "username~dataset-name" format for datasetId.
     * @param callback
     * @returns {PaginationList}
     */
    getItems: (requestPromise, options) => {
        const {
            baseUrl,
            datasetId,
            disableBodyParser,
        } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(datasetId, 'datasetId', 'String');
        checkParamOrThrow(disableBodyParser, 'disableBodyParser', 'Maybe Boolean');

        // Query params:
        checkParamOrThrow(options.token, 'token', 'Maybe String');
        checkParamOrThrow(options.offset, 'offset', 'Maybe Number');
        checkParamOrThrow(options.limit, 'limit', 'Maybe Number');
        checkParamOrThrow(options.fields, 'fields', 'Maybe [String]');
        checkParamOrThrow(options.omit, 'omit', 'Maybe Array');
        checkParamOrThrow(options.delimiter, 'delimiter', 'Maybe String');
        checkParamOrThrow(options.unwind, 'unwind', 'Maybe String');
        checkParamOrThrow(options.xmlRoot, 'xmlRoot', 'Maybe String');
        checkParamOrThrow(options.xmlRow, 'xmlRow', 'Maybe String');
        checkParamOrThrow(options.format, 'format', 'Maybe String');

        // Booleans query params:
        checkParamOrThrow(options.desc, 'desc', 'Maybe Boolean');
        checkParamOrThrow(options.bom, 'bom', 'Maybe Boolean');
        checkParamOrThrow(options.attachment, 'attachment', 'Maybe Boolean');
        checkParamOrThrow(options.skipHeaderRow, 'skipHeaderRow', 'Maybe Boolean');
        checkParamOrThrow(options.clean, 'clean', 'Maybe Boolean');
        checkParamOrThrow(options.skipHidden, 'skipHidden', 'Maybe Boolean');
        checkParamOrThrow(options.skipEmpty, 'skipEmpty', 'Maybe Boolean');

        // Pick query params.
        const query = _.pick(options, 'offset', 'limit', 'fields', 'omit', 'delimiter', 'unwind', 'xmlRoot', 'xmlRow', 'format', 'token');

        // Add Boolean query params.
        if (options.skipHeaderRow) query.skipHeaderRow = 1;
        if (options.desc) query.desc = 1;
        if (options.attachment) query.attachment = 1;
        if (options.clean) query.clean = 1;
        if (options.skipHidden) query.skipHidden = 1;
        if (options.skipEmpty) query.skipEmpty = 1;
        // Bom is handled special way because its default value for certain formats (CSV) is true which means that we need to make sure
        // that falsy value is passed in a query string as a zero.
        if (options.bom) query.bom = 1;
        else if (options.bom === false) query.bom = 0;

        if (query.fields) query.fields = query.fields.join(',');
        const requestOpts = {
            url: `${baseUrl}${BASE_PATH}/${datasetId}/items`,
            method: 'GET',
            qs: query,
            json: false,
            gzip: true,
            resolveWithFullResponse: true,
            encoding: null,
        };

        return retryWithExpBackoff({
            func: () => getDatasetItems(requestPromise, requestOpts, disableBodyParser),
            expBackoffMillis: 200,
            expBackoffMaxRepeats: 5,
        });
    },

    /**
     * Saves the object or an array of objects into dataset.
     *
     * @memberof ApifyClient.datasets
     * @instance
     * @param {Object} options
     * @param {String} options.datasetId - Unique dataset ID
     * @param {Object | Array | String} options.data - Object, Array of objects or a String. String must be a valid JSON.
     *                                                 Arrays and Objects must be JSON.stringifiable.
     * @param {String} [options.token] - Your API token at apify.com. This parameter is required
     *                                   only when using "username~dataset-name" format for datasetId.
     * @param callback
     * @returns {*}
     */
    putItems: (requestPromise, options) => {
        const { baseUrl, datasetId, data, token } = options;
        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(datasetId, 'datasetId', 'String');
        checkParamOrThrow(data, 'data', 'Object | Array | String');
        checkParamOrThrow(token, 'token', 'String');

        const payload = typeof data === 'string' ? data : JSON.stringify(data);

        return gzipPromise(payload)
            .then((gzipedBody) => {
                const requestOpts = {
                    url: `${baseUrl}${BASE_PATH}/${datasetId}/items`,
                    method: 'POST',
                    body: gzipedBody,
                    json: false,
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8',
                        'Content-Encoding': 'gzip',
                    },
                    qs: { token },
                };

                // Uploading via our servers:
                return requestPromise(requestOpts);
            });
    },
};

export function parseDatasetItemsResponse(response, disableBodyParser) {
    const contentType = response.headers['content-type'];
    const wrappedItems = wrapArray(response);
    try {
        if (!disableBodyParser) wrappedItems.items = Utils.parseBody(wrappedItems.items, contentType);
    } catch (e) {
        if (e.message.includes('Unexpected end of JSON input')) {
            // Getting invalid JSON error should be retried, because it is similar to getting 500 response code.
            throw new RetryableError(e);
        }
        throw e;
    }
    return wrappedItems;
}

export async function getDatasetItems(requestPromise, requestOpts, disableBodyParser) {
    try {
        const response = await requestPromise(requestOpts);
        return parseDatasetItemsResponse(response, disableBodyParser);
    } catch (err) {
        return catchNotFoundOrThrow(err);
    }
}
