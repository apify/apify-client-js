const ResourceClient = require('../base/resource_client');
const {
    catchNotFoundOrThrow,
} = require('../utils');

class LogClient extends ResourceClient {
    /**
     * @param {ApiClientOptions} options
     */
    constructor(options) {
        super({
            resourcePath: 'logs',
            ...options,
            disableMethods: ['update', 'delete'],
        });
    }

    async get() {
        const requestOpts = {
            url: this._url(),
            method: 'GET',
            params: this._params(),
        };
        try {
            const response = await this.httpClient.call(requestOpts);
            return response.data;
        } catch (err) {
            return catchNotFoundOrThrow(err);
        }
    }

    async stream() {
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
            return catchNotFoundOrThrow(err);
        }
    }
}

module.exports = LogClient;
