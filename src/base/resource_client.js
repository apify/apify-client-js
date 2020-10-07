const ow = require('ow');
const ApiClient = require('./api_client');
const {
    pluckData,
    parseDateFields,
    catchNotFoundOrThrow,
} = require('../utils');

/**
 * Resource client.
 *
 * @param {ApiClientOptions} options
 */
class ResourceClient extends ApiClient {
    async get() {
        const requestOpts = {
            url: this._url(),
            method: 'GET',
            params: this._params(),
        };
        try {
            const response = await this.httpClient.call(requestOpts);
            return parseDateFields(pluckData(response.data));
        } catch (err) {
            return catchNotFoundOrThrow(err);
        }
    }

    async update(newFields) {
        ow(newFields, ow.object);
        const response = await this.httpClient.call({
            url: this._url(),
            method: 'PUT',
            params: this._params(),
            data: newFields,
        });
        return parseDateFields(pluckData(response.data));
    }

    async delete() {
        try {
            await this.httpClient.call({
                url: this._url(),
                method: 'DELETE',
                params: this._params(),
            });
        } catch (err) {
            return catchNotFoundOrThrow(err);
        }
    }
}

module.exports = ResourceClient;
