import ow from 'ow';

import type { STORAGE_GENERAL_ACCESS } from '@apify/consts';
import { createStorageContentSignature } from '@apify/utilities';

import type { ApifyApiError } from '../apify_api_error';
import type { ApiClientSubResourceOptions } from '../base/api_client';
import {
    DEFAULT_TIMEOUT_MILLIS,
    MEDIUM_TIMEOUT_MILLIS,
    ResourceClient,
    SMALL_TIMEOUT_MILLIS,
} from '../base/resource_client';
import type { ApifyRequestConfig, ApifyResponse } from '../http_client';
import type { PaginatedList } from '../utils';
import { applyQueryParamsToUrl, cast, catchNotFoundOrThrow, pluckData } from '../utils';

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
     * https://docs.apify.com/api/v2#/reference/datasets/dataset/get-dataset
     */
    async get(): Promise<Dataset | undefined> {
        return this._get({}, SMALL_TIMEOUT_MILLIS);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/datasets/dataset/update-dataset
     */
    async update(newFields: DatasetClientUpdateOptions): Promise<Dataset> {
        ow(newFields, ow.object);

        return this._update(newFields, SMALL_TIMEOUT_MILLIS);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/datasets/dataset/delete-dataset
     */
    async delete(): Promise<void> {
        return this._delete(SMALL_TIMEOUT_MILLIS);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/datasets/item-collection/get-items
     */
    async listItems(options: DatasetClientListItemOptions = {}): Promise<PaginatedList<Data>> {
        ow(
            options,
            ow.object.exactShape({
                clean: ow.optional.boolean,
                desc: ow.optional.boolean,
                flatten: ow.optional.array.ofType(ow.string),
                fields: ow.optional.array.ofType(ow.string),
                omit: ow.optional.array.ofType(ow.string),
                limit: ow.optional.number,
                offset: ow.optional.number,
                skipEmpty: ow.optional.boolean,
                skipHidden: ow.optional.boolean,
                unwind: ow.optional.any(ow.string, ow.array.ofType(ow.string)),
                view: ow.optional.string,
            }),
        );

        const response = await this.httpClient.call({
            url: this._url('items'),
            method: 'GET',
            params: this._params(options),
            timeout: DEFAULT_TIMEOUT_MILLIS,
        });

        return this._createPaginationList(response, options.desc ?? false);
    }

    /**
     * Unlike `listItems` which returns a {@link PaginationList} with an array of individual
     * dataset items, `downloadItems` returns the items serialized to the provided format.
     * https://docs.apify.com/api/v2#/reference/datasets/item-collection/get-items
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
                limit: ow.optional.number,
                offset: ow.optional.number,
                skipEmpty: ow.optional.boolean,
                skipHeaderRow: ow.optional.boolean,
                skipHidden: ow.optional.boolean,
                unwind: ow.any(ow.optional.string, ow.optional.array.ofType(ow.string)),
                view: ow.optional.string,
                xmlRoot: ow.optional.string,
                xmlRow: ow.optional.string,
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
     * https://docs.apify.com/api/v2#/reference/datasets/item-collection/put-items
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
     * https://docs.apify.com/api/v2#tag/DatasetsStatistics/operation/dataset_statistics_get
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
     * Generates a URL that can be used to access dataset items.
     *
     * If the client has permission to access the dataset's URL signing key,
     * the URL will include a signature which will allow the link to work even without authentication.
     *
     * You can optionally control how long the signed URL should be valid using the `expiresInMillis` option.
     * This value sets the expiration duration in milliseconds from the time the URL is generated.
     * If not provided, the URL will not expire.
     *
     * Any other options (like `limit` or `prefix`) will be included as query parameters in the URL.
     */
    async createItemsPublicUrl(options: DatasetClientListItemOptions = {}, expiresInMillis?: number): Promise<string> {
        ow(
            options,
            ow.object.exactShape({
                clean: ow.optional.boolean,
                desc: ow.optional.boolean,
                flatten: ow.optional.array.ofType(ow.string),
                fields: ow.optional.array.ofType(ow.string),
                omit: ow.optional.array.ofType(ow.string),
                limit: ow.optional.number,
                offset: ow.optional.number,
                skipEmpty: ow.optional.boolean,
                skipHidden: ow.optional.boolean,
                unwind: ow.optional.any(ow.string, ow.array.ofType(ow.string)),
                view: ow.optional.string,
            }),
        );

        const dataset = await this.get();

        let createdItemsPublicUrl = new URL(this._url('items'));

        if (dataset?.urlSigningSecretKey) {
            const signature = createStorageContentSignature({
                resourceId: dataset.id,
                urlSigningSecretKey: dataset.urlSigningSecretKey,
                expiresInMillis,
            });
            createdItemsPublicUrl.searchParams.set('signature', signature);
        }

        createdItemsPublicUrl = applyQueryParamsToUrl(createdItemsPublicUrl, options);

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

export interface Dataset {
    id: string;
    name?: string;
    title?: string;
    userId: string;
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

export interface DatasetStats {
    readCount?: number;
    writeCount?: number;
    deleteCount?: number;
    storageBytes?: number;
}

export interface DatasetClientUpdateOptions {
    name?: string | null;
    title?: string;
    generalAccess?: STORAGE_GENERAL_ACCESS | null;
}

export interface DatasetClientListItemOptions {
    clean?: boolean;
    desc?: boolean;
    flatten?: string[];
    fields?: string[];
    omit?: string[];
    limit?: number;
    offset?: number;
    skipEmpty?: boolean;
    skipHidden?: boolean;
    unwind?: string | string[]; // TODO: when doing a breaking change release, change to string[] only
    view?: string;
}

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

export interface DatasetClientDownloadItemsOptions extends DatasetClientListItemOptions {
    attachment?: boolean;
    bom?: boolean;
    delimiter?: string;
    skipHeaderRow?: boolean;
    xmlRoot?: string;
    xmlRow?: string;
}

export interface DatasetStatistics {
    fieldStatistics: Record<string, FieldStatistics>;
}

export interface FieldStatistics {
    min?: number;
    max?: number;
    nullCount?: number;
    emptyCount?: number;
}
