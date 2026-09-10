import type { z } from 'zod';

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
    protected async listResources<T, R>(schema: z.ZodType, options: T = {} as T): Promise<R> {
        const response = await this.httpClient.call({
            url: this.buildUrl(),
            method: 'GET',
            params: this.buildParams(options),
        });
        return parseResponse<R>(response, schema);
    }

    /**
     * Returns async iterator to iterate through all items and Promise that can be awaited to get first page of results.
     */
    protected listResourcesPaginated<T extends PaginationOptions, Data, R extends PaginatedResponse<Data>>(
        schema: z.ZodType,
        options: T = {} as T,
    ): AsyncIterable<Data> & Promise<R> {
        return this.listPaginatedFromCallback(
            async (listOptions?: T) => this.listResources<T, R>(schema, listOptions),
            options,
        );
    }

    protected async createResource<D, R>(schema: z.ZodType, resource: D): Promise<R> {
        const response = await this.httpClient.call({
            url: this.buildUrl(),
            method: 'POST',
            params: this.buildParams(),
            data: resource,
        });
        return parseResponse<R>(response, schema);
    }

    protected async getOrCreateResource<D, R>(schema: z.ZodType, name?: string, resource?: D): Promise<R> {
        const response = await this.httpClient.call({
            url: this.buildUrl(),
            method: 'POST',
            params: this.buildParams({ name }),
            data: resource,
        });
        return parseResponse<R>(response, schema);
    }
}
