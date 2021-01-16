const ow = require('ow').default;
const ResourceCollectionClient = require('../base/resource_collection_client');

/**
 * @hideconstructor
 */
class ActorVersionCollectionClient extends ResourceCollectionClient {
    /**
     * @param {ApiClientOptions} options
     */
    constructor(options) {
        super({
            resourcePath: 'versions',
            ...options,
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/version-collection/get-list-of-versions
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
     * https://docs.apify.com/api/v2#/reference/actors/version-collection/create-version
     * @param {object} [actorVersion]
     * @return {Promise<object>}
     */
    async create(actorVersion) {
        ow(actorVersion, ow.optional.object);
        return this._create(actorVersion);
    }
}

module.exports = ActorVersionCollectionClient;
