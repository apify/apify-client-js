import { ApifyClient } from '../apify_client';
import { HttpClient } from '../http_client';

/** @private */
export interface ApiClientOptions {
    baseUrl: string;
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

    resourcePath: string;

    url: string;

    apifyClient: ApifyClient;

    httpClient: HttpClient;

    params?: Record<string, unknown>;

    constructor(options: ApiClientOptions) {
        const {
            baseUrl,
            apifyClient,
            httpClient,
            resourcePath,
            id,
            params = {},
        } = options;

        this.id = id;
        this.safeId = id && this._toSafeId(id);
        this.baseUrl = baseUrl;
        this.resourcePath = resourcePath;
        this.url = id
            ? `${baseUrl}/${resourcePath}/${this.safeId}`
            : `${baseUrl}/${resourcePath}`;
        this.apifyClient = apifyClient;
        this.httpClient = httpClient;
        this.params = params;
    }

    protected _subResourceOptions<T>(moreOptions?: T): BaseOptions & T {
        const baseOptions: BaseOptions = {
            baseUrl: this._url(),
            apifyClient: this.apifyClient,
            httpClient: this.httpClient,
            params: this._params(),
        };
        return { ...baseOptions, ...moreOptions } as BaseOptions & T;
    }

    protected _url(path?: string): string {
        return path ? `${this.url}/${path}` : this.url;
    }

    protected _params<T>(endpointParams?: T): Record<string, unknown> {
        return { ...this.params, ...endpointParams };
    }

    protected _toSafeId(id: string): string {
        // The id has the format `username/actor-name`, so we only need to replace the first `/`.
        return id.replace('/', '~');
    }
}

export interface BaseOptions {
    baseUrl: string;
    apifyClient: ApifyClient;
    httpClient: HttpClient;
    params: Record<string, unknown>;
}
