const ow = require('ow');
const ApiClient = require('./api_client');
const {
    pluckData,
    parseDateFields,
} = require('../utils');

/**
 * Resource collection client.
 * @param {ApiClientOptions} options
 */
class ResourceCollectionClient extends ApiClient {
    /**
     * @param {object} [options]
     * @return {Promise<object>}
     * @private
     */
    async _list(options = {}) {
        const response = await this.httpClient.call({
            url: this._url(),
            method: 'GET',
            params: this._params(options),
        });
        return parseDateFields(pluckData(response.data));
    }

    /**
     * @param {object} resource
     * @return {Promise<object>}
     * @private
     */
    async _create(resource) {
        const response = await this.httpClient.call({
            url: this._url(),
            method: 'POST',
            params: this._params(),
            data: resource,
        });
        return parseDateFields(pluckData(response.data));
    }

    /**
     * @param {string} [name]
     * @return {Promise<object>}
     * @private
     */
    async _getOrCreate(name = '') {
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

module.exports = ResourceCollectionClient;
