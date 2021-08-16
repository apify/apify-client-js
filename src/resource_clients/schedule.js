const ow = require('ow').default;
const { ResourceClient } = require('../base/resource_client');
const {
    pluckData,
    parseDateFields,
    catchNotFoundOrThrow,
} = require('../utils');

/**
 * @hideconstructor
 */
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

    /**
     * https://docs.apify.com/api/v2#/reference/schedules/schedule-object/get-schedule
     * @return {Promise<?Schedule>}
     */
    async get() {
        return this._get();
    }

    /**
     * https://docs.apify.com/api/v2#/reference/schedules/schedule-object/update-schedule
     * @param {object} newFields
     * @return {Promise<Schedule>}
     */
    async update(newFields) {
        ow(newFields, ow.object);
        return this._update(newFields);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/schedules/schedule-object/delete-schedule
     * @return {Promise<void>}
     */
    async delete() {
        return this._delete();
    }

    /**
     * https://docs.apify.com/api/v2#/reference/schedules/schedule-log/get-schedule-log
     * @return {Promise<?string>}
     */
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
