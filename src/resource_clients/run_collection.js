const {
    ACT_JOB_STATUSES,
} = require('apify-shared/consts');
const ow = require('ow');
const ResourceCollectionClient = require('../base/resource_collection_client');

class RunCollectionClient extends ResourceCollectionClient {
    /**
     * @param {ApiClientOptions} options
     */
    constructor(options) {
        super({
            resourcePath: 'runs',
            ...options,
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/run-collection/get-list-of-runs
     * @param {object} [options]
     * @param {number} [options.limit]
     * @param {number} [options.offset]
     * @param {boolean} [options.desc]
     * @param {boolean} [options.status]
     * @return {Promise<object>}
     */
    async list(options = {}) {
        ow(options, ow.object.exactShape({
            limit: ow.optional.number,
            offset: ow.optional.number,
            desc: ow.optional.boolean,
            status: ow.optional.string.oneOf(Object.values(ACT_JOB_STATUSES)),
        }));
        return this._list(options);
    }
}

module.exports = RunCollectionClient;
