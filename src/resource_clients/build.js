const ow = require('ow');
const ResourceClient = require('../base/resource_client');
const {
    pluckData,
    parseDateFields,
} = require('../utils');

class BuildClient extends ResourceClient {
    /**
     * @param {object} options
     * @param {string} options.id
     * @param {string} options.baseUrl
     * @param {HttpClient} options.httpClient
     * @param {object} [options.params]
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

    async waitForFinish(timeoutSecs) {
        // TODO
    }
}

module.exports = BuildClient;
