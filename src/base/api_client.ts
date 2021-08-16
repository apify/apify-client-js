import ApifyClient from '../index';
import HttpClient from '../http_client';

/** @private */
export interface ApiClientOptions {
    baseUrl: string;
    resourcePath: string;
    apifyClient: ApifyClient;
    httpClient: HttpClient;
    id?: string;
    params?: Record<string, string>;
}

/** @private */
export abstract class ApiClient {
    id?: string;

    safeId?: string;

    baseUrl: string;

    resourcePath: string;

    url: string;

    apifyClient: ApifyClient;

    httpClient: HttpClient;

    params?: Record<string, string>;

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

    protected _subResourceOptions<T extends Record<string, unknown>>(moreOptions: T): BaseOptions & T {
        const baseOptions = {
            baseUrl: this._url(),
            apifyClient: this.apifyClient,
            httpClient: this.httpClient,
            params: this._params(),
        };
        return { ...baseOptions, ...moreOptions };
    }

    protected _url(path?: string): string {
        return path ? `${this.url}/${path}` : this.url;
    }

    protected _params(endpointParams?: Record<string, unknown>): Record<string, unknown> {
        return { ...this.params, ...endpointParams };
    }

    protected _toSafeId(id: string): string {
        return id.replace(/\//g, '~');
    }
}

export interface BaseOptions {
    baseUrl: string;
    apifyClient: ApifyClient;
    httpClient: HttpClient;
    params: Record<string, unknown>;
}
