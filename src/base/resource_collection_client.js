const ow = require('ow');
const ApiClient = require('./api_client');
const {
    pluckData,
    parseDateFields,
} = require('../utils');

class ResourceCollectionClient extends ApiClient {
    async list(options = {}) {
        const response = await this.httpClient.call({
            url: this._url(),
            method: 'GET',
            params: this._params(options),
        });
        return parseDateFields(pluckData(response.data));
    }

    async create(resource) {
        ow(resource, ow.optional.object);
        this._throwIfDisabled('create');
        const response = await this.httpClient.call({
            url: this._url(),
            method: 'POST',
            params: this._params(),
            data: resource,
            headers: {
                'x-header': 'foo',
            },
        });
        return parseDateFields(pluckData(response.data));
    }

    async getOrCreate(name) {
        ow(name, ow.optional.string);
        this._throwIfDisabled('getOrCreate');
        const response = await this.httpClient.call({
            url: this._url(),
            method: 'POST',
            params: this._params({ name }),
        });
        return parseDateFields(pluckData(response.data));
    }
}

module.exports = ResourceCollectionClient;
