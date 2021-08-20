import ApifyApiError from '../apify_api_error';
import { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import {
    catchNotFoundOrThrow,
} from '../utils';

/**
 * @hideconstructor
 */
export class LogClient extends ResourceClient {
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'logs',
            ...options,
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/logs/log/get-log
     */
    async get(): Promise<string | undefined> {
        const requestOpts = {
            url: this._url(),
            method: 'GET',
            params: this._params(),
        };

        try {
            const response = await this.httpClient.call(requestOpts);
            return response.data;
        } catch (err) {
            catchNotFoundOrThrow(err as ApifyApiError);
        }

        return undefined;
    }

    /**
     * Gets the log in a Readable stream format. Only works in Node.js.
     * https://docs.apify.com/api/v2#/reference/logs/log/get-log
     */
    async stream(): Promise<ReadableStream | undefined> {
        const params = {
            stream: true,
        };

        const requestOpts = {
            url: this._url(),
            method: 'GET',
            params: this._params(params),
            responseType: 'stream',
        };

        try {
            const response = await this.httpClient.call(requestOpts);
            return response.data;
        } catch (err) {
            catchNotFoundOrThrow(err as ApifyApiError);
        }

        return undefined;
    }
}
