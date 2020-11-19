const ow = require('ow');
const ResourceCollectionClient = require('../base/resource_collection_client');

class ActorCollectionClient extends ResourceCollectionClient {
    /**
     * @param {ApiClientOptions} options
     */
    constructor(options) {
        super({
            resourcePath: 'acts',
            ...options,
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/actor-collection/get-list-of-actors
     * @param {object} [options]
     * @param {boolean} [options.my]
     * @param {number} [options.limit]
     * @param {number} [options.offset]
     * @param {boolean} [options.desc]
     * @return {Promise<object>}
     */
    async list(options = {}) {
        ow(options, ow.object.exactShape({
            my: ow.optional.boolean,
            limit: ow.optional.number,
            offset: ow.optional.number,
            desc: ow.optional.boolean,
        }));
        return this._list(options);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/actor-collection/create-actor
     * @param {object} [actor]
     * @return {Promise<Actor>}
     */
    async create(actor) {
        ow(actor, ow.optional.object);
        return this._create(actor);
    }
}

module.exports = ActorCollectionClient;
