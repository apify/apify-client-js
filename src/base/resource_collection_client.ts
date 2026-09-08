import type { z } from 'zod';

import type { Timeout, TimeoutOptions } from '../timeouts.js';
import type { PaginatedResponse, PaginationOptions } from '../utils.js';
import { parseResponse } from '../utils.js';
import { ApiClient } from './api_client.js';

/**
 * Resource collection client.
 * @private
 */
export class ResourceCollectionClient extends ApiClient {
    /**
     * @private
     */
    protected async _list<T, R>(schema: z.ZodType, options: T | undefined, timeout: Timeout): Promise<R> {
        const response = await this.httpClient.call({
            url: this._url(),
            method: 'GET',
            params: this._params(options),
            timeout,
        });
        return parseResponse<R>(response, schema);
    }

    /**
     * Returns async iterator to iterate through all items and Promise that can be awaited to get first page of results.
     * `defaultTimeout` applies to every page request unless `options.timeout` overrides it.
     */
    protected _listPaginated<T extends PaginationOptions & TimeoutOptions, Data, R extends PaginatedResponse<Data>>(
        schema: z.ZodType,
        options: T,
        defaultTimeout: Timeout,
    ): AsyncIterable<Data> & Promise<R> {
        // `timeout` only times the page requests; it is not an API parameter, so it must not reach the query string.
        const { timeout = defaultTimeout, ...listOptions } = options;

        return this._listPaginatedFromCallback(
            async (pageOptions?: T) => this._list<T, R>(schema, pageOptions, timeout),
            listOptions as T,
        );
    }

    protected async _create<D, R>(schema: z.ZodType, resource: D, timeout: Timeout): Promise<R> {
        const response = await this.httpClient.call({
            url: this._url(),
            method: 'POST',
            params: this._params(),
            data: resource,
            timeout,
        });
        return parseResponse<R>(response, schema);
    }

    protected async _getOrCreate<D, R>(
        schema: z.ZodType,
        name: string | undefined,
        resource: D | undefined,
        timeout: Timeout,
    ): Promise<R> {
        const response = await this.httpClient.call({
            url: this._url(),
            method: 'POST',
            params: this._params({ name }),
            data: resource,
            timeout,
        });
        return parseResponse<R>(response, schema);
    }
}
