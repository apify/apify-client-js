const ResourceClient = require('../base/resource_client');
const {
    pluckData,
    parseDateFields,
} = require('../utils');

class BuildClient extends ResourceClient {
    /**
     * @param {ApiClientOptions} options
     */
    constructor(options) {
        super({
            resourcePath: 'builds',
            ...options,
        });
    }

    async abort() {
        const response = await this.httpClient.call({
            url: this._url('abort'),
            method: 'POST',
            params: this._params(),
        });

        return parseDateFields(pluckData(response.data));
    }

    async waitForFinish() {
        // TODO
    }
}

module.exports = BuildClient;
