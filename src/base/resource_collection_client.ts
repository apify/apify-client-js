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
    protected async listResources<T, R>(schema: z.ZodType, options: T | undefined, timeoutSecs: Timeout): Promise<R> {
        const response = await this.httpClient.call({
            url: this.buildUrl(),
            method: 'GET',
            params: this.buildParams(options),
            timeoutSecs,
        });
        return parseResponse<R>(response, schema);
    }

    /**
     * Returns async iterator to iterate through all items and Promise that can be awaited to get first page of results.
     * `defaultTimeoutSecs` applies to every page request unless `options.timeoutSecs` overrides it.
     */
    protected listResourcesPaginated<
        T extends PaginationOptions & TimeoutOptions,
        Data,
        R extends PaginatedResponse<Data>,
    >(schema: z.ZodType, options: T, defaultTimeoutSecs: Timeout): AsyncIterable<Data> & Promise<R> {
        // `timeoutSecs` only times the page requests; it is not an API parameter, so it must not reach the query string.
        const { timeoutSecs = defaultTimeoutSecs, ...listOptions } = options;

        return this.listPaginatedFromCallback(
            async (pageOptions?: T) => this.listResources<T, R>(schema, pageOptions, timeoutSecs),
            listOptions as T,
        );
    }

    protected async createResource<D, R>(schema: z.ZodType, resource: D, timeoutSecs: Timeout): Promise<R> {
        const response = await this.httpClient.call({
            url: this.buildUrl(),
            method: 'POST',
            params: this.buildParams(),
            data: resource,
            timeoutSecs,
        });
        return parseResponse<R>(response, schema);
    }

    protected async getOrCreateResource<D, R>(
        schema: z.ZodType,
        name: string | undefined,
        resource: D | undefined,
        timeoutSecs: Timeout,
    ): Promise<R> {
        const response = await this.httpClient.call({
            url: this.buildUrl(),
            method: 'POST',
            params: this.buildParams({ name }),
            data: resource,
            timeoutSecs,
        });
        return parseResponse<R>(response, schema);
    }
}
