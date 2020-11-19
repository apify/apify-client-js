const ow = require('ow');
const ResourceClient = require('../base/resource_client');

class DatasetClient extends ResourceClient {
    /**
     * @param {ApiClientOptions} options
     */
    constructor(options) {
        super({
            resourcePath: 'datasets',
            ...options,
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/datasets/dataset/get-dataset
     * @return {Promise<Dataset>}
     */
    async get() {
        return this._get();
    }

    /**
     * https://docs.apify.com/api/v2#/reference/datasets/dataset/update-dataset
     * @param {object} newFields
     * @return {Promise<Dataset>}
     */
    async update(newFields) {
        ow(newFields, ow.object);
        return this._update(newFields);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/datasets/dataset/delete-dataset
     * @return {Promise<void>}
     */
    async delete() {
        return this._delete();
    }

    // TODO - Export to file
    // async export() {
    //     checkParamOrThrow(options.delimiter, 'delimiter', 'Maybe String');
    //     checkParamOrThrow(options.xmlRoot, 'xmlRoot', 'Maybe String');
    //     checkParamOrThrow(options.xmlRow, 'xmlRow', 'Maybe String');
    //     checkParamOrThrow(options.format, 'format', 'Maybe String');
    //     checkParamOrThrow(options.bom, 'bom', 'Maybe Boolean');
    //     checkParamOrThrow(options.attachment, 'attachment', 'Maybe Boolean');
    //     checkParamOrThrow(options.skipHeaderRow, 'skipHeaderRow', 'Maybe Boolean');
    //     Bom is handled special way because its default value for certain formats (CSV) is true which means that we need to make sure
    //     that falsy value is passed in a query string as a zero.
    //     if (options.bom) query.bom = 1;
    //     else if (options.bom === false) query.bom = 0;
    // }

    /**
     * https://docs.apify.com/api/v2#/reference/datasets/item-collection/get-items
     * @param {object} [options]
     * @param {boolean} [options.clean]
     * @param {boolean} [options.desc]
     * @param {string[]} [options.fields]
     * @param {string[]} [options.omit]
     * @param {number} [options.limit]
     * @param {number} [options.offset]
     * @param {boolean} [options.skipEmpty]
     * @param {boolean} [options.skipHidden]
     * @param {string} [options.unwind]
     * @return {Promise<object>}
     */
    async listItems(options = {}) {
        ow(options, ow.object.exactShape({
            clean: ow.optional.boolean,
            desc: ow.optional.boolean,
            fields: ow.optional.array.ofType(ow.string),
            omit: ow.optional.array.ofType(ow.string),
            limit: ow.optional.number,
            offset: ow.optional.number,
            skipEmpty: ow.optional.boolean,
            skipHidden: ow.optional.boolean,
            unwind: ow.optional.string,
        }));

        const response = await this.httpClient.call({
            url: this._url('items'),
            method: 'GET',
            params: this._params(options),
        });
        return this._createPaginationList(response);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/datasets/item-collection/put-items
     * @param {object|string|Array<object|string>} items
     * @return {Promise<void>}
     */
    async pushItems(items) {
        ow(items, ow.any(
            ow.object,
            ow.string,
            ow.array.ofType(ow.any(ow.object, ow.string)),
        ));

        await this.httpClient.call({
            url: this._url('items'),
            method: 'POST',
            data: items,
            params: this._params(),
        });
    }

    /**
     * @param response
     * @return {PaginationList}
     * @private
     */
    _createPaginationList(response) {
        return {
            items: response.data,
            total: Number(response.headers['x-apify-pagination-total']),
            offset: Number(response.headers['x-apify-pagination-offset']),
            count: response.data.length, // because x-apify-pagination-count returns invalid values when hidden/empty items are skipped
            limit: Number(response.headers['x-apify-pagination-limit']), // API returns 999999999999 when no limit is used
        };
    }
}

module.exports = DatasetClient;

/**
 * @typedef {object} PaginationList
 * @property {object[]} items - List of returned objects
 * @property {number} total - Total number of objects
 * @property {number} offset - Number of objects that were skipped
 * @property {number} count - Number of returned objects
 * @property {number} [limit] - Requested limit
 */
