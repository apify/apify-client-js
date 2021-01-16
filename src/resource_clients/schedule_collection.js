const ow = require('ow').default;
const ResourceCollectionClient = require('../base/resource_collection_client');

/**
 * @hideconstructor
 */
class ScheduleCollectionClient extends ResourceCollectionClient {
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
     * https://docs.apify.com/api/v2#/reference/schedules/schedules-collection/get-list-of-schedules
     * @param {object} [options]
     * @param {number} [options.limit]
     * @param {number} [options.offset]
     * @param {boolean} [options.desc]
     * @return {Promise<PaginationList>}
     */
    async list(options = {}) {
        ow(options, ow.object.exactShape({
            limit: ow.optional.number,
            offset: ow.optional.number,
            desc: ow.optional.boolean,
        }));
        return this._list(options);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/schedules/schedules-collection/create-schedule
     * @param {object} [schedule]
     * @return {Promise<Schedule>}
     */
    async create(schedule) {
        ow(schedule, ow.optional.object);
        return this._create(schedule);
    }
}

module.exports = ScheduleCollectionClient;
