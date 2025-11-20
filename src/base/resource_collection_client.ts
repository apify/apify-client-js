import type { PaginatedResponse, PaginationOptions , parseDateFields, pluckData } from '../utils';
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
     * Returns async iterator to paginate through all pages and first page of results is returned immediately as well.
     * @private
     */
    protected async _getIterablePagination<T extends PaginationOptions, R extends PaginatedResponse>(
        options: T = {} as T,
    ): Promise<R & AsyncIterable<R>> {
        const getPaginatedList = this._list.bind(this);

        let currentPage = await getPaginatedList<T, R>(options);

        return {
            ...currentPage,
            async *[Symbol.asyncIterator]() {
                yield currentPage;
                let itemsFetched = currentPage.items.length;
                let currentLimit = options.limit !== undefined ? options.limit - itemsFetched : undefined;
                let currentOffset = options.offset ?? 0 + itemsFetched;
                const maxRelevantItems =
                    currentPage.total === undefined ? undefined : currentPage.total - (options.offset || 0);

                while (
                    currentPage.items.length > 0 && // Some items were returned in last page
                    (currentLimit === undefined || currentLimit > 0) && // User defined a limit, and we have not yet exhausted it
                    (maxRelevantItems === undefined || maxRelevantItems > itemsFetched) // We know total and we did not get it yet
                ) {
                    const newOptions = { ...options, limit: currentLimit, offset: currentOffset };
                    currentPage = await getPaginatedList<T, R>(newOptions);
                    yield currentPage;
                    itemsFetched += currentPage.items.length;
                    currentLimit = options.limit !== undefined ? options.limit - itemsFetched : undefined;
                    currentOffset = options.offset ?? 0 + itemsFetched;
                }
            },
        };
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
