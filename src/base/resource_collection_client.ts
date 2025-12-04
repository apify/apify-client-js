import type { PaginatedResponse, PaginationOptions } from '../utils';
import { parseDateFields, pluckData } from '../utils';
import { ApiClient } from './api_client';

/**
 * Resource collection client.
 * @private
 */
export class ResourceCollectionClient extends ApiClient {
    /**
     * @private
     */
    protected async _list<T, R>(options: T = {} as T): Promise<R> {
        const response = await this.httpClient.call({
            url: this._url(),
            method: 'GET',
            params: this._params(options),
        });
        return parseDateFields(pluckData(response.data)) as R;
    }

    /**
     * Returns async iterator to iterate through all items and Promise that can be awaited to get first page of results.
     */
    protected _listPaginated<T extends PaginationOptions, Data, R extends PaginatedResponse<Data>>(
        options: T = {} as T,
    ): AsyncIterable<Data> & Promise<R> {
        return this._listPaginatedFromCallback(this._list.bind(this)<T, R>, options);
    }

    protected async _create<D, R>(resource: D): Promise<R> {
        const response = await this.httpClient.call({
            url: this._url(),
            method: 'POST',
            params: this._params(),
            data: resource,
        });
        return parseDateFields(pluckData(response.data)) as R;
    }

    protected async _getOrCreate<D, R>(name?: string, resource?: D): Promise<R> {
        const response = await this.httpClient.call({
            url: this._url(),
            method: 'POST',
            params: this._params({ name }),
            data: resource,
        });
        return parseDateFields(pluckData(response.data)) as R;
    }
}
