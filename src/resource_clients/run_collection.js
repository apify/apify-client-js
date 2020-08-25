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
            disableMethods: ['create', 'getOrCreate'],
            ...options,
        });
    }

    async list(options = {}) {
        ow(options, ow.object.exactShape({
            limit: ow.optional.number,
            offset: ow.optional.number,
            desc: ow.optional.boolean,
            status: ow.optional.string.oneOf(Object.values(ACT_JOB_STATUSES)),
        }));
        return super.list(options);
    }
}

module.exports = RunCollectionClient;
