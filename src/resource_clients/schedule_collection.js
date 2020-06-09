const ow = require('ow');
const ResourceCollectionClient = require('../base/resource_collection_client');

class ScheduleCollectionClient extends ResourceCollectionClient {
    /**
     * @param {object} options
     * @param {string} options.baseUrl
     * @param {HttpClient} options.httpClient
     * @param {object} [options.params]
     */
    constructor(options) {
        super({
            resourcePath: 'schedules',
            disableMethods: ['getOrCreate'],
            ...options,
        });
    }
}

module.exports = ScheduleCollectionClient;
