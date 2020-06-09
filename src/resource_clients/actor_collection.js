const ow = require('ow');
const ResourceCollectionClient = require('../base/resource_collection_client');

class ActorCollectionClient extends ResourceCollectionClient {
    /**
     * @param {object} options
     * @param {string} options.baseUrl
     * @param {HttpClient} options.httpClient
     * @param {object} [options.params]
     */
    constructor(options) {
        super({
            resourcePath: 'acts',
            disableMethods: ['getOrCreate'],
            ...options,
        });
    }

    async list(options = {}) {
        ow(options, ow.object.exactShape({
            my: ow.optional.boolean,
            limit: ow.optional.number,
            offset: ow.optional.number,
            desc: ow.optional.boolean,
        }));
        return super.list(options);
    }
}

module.exports = ActorCollectionClient;
