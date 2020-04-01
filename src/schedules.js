const { catchNotFoundOrThrow, checkParamOrThrow, parseDateFields, pluckData } = require('./utils');
const Resource = require('./resource');

/**
 * Schedules
 * @memberOf ApifyClient
 * @description
 * Schedules provide an easy and reliable way to configure the Apify platform to carry out an action
 * (e.g. a HTTP request to another service) when a certain system event occurs.
 *
 * For more information see the [Schedules endpoint](https://docs.apify.com/api/v2#/reference/schedules).
 *
 * @namespace schedules
 */

class Schedules extends Resource {
    constructor(httpClient) {
        super(httpClient, '/v2/schedules');
    }

    /**
     * Creates a new schedule with settings provided by the schedule object passed as `options.schedule`.
     * The response is the created schedule object.
     *
     * For more information see [create schedule endpoint](https://docs.apify.com/api/v2#/reference/schedules/schedule-collection/create-schedule).
     *
     * @memberof ApifyClient.schedules
     * @param {Object} options
     * @param options.schedule - schedule
     * @returns {Schedule}
     */
    async createSchedule(options = {}) {
        const { schedule } = options;

        checkParamOrThrow(schedule, 'schedule', 'Object');

        const endpointOptions = {
            url: '',
            method: 'POST',
            body: schedule,
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * Gets list of schedules.
     * @description By default, the objects are sorted by the createdAt field in ascending order,
     * therefore you can use pagination to incrementally fetch all schedules.
     * To sort them in descending order, use desc: `true` parameter.
     *
     * For more information see
     * [get list of schedules endpoint](https://docs.apify.com/api/v2#/reference/schedules/schedule-collection/create-schedule).
     *
     * @memberof ApifyClient.schedules
     * @param {Object} options
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Boolean} [options.desc] - If `true` then the objects are sorted by the createdAt field in descending order.
     * @returns {PaginationList}
     */
    async listSchedules(options = {}) {
        const { offset, limit, desc } = options;

        checkParamOrThrow(limit, 'limit', 'Maybe Number');
        checkParamOrThrow(offset, 'offset', 'Maybe Number');
        checkParamOrThrow(desc, 'desc', 'Maybe Boolean');

        const query = {};

        if (limit) query.limit = limit;
        if (offset) query.offset = offset;
        if (desc) query.desc = 1;

        const endpointOptions = {
            url: '',
            method: 'GET',
            qs: query,
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * Gets schedule object with all details.
     *
     * For more information see the [get schedule endpoint](https://docs.apify.com/api/v2#/reference/schedules/schedule-object/get-schedule).
     *
     * @memberof ApifyClient.schedules
     * @param {Object} options
     * @param options.scheduleId - Schedule ID
     * @returns {Schedule}
     */
    async getSchedule(options = {}) {
        const { scheduleId } = options;

        checkParamOrThrow(scheduleId, 'scheduleId', 'String');

        const endpointOptions = {
            url: `/${scheduleId}`,
            method: 'GET',
        };

        try {
            const response = await this._call(options, endpointOptions);
            return parseDateFields(pluckData(response));
        } catch (err) {
            return catchNotFoundOrThrow(err);
        }
    }

    /**
     * Updates a schedule using values specified by a schedule object passed as `options.schedule`.
     * If the object does not define a specific property,
     * its value will not be updated.The response is the full schedule object as returned by the Get schedule endpoint.
     *
     * For more information see the [update schedule endpoint](https://docs.apify.com/api/v2#/reference/schedules/schedule-object/update-schedule).
     *
     * @memberof ApifyClient.schedules
     * @param {Object} options
     * @param options.token
     * @param options.scheduleId - Schedule ID
     * @param options.schedule - Schedule
     * @returns {Schedule}
     */
    async updateSchedule(options = {}) {
        const { scheduleId, schedule } = options;
        // TODO: Consistency with actor and task endpoint, they support the ID in the update body and also as a separate options

        checkParamOrThrow(scheduleId, 'scheduleId', 'String');
        checkParamOrThrow(schedule, 'schedule', 'Object');

        const endpointOptions = {
            url: `/${scheduleId}`,
            method: 'PUT',
            body: schedule,
        };
        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * Deletes schedule.
     *
     * For more information see the [delete schedule endpoint](https://docs.apify.com/api/v2#/reference/schedules/schedule-object/delete-schedule).
     *
     * @memberof ApifyClient.schedules
     * @param {Object} options
     * @param options.scheduleId - Schedule ID
     * @returns {}
     */
    async deleteSchedule(options = {}) {
        const { scheduleId } = options;

        checkParamOrThrow(scheduleId, 'scheduleId', 'String');

        const endpointOptions = {
            url: `/${scheduleId}`,
            method: 'DELETE',
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(response);
    }

    /**
     * Gets schedule log.
     *
     * For more information see the [get schedule endpoint](https://docs.apify.com/api/v2#/reference/schedules/schedule-object/get-log).
     *
     * @memberof ApifyClient.schedules
     * @param {Object} options
     * @param options.scheduleId - Schedule ID
     * @returns {Schedule}
     */
    async getLog(options = {}) {
        const { scheduleId } = options;

        checkParamOrThrow(scheduleId, 'scheduleId', 'String');

        const endpointOptions = {
            url: `/${scheduleId}/log`,
            method: 'GET',
        };

        try {
            const response = await this._call(options, endpointOptions);
            return parseDateFields(pluckData(response));
        } catch (err) {
            return catchNotFoundOrThrow(err);
        }
    }
}

module.exports = Schedules;
