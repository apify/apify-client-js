import { AxiosResponse } from 'axios';
import ow from 'ow';
import { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import { PaginatedList } from '../utils';

/**
 * @hideconstructor
 */
export class DatasetClient extends ResourceClient {
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'datasets',
            ...options,
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/datasets/dataset/get-dataset
     */
    async get(): Promise<Dataset> {
        return this._get();
    }

    /**
     * https://docs.apify.com/api/v2#/reference/datasets/dataset/update-dataset
     */
    async update(newFields: DatasetClientUpdateOptions): Promise<Dataset> {
        ow(newFields, ow.object);

        return this._update(newFields);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/datasets/dataset/delete-dataset
     */
    async delete(): Promise<void> {
        return this._delete();
    }

    /**
     * https://docs.apify.com/api/v2#/reference/datasets/item-collection/get-items
     */
    async listItems(options: DatasetClientListItemOptions = {}): Promise<PaginatedList<MaybeArray<string | Record<string, unknown>>>> {
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
     * Unlike `listItems` which returns a {@link PaginationList} with an array of individual
     * dataset items, `downloadItems` returns the items serialized to the provided format.
     * https://docs.apify.com/api/v2#/reference/datasets/item-collection/get-items
     */
    async downloadItems(format: DownloadItemsFormat, options: DatasetClientDownloadItemsOptions = {}): Promise<Buffer> {
        ow(format, ow.string.oneOf(validItemFormats));
        ow(options, ow.object.exactShape({
            attachment: ow.optional.boolean,
            bom: ow.optional.boolean,
            clean: ow.optional.boolean,
            delimiter: ow.optional.string,
            desc: ow.optional.boolean,
            fields: ow.optional.array.ofType(ow.string),
            omit: ow.optional.array.ofType(ow.string),
            limit: ow.optional.number,
            offset: ow.optional.number,
            skipEmpty: ow.optional.boolean,
            skipHeaderRow: ow.optional.boolean,
            skipHidden: ow.optional.boolean,
            unwind: ow.optional.string,
            xmlRoot: ow.optional.string,
            xmlRow: ow.optional.string,
        }));

        const { data } = await this.httpClient.call({
            url: this._url('items'),
            method: 'GET',
            params: this._params({
                format,
                ...options,
            }),
            forceBuffer: true,
        });

        return data;
    }

    /**
     * https://docs.apify.com/api/v2#/reference/datasets/item-collection/put-items
     */
    async pushItems(items: MaybeArray<string | Record<string, unknown>>): Promise<void> {
        ow(items, ow.any(
            ow.object,
            ow.string,
            ow.array.ofType(ow.any(ow.object, ow.string)),
        ));

        await this.httpClient.call({
            url: this._url('items'),
            method: 'POST',
            headers: {
                'content-type': 'application/json; charset=utf-8',
            },
            data: items,
            params: this._params(),
            doNotRetryTimeouts: true, // see timeout handling in http-client
        });
    }

    private _createPaginationList<D>(response: AxiosResponse<D[]>): PaginatedList<D> {
        return {
            items: response.data,
            total: Number(response.headers['x-apify-pagination-total']),
            offset: Number(response.headers['x-apify-pagination-offset']),
            count: response.data.length, // because x-apify-pagination-count returns invalid values when hidden/empty items are skipped
            limit: Number(response.headers['x-apify-pagination-limit']), // API returns 999999999999 when no limit is used
            // TODO: will the API return this
            desc: false,
        };
    }
}

type MaybeArray<T> = T | T[];

export interface Dataset {
    id: string;
    name: string;
    userId: string;
    createdAt: string;
    modifiedAt: string;
    accessedAt: string;
    itemCount: number;
    cleanItemCount: number;
    // TODO: Are these actually always just empty objects?
    actId?: Record<string, unknown> | null;
    actRunId?: Record<string, unknown> | null;
    fields?: string[];
    // TODO: the api seems to return a stats field, that isn't documented
}

export interface DatasetClientUpdateOptions {
    name: string;
}

export interface DatasetClientListItemOptions {
    clean?: boolean;
    desc?: boolean;
    fields?: string[];
    omit?: string[];
    limit?: number;
    offset?: number;
    skipEmpty?: boolean;
    skipHidden?: boolean;
    unwind?: string;
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

const validItemFormats = [
    ...new Set(
        Object.values(DownloadItemsFormat)
            .map((item) => item.toLowerCase()),
    ),
];

export interface DatasetClientDownloadItemsOptions extends DatasetClientListItemOptions {
    attachment?: boolean;
    bom?: boolean;
    delimiter?: string;
    skipHeaderRow?: boolean;
    xmlRoot?: string;
    xmlRow?: string;
}
