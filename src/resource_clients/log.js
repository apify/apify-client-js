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
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/logs/log/get-log
     * @return {Promise<?string>}
     */
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

    /**
     * Gets the log in a Readable stream format. Only works in Node.js.
     * https://docs.apify.com/api/v2#/reference/logs/log/get-log
     * @return {Promise<?Readable>}
     */
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
