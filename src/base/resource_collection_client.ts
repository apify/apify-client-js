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
     * Returns async iterator to paginate through all items and first page of results is returned immediately as well.
     */
    protected _getPaginatedIterator<T extends PaginationOptions, Data, R extends PaginatedResponse<Data>>(
        options: T = {} as T,
    ): AsyncIterable<Data> & Promise<R> {
        const getPaginatedList = this._list.bind(this);
        const paginatedListPromise = getPaginatedList<T, R>(options);

        async function* asyncGenerator() {
            let currentPage = await paginatedListPromise;
            yield* currentPage.items;
            const offset = options.offset ?? 0;
            const limit = Math.min(options.limit || currentPage.total, currentPage.total);

            let currentOffset = offset + currentPage.items.length;
            let remainingItems = Math.min(currentPage.total - offset, limit) - currentPage.items.length;

            while (
                currentPage.items.length > 0 && // Continue only if at least some items were returned in the last page.
                remainingItems > 0
            ) {
                const newOptions = { ...options, limit: remainingItems, offset: currentOffset };
                currentPage = await getPaginatedList<T, R>(newOptions);
                yield* currentPage.items;
                currentOffset += currentPage.items.length;
                remainingItems -= currentPage.items.length;
            }
        }

        return Object.defineProperty(paginatedListPromise, Symbol.asyncIterator, {
            value: asyncGenerator,
        }) as unknown as AsyncIterable<Data> & Promise<R>;
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
