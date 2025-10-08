import type { ApifyClient } from '../apify_client';
import type { HttpClient } from '../http_client';

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
        return this._prepareParams({ ...this.params, ...endpointParams });
    }

    protected _toSafeId(id: string): string {
        // The id has the format `username/actor-name`, so we only need to replace the first `/`.
        return id.replace('/', '~');
    }

    /**
     * Prepares the query parameters by applying necessary transformations:
     * - Converts Date objects to ISO strings.
     */
    private _prepareParams(params: Record<string, unknown>): Record<string, unknown> {
        /**
         * Convert only root-level Date objects to ISO strings.
         */
        Object.entries(params).forEach(([key, value]) => {
            if (value instanceof Date) {
                params[key] = value.toISOString();
            }
        });
        return params;
    }
}

export interface BaseOptions {
    baseUrl: string;
    publicBaseUrl: string;
    apifyClient: ApifyClient;
    httpClient: HttpClient;
    params: Record<string, unknown>;
}
