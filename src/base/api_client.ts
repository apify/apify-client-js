import type { ApifyClient } from '../apify_client';
import type { HttpClient } from '../http_client';
import type { PaginatedResponse, PaginationOptions } from '../utils';

/** @private */
export interface ApiClientOptions {
    baseUrl: string;
    publicBaseUrl: string;
    resourcePath: string;
    apifyClient: ApifyClient;
    httpClient: HttpClient;
    id?: string;
    params?: Record<string, unknown>;
}

export interface ApiClientOptionsWithOptionalResourcePath extends Omit<ApiClientOptions, 'resourcePath'> {
    resourcePath?: string;
}

export type ApiClientSubResourceOptions = Omit<ApiClientOptions, 'resourcePath'>;

/** @private */
export abstract class ApiClient {
    id?: string;

    safeId?: string;

    baseUrl: string;

    publicBaseUrl: string;

    resourcePath: string;

    url: string;

    apifyClient: ApifyClient;

    httpClient: HttpClient;

    params?: Record<string, unknown>;

    constructor(options: ApiClientOptions) {
        const { baseUrl, publicBaseUrl, apifyClient, httpClient, resourcePath, id, params = {} } = options;

        this.id = id;
        this.safeId = id && this._toSafeId(id);
        this.baseUrl = baseUrl;
        this.publicBaseUrl = publicBaseUrl;
        this.resourcePath = resourcePath;
        this.url = id ? `${baseUrl}/${resourcePath}/${this.safeId}` : `${baseUrl}/${resourcePath}`;
        this.apifyClient = apifyClient;
        this.httpClient = httpClient;
        this.params = params;
    }

    protected _subResourceOptions<T>(moreOptions?: T): BaseOptions & T {
        const baseOptions: BaseOptions = {
            baseUrl: this._url(),
            publicBaseUrl: this.publicBaseUrl,
            apifyClient: this.apifyClient,
            httpClient: this.httpClient,
            params: this._params(),
        };
        return { ...baseOptions, ...moreOptions } as BaseOptions & T;
    }

    protected _url(path?: string): string {
        return path ? `${this.url}/${path}` : this.url;
    }

    protected _publicUrl(path?: string): string {
        const url = this.id
            ? `${this.publicBaseUrl}/${this.resourcePath}/${this.safeId}`
            : `${this.publicBaseUrl}/${this.resourcePath}`;
        return path ? `${url}/${path}` : url;
    }

    protected _params<T>(endpointParams?: T): Record<string, unknown> {
        return { ...this.params, ...endpointParams };
    }

    protected _toSafeId(id: string): string {
        // The id has the format `username/actor-name`, so we only need to replace the first `/`.
        return id.replace('/', '~');
    }


    /**
     * Returns async iterator to iterate through all items and Promise that can be awaited to get first page of results.
     */
    protected _listPaginatedFromCallback<T extends PaginationOptions, Data, R extends PaginatedResponse<Data>>(getPaginatedList: (options?: T)=>Promise<R>,
        options: T = {} as T,
    ): AsyncIterable<Data> & Promise<R> {
        const minDefined = (a: number | undefined, b: number | undefined): number | undefined =>{
            if (a === undefined) return b;
            if (b === undefined) return a;
            return Math.min(a, b);
        }

        const paginatedListPromise = getPaginatedList({...options, limit: minDefined(options.limit, options.chunkSize)});

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
                const newOptions = { ...options, limit: minDefined(remainingItems, options.chunkSize), offset: currentOffset };
                currentPage = await getPaginatedList(newOptions);
                yield* currentPage.items;
                currentOffset += currentPage.items.length;
                remainingItems -= currentPage.items.length;
            }
        }


        return Object.defineProperty(paginatedListPromise, Symbol.asyncIterator, {
            value: asyncGenerator,
        }) as unknown as AsyncIterable<Data> & Promise<R>;
    }


    /**
     * Change any limit related `PaginationOptions` zero values to undefined. This is how API interprets them.
     * This should be done early on input so that the rest of the code does not need to handle zeros as undefined.
     */
    protected _changeZeroPaginationOptionsToUndefined(options: PaginationOptions): PaginationOptions {
        if (options.limit === 0) {options.limit = undefined;}
        if (options.chunkSize === 0) {options.chunkSize = undefined;}
        return options
    }

}

export interface BaseOptions {
    baseUrl: string;
    publicBaseUrl: string;
    apifyClient: ApifyClient;
    httpClient: HttpClient;
    params: Record<string, unknown>;
}
