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
    protected _getIterablePagination<T extends PaginationOptions, Data, R extends PaginatedResponse<Data>>(
        options: T = {} as T,
    ): AsyncIterable<Data> & Promise<R> {
        const getPaginatedList = this._list.bind(this);

        const paginatedListPromise = getPaginatedList<T, R>(options);

        async function* asyncGenerator() {
            let currentPage = await paginatedListPromise;
            let itemsFetched = currentPage.items.length;
            let currentLimit = options.limit !== undefined ? options.limit - itemsFetched : undefined;
            let currentOffset = options.offset ?? 0 + itemsFetched;
            const maxRelevantItems =
                currentPage.total === undefined ? undefined : currentPage.total - (options.offset || 0);
            for (const item of currentPage.items) {
                yield item;
            }

            while (
                currentPage.items.length > 0 && // Some items were returned in last page
                (currentLimit === undefined || currentLimit > 0) && // User defined a limit, and we have not yet exhausted it
                (maxRelevantItems === undefined || maxRelevantItems > itemsFetched) // We know total and we did not get it yet
            ) {
                const newOptions = { ...options, limit: currentLimit, offset: currentOffset };
                currentPage = await getPaginatedList<T, R>(newOptions);
                for (const item of currentPage.items) {
                    yield item;
                }
                itemsFetched += currentPage.items.length;
                currentLimit = options.limit !== undefined ? options.limit - itemsFetched : undefined;
                currentOffset = options.offset ?? 0 + itemsFetched;
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
