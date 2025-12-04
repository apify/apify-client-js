import ow from 'ow';

import type { STORAGE_GENERAL_ACCESS } from '@apify/consts';
import { createStorageContentSignatureAsync } from '@apify/utilities';

import type { ApifyApiError } from '../apify_api_error';
import type { ApiClientSubResourceOptions } from '../base/api_client';
import {
    DEFAULT_TIMEOUT_MILLIS,
    MEDIUM_TIMEOUT_MILLIS,
    ResourceClient,
    SMALL_TIMEOUT_MILLIS,
} from '../base/resource_client';
import type { ApifyRequestConfig, ApifyResponse } from '../http_client';
import type { PaginatedIterator, PaginatedList, PaginationOptions } from '../utils';
import { applyQueryParamsToUrl, cast, catchNotFoundOrThrow, pluckData } from '../utils';

/**
 * Client for managing a specific Dataset.
 *
 * Datasets store structured data results from Actor runs. This client provides methods to push items,
 * list and retrieve items, download items in various formats (JSON, CSV, Excel, etc.), and manage
 * the dataset.
 *
 * @template Data - Type of items stored in the dataset
 *
 * @example
 * ```javascript
 * const client = new ApifyClient({ token: 'my-token' });
 * const datasetClient = client.dataset('my-dataset-id');
 *
 * // Push items to the dataset
 * await datasetClient.pushItems([
 *   { url: 'https://example.com', title: 'Example' },
 *   { url: 'https://test.com', title: 'Test' }
 * ]);
 *
 * // List all items
 * const { items } = await datasetClient.listItems();
 *
 * // Download items as CSV
 * const buffer = await datasetClient.downloadItems('csv');
 * ```
 *
 * @see https://docs.apify.com/platform/storage/dataset
 */
export class DatasetClient<
    Data extends Record<string | number, any> = Record<string | number, unknown>,
> extends ResourceClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'datasets',
            ...options,
        });
    }

    /**
     * Gets the dataset object from the Apify API.
     *
     * @returns The Dataset object, or `undefined` if it does not exist
     * @see https://docs.apify.com/api/v2/dataset-get
     */
    async get(): Promise<Dataset | undefined> {
        return this._get({}, SMALL_TIMEOUT_MILLIS);
    }

    /**
     * Updates the dataset with specified fields.
     *
     * @param newFields - Fields to update in the dataset
     * @returns The updated Dataset object
     * @see https://docs.apify.com/api/v2/dataset-put
     */
    async update(newFields: DatasetClientUpdateOptions): Promise<Dataset> {
        ow(newFields, ow.object);

        return this._update(newFields, SMALL_TIMEOUT_MILLIS);
    }

    /**
     * Deletes the dataset.
     *
     * @see https://docs.apify.com/api/v2/dataset-delete
     */
    async delete(): Promise<void> {
        return this._delete(SMALL_TIMEOUT_MILLIS);
    }

    /**
     * Lists items in the dataset.
     *
     * Returns a paginated list of dataset items. You can use pagination parameters to retrieve
     * specific subsets of items, and various filtering and formatting options to customize
     * the output.
     *
     * @param options - Options for listing items
     * @param options.limit - Maximum number of items to return. Default is all items.
     * @param options.chunkSize - Maximum number of items returned in one API response. Relevant in the context of asyncIterator.
     * @param options.offset - Number of items to skip from the beginning. Default is 0.
     * @param options.desc - If `true`, items are returned in descending order (newest first). Default is `false`.
     * @param options.fields - Array of field names to include in the results. Omits all other fields.
     * @param options.omit - Array of field names to exclude from the results.
     * @param options.clean - If `true`, returns only non-empty items and skips hidden fields. Default is `false`.
     * @param options.skipEmpty - If `true`, skips empty items. Default is `false`.
     * @param options.skipHidden - If `true`, skips hidden fields (fields starting with `#`). Default is `false`.
     * @param options.flatten - Array of field names to flatten. Nested objects are converted to dot notation (e.g., `obj.field`).
     * @param options.unwind - Field name or array of field names to unwind. Each array value creates a separate item.
     * @param options.view - Name of a predefined view to use for field selection.
     * @returns A paginated list with `items`, `total` count, `offset`, `count`, and `limit`
     * @see https://docs.apify.com/api/v2/dataset-items-get
     *
     * @example
     * ```javascript
     * // Get first 100 items
     * const { items, total } = await client.dataset('my-dataset').listItems({ limit: 100 });
     * console.log(`Retrieved ${items.length} of ${total} total items`);
     *
     * // Get items with specific fields only
     * const { items } = await client.dataset('my-dataset').listItems({
     *   fields: ['url', 'title'],
     *   skipEmpty: true,
     *   limit: 50
     * });
     *
     * // Get items in descending order with pagination
     * const { items } = await client.dataset('my-dataset').listItems({
     *   desc: true,
     *   offset: 100,
     *   limit: 50
     * });
     * ```
     */
    listItems(options: DatasetClientListItemOptions = {}): PaginatedIterator<Data> {
        ow(
            options,
            ow.object.exactShape({
                clean: ow.optional.boolean,
                desc: ow.optional.boolean,
                flatten: ow.optional.array.ofType(ow.string),
                fields: ow.optional.array.ofType(ow.string),
                omit: ow.optional.array.ofType(ow.string),
                limit: ow.optional.number.not.negative,
                offset: ow.optional.number.not.negative,
                chunkSize: ow.optional.number.positive,
                skipEmpty: ow.optional.boolean,
                skipHidden: ow.optional.boolean,
                unwind: ow.optional.any(ow.string, ow.array.ofType(ow.string)),
                view: ow.optional.string,
                signature: ow.optional.string,
            }),
        );

        const listItems = async (
            datasetListOptions: DatasetClientListItemOptions = {},
        ): Promise<PaginatedList<Data>> => {
            const response = await this.httpClient.call({
                url: this._url('items'),
                method: 'GET',
                params: this._params(datasetListOptions),
                timeout: DEFAULT_TIMEOUT_MILLIS,
            });

            return this._createPaginationList(response, datasetListOptions.desc ?? false);
        };

        return this._listPaginatedFromCallback(listItems.bind(this), options);
    }

    /**
     * Downloads dataset items in a specific format.
     *
     * Unlike {@link listItems} which returns a {@link PaginatedList} with an array of individual
     * dataset items, this method returns the items serialized to the provided format
     * (JSON, CSV, Excel, etc.) as a Buffer. Useful for exporting data for further processing.
     *
     * @param format - Output format: `'json'`, `'jsonl'`, `'csv'`, `'xlsx'`, `'xml'`, `'rss'`, or `'html'`
     * @param options - Download and formatting options (extends all options from {@link listItems})
     * @param options.attachment - If `true`, the response will have `Content-Disposition: attachment` header.
     * @param options.bom - If `true`, adds UTF-8 BOM to the beginning of the file (useful for Excel compatibility).
     * @param options.delimiter - CSV delimiter character. Default is `,` (comma).
     * @param options.skipHeaderRow - If `true`, CSV export will not include the header row with field names.
     * @param options.xmlRoot - Name of the root XML element. Default is `'items'`.
     * @param options.xmlRow - Name of the XML element for each item. Default is `'item'`.
     * @param options.fields - Array of field names to include in the export.
     * @param options.omit - Array of field names to exclude from the export.
     * @returns Buffer containing the serialized data in the specified format
     * @see https://docs.apify.com/api/v2/dataset-items-get
     *
     * @example
     * ```javascript
     * // Download as CSV with BOM for Excel compatibility
     * const csvBuffer = await client.dataset('my-dataset').downloadItems('csv', { bom: true });
     * require('fs').writeFileSync('output.csv', csvBuffer);
     *
     * // Download as Excel with custom options
     * const xlsxBuffer = await client.dataset('my-dataset').downloadItems('xlsx', {
     *   fields: ['url', 'title', 'price'],
     *   skipEmpty: true,
     *   limit: 1000
     * });
     *
     * // Download as XML with custom element names
     * const xmlBuffer = await client.dataset('my-dataset').downloadItems('xml', {
     *   xmlRoot: 'products',
     *   xmlRow: 'product'
     * });
     * ```
     */
    async downloadItems(format: DownloadItemsFormat, options: DatasetClientDownloadItemsOptions = {}): Promise<Buffer> {
        ow(format, ow.string.oneOf(validItemFormats));
        ow(
            options,
            ow.object.exactShape({
                attachment: ow.optional.boolean,
                bom: ow.optional.boolean,
                clean: ow.optional.boolean,
                delimiter: ow.optional.string,
                desc: ow.optional.boolean,
                flatten: ow.optional.array.ofType(ow.string),
                fields: ow.optional.array.ofType(ow.string),
                omit: ow.optional.array.ofType(ow.string),
                limit: ow.optional.number.not.negative,
                offset: ow.optional.number.not.negative,
                skipEmpty: ow.optional.boolean,
                skipHeaderRow: ow.optional.boolean,
                skipHidden: ow.optional.boolean,
                unwind: ow.any(ow.optional.string, ow.optional.array.ofType(ow.string)),
                view: ow.optional.string,
                xmlRoot: ow.optional.string,
                xmlRow: ow.optional.string,
                signature: ow.optional.string,
            }),
        );

        const { data } = await this.httpClient.call({
            url: this._url('items'),
            method: 'GET',
            params: this._params({
                format,
                ...options,
            }),
            forceBuffer: true,
            timeout: DEFAULT_TIMEOUT_MILLIS,
        });

        return cast(data);
    }

    /**
     * Stores one or more items into the dataset.
     *
     * Items can be objects, strings, or arrays thereof. Each item will be stored as a separate
     * record in the dataset. Objects are automatically serialized to JSON. If you provide an array,
     * all items will be stored in order. This method is idempotent - calling it multiple times
     * with the same data will not create duplicates, but will append items each time.
     *
     * @param items - A single item (object or string) or an array of items to store.
     *                Objects are automatically stringified to JSON. Strings are stored as-is.
     * @see https://docs.apify.com/api/v2/dataset-items-post
     *
     * @example
     * ```javascript
     * // Store a single object
     * await client.dataset('my-dataset').pushItems({
     *   url: 'https://example.com',
     *   title: 'Example Page',
     *   extractedAt: new Date()
     * });
     *
     * // Store multiple items at once
     * await client.dataset('my-dataset').pushItems([
     *   { url: 'https://example.com', title: 'Example' },
     *   { url: 'https://test.com', title: 'Test' },
     *   { url: 'https://demo.com', title: 'Demo' }
     * ]);
     *
     * // Store string items
     * await client.dataset('my-dataset').pushItems(['item1', 'item2', 'item3']);
     * ```
     */
    async pushItems(items: Data | Data[] | string | string[]): Promise<void> {
        ow(items, ow.any(ow.object, ow.string, ow.array.ofType(ow.any(ow.object, ow.string))));

        await this.httpClient.call({
            url: this._url('items'),
            method: 'POST',
            headers: {
                'content-type': 'application/json; charset=utf-8',
            },
            data: items,
            params: this._params(),
            doNotRetryTimeouts: true, // see timeout handling in http-client
            timeout: MEDIUM_TIMEOUT_MILLIS,
        });
    }

    /**
     * Gets statistical information about the dataset.
     *
     * Returns statistics for each field in the dataset, including information about
     * data types, null counts, and value ranges.
     *
     * @returns Dataset statistics, or `undefined` if not available
     * @see https://docs.apify.com/api/v2/dataset-statistics-get
     */
    async getStatistics(): Promise<DatasetStatistics | undefined> {
        const requestOpts: ApifyRequestConfig = {
            url: this._url('statistics'),
            method: 'GET',
            params: this._params(),
            timeout: SMALL_TIMEOUT_MILLIS,
        };
        try {
            const response = await this.httpClient.call(requestOpts);
            return cast(pluckData(response.data));
        } catch (err) {
            catchNotFoundOrThrow(err as ApifyApiError);
        }
        return undefined;
    }

    /**
     * Generates a public URL for accessing dataset items.
     *
     * If the client has permission to access the dataset's URL signing key,
     * the URL will include a cryptographic signature allowing access without authentication.
     * This is useful for sharing dataset results with external services or users.
     *
     * @param options - URL generation options (extends all options from {@link listItems})
     * @param options.expiresInSecs - Number of seconds until the signed URL expires. If omitted, the URL never expires.
     * @param options.fields - Array of field names to include in the response.
     * @param options.limit - Maximum number of items to return.
     * @param options.offset - Number of items to skip.
     * @returns A public URL string for accessing the dataset items
     *
     * @example
     * ```javascript
     * // Create a URL that expires in 1 hour with specific fields
     * const url = await client.dataset('my-dataset').createItemsPublicUrl({
     *   expiresInSecs: 3600,
     *   fields: ['url', 'title'],
     *   limit: 100
     * });
     * console.log(`Share this URL: ${url}`);
     *
     * // Create a permanent public URL for clean items only
     * const url = await client.dataset('my-dataset').createItemsPublicUrl({
     *   clean: true,
     *   skipEmpty: true
     * });
     * ```
     */
    async createItemsPublicUrl(options: DatasetClientCreateItemsUrlOptions = {}): Promise<string> {
        ow(
            options,
            ow.object.exactShape({
                clean: ow.optional.boolean,
                desc: ow.optional.boolean,
                flatten: ow.optional.array.ofType(ow.string),
                fields: ow.optional.array.ofType(ow.string),
                omit: ow.optional.array.ofType(ow.string),
                limit: ow.optional.number.not.negative,
                offset: ow.optional.number.not.negative,
                skipEmpty: ow.optional.boolean,
                skipHidden: ow.optional.boolean,
                unwind: ow.optional.any(ow.string, ow.array.ofType(ow.string)),
                view: ow.optional.string,
                expiresInSecs: ow.optional.number,
            }),
        );

        const dataset = await this.get();

        const { expiresInSecs, ...queryOptions } = options;

        let createdItemsPublicUrl = new URL(this._publicUrl('items'));

        if (dataset?.urlSigningSecretKey) {
            const signature = await createStorageContentSignatureAsync({
                resourceId: dataset.id,
                urlSigningSecretKey: dataset.urlSigningSecretKey,
                expiresInMillis: expiresInSecs ? expiresInSecs * 1000 : undefined,
            });
            createdItemsPublicUrl.searchParams.set('signature', signature);
        }

        createdItemsPublicUrl = applyQueryParamsToUrl(createdItemsPublicUrl, queryOptions);

        return createdItemsPublicUrl.toString();
    }

    private _createPaginationList(response: ApifyResponse, userProvidedDesc: boolean): PaginatedList<Data> {
        return {
            items: response.data,
            total: Number(response.headers['x-apify-pagination-total']),
            offset: Number(response.headers['x-apify-pagination-offset']),
            count: response.data.length, // because x-apify-pagination-count returns invalid values when hidden/empty items are skipped
            limit: Number(response.headers['x-apify-pagination-limit']), // API returns 999999999999 when no limit is used
            // TODO: Replace this once https://github.com/apify/apify-core/issues/3503 is solved
            desc: JSON.parse(response.headers['x-apify-pagination-desc'] ?? userProvidedDesc),
        };
    }
}

/**
 * Represents a dataset storage on the Apify platform.
 *
 * Datasets store structured data as a sequence of items (records). Each item is a JSON object.
 * Datasets are useful for storing results from web scraping, crawling, or data processing tasks.
 */
export interface Dataset {
    id: string;
    name?: string;
    title?: string;
    userId: string;
    username?: string;
    createdAt: Date;
    modifiedAt: Date;
    accessedAt: Date;
    itemCount: number;
    cleanItemCount: number;
    actId?: string;
    actRunId?: string;
    stats: DatasetStats;
    fields: string[];
    generalAccess?: STORAGE_GENERAL_ACCESS | null;
    urlSigningSecretKey?: string | null;
    itemsPublicUrl: string;
}

/**
 * Statistics about dataset usage and storage.
 */
export interface DatasetStats {
    readCount?: number;
    writeCount?: number;
    deleteCount?: number;
    storageBytes?: number;
}

/**
 * Options for updating a dataset.
 */
export interface DatasetClientUpdateOptions {
    name?: string | null;
    title?: string;
    generalAccess?: STORAGE_GENERAL_ACCESS | null;
}

/**
 * Options for listing items from a dataset.
 *
 * Provides various filtering, pagination, and transformation options to customize
 * the output format and content of retrieved items.
 */
export interface DatasetClientListItemOptions extends PaginationOptions {
    clean?: boolean;
    desc?: boolean;
    flatten?: string[];
    fields?: string[];
    omit?: string[];
    skipEmpty?: boolean;
    skipHidden?: boolean;
    unwind?: string | string[]; // TODO: when doing a breaking change release, change to string[] only
    view?: string;
    signature?: string;
}

/**
 * Options for creating a public URL to access dataset items.
 *
 * Extends {@link DatasetClientListItemOptions} with URL expiration control.
 */
export interface DatasetClientCreateItemsUrlOptions extends DatasetClientListItemOptions {
    expiresInSecs?: number;
}

/**
 * Supported formats for downloading dataset items.
 */
export enum DownloadItemsFormat {
    JSON = 'json',
    JSONL = 'jsonl',
    XML = 'xml',
    HTML = 'html',
    CSV = 'csv',
    XLSX = 'xlsx',
    RSS = 'rss',
}

const validItemFormats = [...new Set(Object.values(DownloadItemsFormat).map((item) => item.toLowerCase()))];

/**
 * Options for downloading dataset items in a specific format.
 *
 * Extends {@link DatasetClientListItemOptions} with format-specific options.
 */
export interface DatasetClientDownloadItemsOptions extends DatasetClientListItemOptions {
    attachment?: boolean;
    bom?: boolean;
    delimiter?: string;
    skipHeaderRow?: boolean;
    xmlRoot?: string;
    xmlRow?: string;
}

/**
 * Statistical information about dataset fields.
 *
 * Provides insights into the data structure and content of the dataset.
 */
export interface DatasetStatistics {
    fieldStatistics: Record<string, FieldStatistics>;
}

/**
 * Statistics for a single field in a dataset.
 */
export interface FieldStatistics {
    min?: number;
    max?: number;
    nullCount?: number;
    emptyCount?: number;
}
