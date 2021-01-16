const ow = require('ow').default;
const ResourceCollectionClient = require('../base/resource_collection_client');

/**
 * @hideconstructor
 */
class TaskCollectionClient extends ResourceCollectionClient {
    /**
     * @param {ApiClientOptions} options
     */
    constructor(options) {
        super({
            resourcePath: 'actor-tasks',
            ...options,
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-tasks/task-collection/get-list-of-tasks
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
     * https://docs.apify.com/api/v2#/reference/actor-tasks/task-collection/create-task
     * @param {object} [task]
     * @return {Promise<Task>}
     */
    async create(task) {
        ow(task, ow.optional.object);
        return this._create(task);
    }
}

module.exports = TaskCollectionClient;
