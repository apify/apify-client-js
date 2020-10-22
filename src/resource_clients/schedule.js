const ResourceClient = require('../base/resource_client');
const {
    pluckData,
    parseDateFields,
    catchNotFoundOrThrow,
} = require('../utils');

class ScheduleClient extends ResourceClient {
    /**
     * @param {ApiClientOptions} options
     */
    constructor(options) {
        super({
            resourcePath: 'schedules',
            ...options,
        });
    }

    async getLog() {
        const requestOpts = {
            url: this._url('log'),
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
}

module.exports = ScheduleClient;
