import { ApiClient } from './api_client';
import {
    pluckData,
    parseDateFields,
} from '../utils';

/**
 * Resource collection client.
 * @private
 */
export class ResourceCollectionClient extends ApiClient {
    /**
     * @private
     */
    protected async _list<T extends Record<string, unknown>, R>(options: T = {} as T): Promise<R> {
        const response = await this.httpClient.call({
            url: this._url(),
            method: 'GET',
            params: this._params(options),
        });
        return parseDateFields(pluckData(response.data));
    }

    protected async _create<T extends Record<string, unknown>, R>(resource: T): Promise<R> {
        const response = await this.httpClient.call({
            url: this._url(),
            method: 'POST',
            params: this._params(),
            data: resource,
        });
        return parseDateFields(pluckData(response.data));
    }

    protected async _getOrCreate<R>(name = ''): Promise<R> {
        // The default value of '' allows creating unnamed
        // resources by passing the name= parameter with
        // no value. It's useful and later will be supported
        // in API properly by omitting the name= param entirely.
        const response = await this.httpClient.call({
            url: this._url(),
            method: 'POST',
            params: this._params({ name }),
        });
        return parseDateFields(pluckData(response.data));
    }
}
