import type { z } from 'zod';

import type { PaginatedResponse, PaginationOptions } from '../utils';
import { parseResponse } from '../utils';
import { ApiClient } from './api_client';

/**
 * Resource collection client.
 * @private
 */
export class ResourceCollectionClient extends ApiClient {
    /**
     * @private
     */
    protected async _list<T, R>(schema: z.ZodType, options: T = {} as T): Promise<R> {
        const response = await this.httpClient.call({
            url: this._url(),
            method: 'GET',
            params: this._params(options),
        });
        return parseResponse<R>(response, schema);
    }

    /**
     * Returns async iterator to iterate through all items and Promise that can be awaited to get first page of results.
     */
    protected _listPaginated<T extends PaginationOptions, Data, R extends PaginatedResponse<Data>>(
        schema: z.ZodType,
        options: T = {} as T,
    ): AsyncIterable<Data> & Promise<R> {
        return this._listPaginatedFromCallback(
            async (listOptions?: T) => this._list<T, R>(schema, listOptions),
            options,
        );
    }

    protected async _create<D, R>(schema: z.ZodType, resource: D): Promise<R> {
        const response = await this.httpClient.call({
            url: this._url(),
            method: 'POST',
            params: this._params(),
            data: resource,
        });
        return parseResponse<R>(response, schema);
    }

    protected async _getOrCreate<D, R>(schema: z.ZodType, name?: string, resource?: D): Promise<R> {
        const response = await this.httpClient.call({
            url: this._url(),
            method: 'POST',
            params: this._params({ name }),
            data: resource,
        });
        return parseResponse<R>(response, schema);
    }
}
