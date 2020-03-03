import omit from 'lodash/omit';
import pick from 'lodash/pick';

import * as utils from './utils';
import Resource from './resource';

const { checkParamOrThrow, pluckData, catchNotFoundOrThrow, wrapArray, parseDateFields } = utils;

export const RETRIES = 5;
export const BACKOFF_MILLIS = 200;
/**
 * Datasets
 * @memberOf ApifyClient
 * @description
 *
 * This section describes API endpoints to manage Datasets.
 * Dataset is a storage for structured data where each record stored has the same attributes,
 * such as online store products or real estate offers.
 * You can imagine it as a table, where each object is a row and its attributes are columns.
 * Dataset is an append-only storage - you can only add new records to it but you cannot modify or remove existing records.
 * Typically it is used to store crawling results. For more information, see the [Dataset documentation](https://docs.apify.com/storage#dataset).
 * Note that some of the endpoints do not require the authentication token, the calls are authenticated using the hard-to-guess ID of the dataset.
 *
 * For more details see the [Dataset endpoint](https://docs.apify.com/api/v2#/reference/datasets)
 *
 * @namespace datasets
 */

export default class Datasets extends Resource {
    constructor(httpClient) {
        super(httpClient, '/v2/datasets');
    }

    /**
     * Creates dataset of given name and returns its object. If dataset with given name already exists then returns its object.
     *
     * For more details see [create dataset endpoint](https://docs.apify.com/api/v2#/reference/datasets/dataset-collection/create-dataset)
     *
     * @memberof ApifyClient.datasets
     * @param {Object} options
     * @param {String} options.datasetName - Custom unique name to easily identify the dataset in the future.
     * @returns {Dataset}
     */
    async getOrCreateDataset(options) {
        const { datasetName } = options;

        checkParamOrThrow(datasetName, 'datasetName', 'String');

        const qs = {
            name: datasetName,

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
     * Returns a list of datasets owned by a user.
     *
     * By default, the objects are sorted by the createdAt field in ascending order,
     * therefore you can use pagination to incrementally fetch all datasets while new ones are still being created.
     * To sort them in descending order, use `desc: true` option.
     * The endpoint supports pagination using limit and offset parameters and it will not return more than 1000 array elements.
     *
     * For more details see [list datasets endpoint](https://docs.apify.com/api/v2#/reference/datasets/dataset-collection/get-list-of-datasets)
     *
     * @memberof ApifyClient.datasets
     * @param {Object} options
     * @param {Number} [options.offset=0]
     *   Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000]
     *   Maximum number of array elements to return.
     * @param {Boolean} [options.desc]
     *   If `true` then the objects are sorted by the startedAt field in descending order.
     * @param {Boolean} [options.unnamed]
     *   If `true` then also unnamed stores will be returned. By default only named stores are returned.
     * @returns {PaginationList}
     */
    async listDatasets(options = {}) {
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
     * Returns given dataset.
     *
     * For more details see [get dataset endpoint](https://docs.apify.com/api/v2#/reference/datasets/dataset/get-dataset)
     *
     * @memberof ApifyClient.datasets
     * @param {Object} options
     * @param {String} options.datasetId - Unique dataset ID Dataset ID or username~dataset-name;
     * // TODO: Not sure about the token
     * @param {String} [options.token] - Your API token at apify.com. This parameter is required
     *                                   only when using "username~dataset-name" format for datasetId.
     * @returns {Dataset}
     */
    async getDataset(options = {}) {
        const { datasetId } = options;

        checkParamOrThrow(datasetId, 'datasetId', 'String');

        const endpointOptions = {
            url: `/${datasetId}`,
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
     * Updates dataset.
     *
     * For more details see [update dataset endpoint](https://docs.apify.com/api/v2#/reference/datasets/dataset/update-dataset)
     *
     * @memberof ApifyClient.datasets
     * @param {Object} options
     * @param options.token
     * @param {String} options.datasetId - Unique dataset ID
     * @param {Object} options.dataset
     * @returns {Dataset}
     */
    async updateDataset(options = {}) {
        const { datasetId, dataset } = options;

        checkParamOrThrow(datasetId, 'datasetId', 'String');
        checkParamOrThrow(dataset, 'dataset', 'Object');

        const endpointOptions = {
            url: `/${datasetId}`,
            method: 'PUT',
            qs: {},
            body: omit(dataset, 'id'),
        };
        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * Deletes given dataset.
     *
     * For more details see [delete dataset endpoint](https://docs.apify.com/api/v2#/reference/datasets/dataset/delete-dataset)
     *
     * @memberof ApifyClient.datasets
     * @param {Object} options
     * @param {String} options.datasetId - Unique dataset ID
     * @param {String} [options.token] - Your API token at apify.com. This parameter is required
     *                                   only when using "username~dataset-name" format for datasetId.
     * @returns {*}
     */
    async deleteDataset(options = {}) {
        const { datasetId } = options;

        checkParamOrThrow(datasetId, 'datasetId', 'String');

        const endpointOptions = {
            url: `/${datasetId}`,
            method: 'DELETE',
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(response);
    }

    /**
     * Returns data stored in the dataset in a desired format.
     *
     * The format of the response depends on format option.
     *
     * Note that CSV, XLSX and HTML tables are limited to 500 columns and the column names cannot be longer than 200 characters.
     * JSON, XML and RSS formats do not have such restrictions.
     *
     * The top-level fields starting with the # character are considered hidden.
     * These are useful to store debugging information and can be omitted from the output
     * by providing the `skipHidden: true` or `clean: true` query parameters.
     *
     * The generated response supports pagination.
     * The maximum number of items that will be returned in a single API call is limited to 250,000.
     * If you specify `desc: true` query parameter,
     * the results are returned in the reverse order than they were stored (i.e. from newest to oldest items)
     *
     * For more details see [get items endpoint](https://docs.apify.com/api/v2#/reference/datasets/item-collection/get-items)
     *
     * @memberof ApifyClient.datasets
     * @param {Object} options
     * @param {String} options.datasetId
     *   Unique dataset ID
     * @param {String} [options.format='json']
     *   The format parameter can have one of the following values: json, jsonl, xml, html, csv, xlsx and rss.
     * @param {Number} [options.offset=0]
     *   Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=250000]
     *   Maximum number of array elements to return.
     * @param {Boolean} [options.desc=false]
     *   If `true` then the objects are sorted by `createdAt` in descending order.
     *   Otherwise they are sorted in ascending order.
     * @param {Array} [options.fields]
     *   An array of field names that will be included in the result. If omitted, all fields are included in the results.
     * @param {Array} [options.omit]
     *   An array of field names that will be removed from the result. If omitted, all fields are included in the results.
     * @param {String} [options.unwind]
     *   Specifies a name of the field in the result objects that will be used to unwind the resulting objects.
     *   By default, the results are returned as they are.
     * @param {Boolean} [options.disableBodyParser=false]
     *   If `true` then response from API will not be parsed.
     * @param {Boolean} [options.attachment=false]
     *   If `true` then the response will define the `Content-Disposition: attachment` HTTP header, forcing a web
     *   browser to download the file rather than to display it. By default, this header is not present.
     * @param {String} [options.delimiter=',']
     *   A delimiter character for CSV files, only used if `format` is `csv`.
     * @param {Boolean} [options.bom]
     *   All responses are encoded in UTF-8 encoding. By default, the CSV files are prefixed with the UTF-8 Byte
     *   Order Mark (BOM), while JSON, JSONL, XML, HTML and RSS files are not. If you want to override this default
     *   behavior, set `bom` option to `true` to include the BOM, or set `bom` to `false` to skip it.
     * @param {String} [options.xmlRoot='results']
     *   Overrides the default root element name of the XML output. By default, the root element is `results`.
     * @param {String} [options.xmlRow='page']
     *   Overrides the default element name that wraps each page or page function result object in XML output.
     *   By default, the element name is `page` or `result`, depending on the value of the `simplified` option.
     * @param {Boolean} [options.skipHeaderRow=false]
     *   If set to `true` then header row in CSV format is skipped.
     * @param {Boolean} [options.clean=false]
     *   If `true` then the function returns only non-empty items and skips hidden fields (i.e. fields starting with `#` character).
     *   Note that the `clean` parameter is a shortcut for `skipHidden: true` and `skipEmpty: true` options.
     * @param {Boolean} [options.skipHidden=false]
     *   If `true` then the function doesn't return hidden fields (fields starting with "#" character).
     * @param {Boolean} [options.skipEmpty=false]
     *   If `true` then the function doesn't return empty items.
     *   Note that in this case the returned number of items might be lower than limit parameter and pagination must be done using the `limit` value.
     * @param {Boolean} [options.simplified]
     *   If `true` then function applies the `fields: ['url','pageFunctionResult','errorInfo']` and `unwind: 'pageFunctionResult'` options.
     *   This feature is used to emulate simplified results provided by Apify API version 1 used for
     *   the legacy Apify Crawler and it's not recommended to use it in new integrations.
     * @param {Boolean} [options.skipFailedPages]
     *   If `true` then, the all the items with errorInfo property will be skipped from the output.
     *   This feature is here to emulate functionality of Apify API version 1 used for
     *   the legacy Apify Crawler product and it's not recommended to use it in new integrations.
     * @param {String} [options.token]
     *   Your API token at apify.com. This parameter is required
     *   only when using "username~dataset-name" format for datasetId.
     *   TODO: is really necessary?
     * @returns {PaginationList}
     */
    async getItems(options = {}) {
        const {
            datasetId,
            disableBodyParser,
        } = options;

        checkParamOrThrow(datasetId, 'datasetId', 'String');
        checkParamOrThrow(disableBodyParser, 'disableBodyParser', 'Maybe Boolean');

        // Query params:
        checkParamOrThrow(options.token, 'token', 'Maybe String');
        checkParamOrThrow(options.offset, 'offset', 'Maybe Number');
        checkParamOrThrow(options.limit, 'limit', 'Maybe Number');
        checkParamOrThrow(options.fields, 'fields', 'Maybe [String]');
        checkParamOrThrow(options.omit, 'omit', 'Maybe [String]');
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
        checkParamOrThrow(options.simplified, 'simplified', 'Maybe Boolean');
        checkParamOrThrow(options.skipFailedPages, 'skipFailedPages', 'Maybe Boolean');

        // Pick query params.
        const query = pick(options, 'offset', 'limit', 'delimiter', 'unwind', 'xmlRoot', 'xmlRow', 'format', 'token');

        // Add Boolean query params.
        if (options.skipHeaderRow) query.skipHeaderRow = 1;
        if (options.desc) query.desc = 1;
        if (options.attachment) query.attachment = 1;
        if (options.clean) query.clean = 1;
        if (options.skipHidden) query.skipHidden = 1;
        if (options.skipEmpty) query.skipEmpty = 1;
        if (options.simplified) query.simplified = 1;
        if (options.skipFailedPages) query.skipFailedPages = 1;
        // Bom is handled special way because its default value for certain formats (CSV) is true which means that we need to make sure
        // that falsy value is passed in a query string as a zero.
        if (options.bom) query.bom = 1;
        else if (options.bom === false) query.bom = 0;

        if (options.fields) query.fields = options.fields.join(',');
        if (options.omit) query.omit = options.omit.join(',');

        const endpointOptions = {
            url: `/${datasetId}/items`,
            method: 'GET',
            qs: query,
            json: false,
            resolveWithFullResponse: true,
            encoding: null,
            expBackoffMillis: BACKOFF_MILLIS,
            expBackoffMaxRepeats: RETRIES,
        };

        try {
            const response = await this._call(options, endpointOptions);
            return parseDatasetItemsResponse(response, disableBodyParser);
        } catch (err) {
            return catchNotFoundOrThrow(err);
        }
    }

    /**
     * Appends an item or an array of items to the end of the dataset.
     * The `data` option is a JSON object or a JSON array of objects to save into the dataset.
     *
     * **IMPORTANT**: The limit of request payload size for the dataset is 5 MB.
     * If the array exceeds the size, you'll need to split it into a number of smaller arrays.
     *
     * For more details see [put items endpoint](https://docs.apify.com/api/v2#/reference/datasets/item-collection/put-items)
     *
     * @memberof ApifyClient.datasets
     * @param {Object} options
     * @param {String} options.datasetId - Unique dataset ID
     * @param {Object | Array | String} options.data - Object, Array of objects or a String. String must be a valid JSON.
     *                                                 Arrays and Objects must be JSON.stringifiable.
     * @param {String} [options.token] - Your API token at apify.com. This parameter is required
     *                                   only when using "username~dataset-name" format for datasetId.
     * TODO: is really necessary?
     * @returns {*}
     */
    async putItems(options = {}) {
        const { datasetId, data } = options;
        checkParamOrThrow(datasetId, 'datasetId', 'String');
        checkParamOrThrow(data, 'data', 'Object | Array | String');

        const endpointOptions = {
            url: `/${datasetId}/items`,
            method: 'POST',
            body: data,
            json: false,
        };
        const response = await this._call(options, endpointOptions);
        return parseDateFields(response);
    }
}

export function parseDatasetItemsResponse(response, disableBodyParser) {
    const contentType = response.headers['content-type'];
    const wrappedItems = wrapArray(response);

    if (!disableBodyParser) wrappedItems.items = utils.parseBody(wrappedItems.items, contentType);

    return wrappedItems;
}
