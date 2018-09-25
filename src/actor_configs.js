import _ from 'underscore';
import { checkParamOrThrow, pluckData, parseDateFields, catchNotFoundOrThrow } from './utils';

/**
 * ActorConfigor Configs
 * @memberOf ApifyClient
 * @description
 * ### Basic usage
 * Every method can be used as either promise or with callback. If your Node version supports await/async then you can await promise result.
 * ```javascript
 * const ApifyClient = require('apify-client');
 *
 * const apifyClient = new ApifyClient({
 *  userId: 'jklnDMNKLekk',
 *  token: 'SNjkeiuoeD443lpod68dk',
 * });
 *
 * // Awaited promise
 * try {
 *      const actorConfigsList = await apifyClient.actorConfigs.listActorConfigorConfigs({});
 *      // Do something with the actorConfigsList ...
 * } catch (err) {
 *      // Do something with error ...
 * }
 *
 * // Promise
 * apifyClient.actorConfigs.listActorConfigorConfigs({})
 * .then((actorConfigsList) => {
 *      // Do something actorConfigsList ...
 * })
 * .catch((err) => {
 *      // Do something with error ...
 * });
 *
 * // Callback
 * apifyClient.actorConfigs.listActorConfigorConfigs({}, (err, actorConfigsList) => {
 *      // Do something with error or actorConfigsList ...
 * });
 * ```
 * @namespace actorConfigs
 */

export const BASE_PATH = '/v2/actor-configs';

const replaceSlashWithTilde = str => str.replace('/', '~');

export default {
    /**
     * Gets list of your actor configs.
     * @description By default, the objects are sorted by the createdAt field in ascending order,
     * therefore you can use pagination to incrementally fetch all actor configs while new ones are still being created.
     * To sort them in descending order, use desc: 1 parameter.
     * The endpoint supports pagination using limit and offset parameters and it will not return more than 1000 array elements.
     * @memberof ApifyClient.actorConfigs
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Number} [options.desc] - If 1 then the objects are sorted by the createdAt field in descending order.
     * @param callback
     * @returns {PaginationList}
     */
    listActorConfigs: (requestPromise, options) => {
        const { baseUrl, token, offset, limit, desc } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(limit, 'limit', 'Maybe Number');
        checkParamOrThrow(offset, 'offset', 'Maybe Number');
        checkParamOrThrow(desc, 'desc', 'Maybe Boolean');

        const query = { token };

        if (limit) query.limit = limit;
        if (offset) query.offset = offset;
        if (desc) query.desc = 1;

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}`,
            json: true,
            method: 'GET',
            qs: query,
        })
            .then(pluckData)
            .then(parseDateFields);
    },

    /**
     * Creates a new actor config.
     *
     * @memberof ApifyClient.actorConfigs
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {Object} options.actorConfig Object containing configuration of the actor config
     * @param callback
     * @returns {ActorConfig}
     */
    createActorConfig: (requestPromise, options) => {
        const { baseUrl, token, actorConfig } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(actorConfig, 'actorConfig', 'Object');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}`,
            json: true,
            method: 'POST',
            qs: { token },
            body: actorConfig,
        })
            .then(pluckData)
            .then(parseDateFields);
    },

    /**
     * Updates actorConfig.
     *
     * @memberof ApifyClient.actorConfig
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actorConfigId - Unique actorConfig ID
     * @param {Object} options.actorConfig
     * @param callback
     * @returns {ActorConfig}
     */
    updateActorConfig: (requestPromise, options) => {
        const { baseUrl, token, actorConfigId, actorConfig } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(token, 'token', 'String');

        if (actorConfigId) checkParamOrThrow(actorConfigId, 'actorConfigId', 'String');
        else if (actorConfig) checkParamOrThrow(actorConfig.id, 'actorConfig.id', 'String');
        // this is here so that readable error is throws when id is not provided
        else checkParamOrThrow(actorConfigId, 'actorConfigId', 'String');

        const safeActorConfigId = replaceSlashWithTilde(!actorConfigId && actorConfig.id ? actorConfig.id : actorConfigId);

        checkParamOrThrow(actorConfig, 'actorConfig', 'Object');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${safeActorConfigId}`,
            json: true,
            method: 'PUT',
            qs: { token },
            body: _.omit(actorConfig, 'id'),
        })
            .then(pluckData)
            .then(parseDateFields);
    },

    /**
     * Deletes actorConfig.
     *
     * @memberof ApifyClient.actorConfig
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actorConfigId - Unique actorConfig ID
     * @param callback
     */
    deleteActorConfig: (requestPromise, options) => {
        const { baseUrl, token, actorConfigId } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(actorConfigId, 'actorConfigId', 'String');

        const safeActorConfigId = replaceSlashWithTilde(actorConfigId);

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${safeActorConfigId}`,
            json: true,
            method: 'DELETE',
            qs: { token },
        })
            .then(parseDateFields);
    },

    /**
     * Gets actorConfig object.
     *
     * @memberof ApifyClient.actorConfig
     * @instance
     * @param {Object} options
     * @param {String} options.token Optional
     * @param {String} options.actorConfigId - Unique actorConfig ID
     * @param callback
     * @returns {ActorConfig}
     */
    getActorConfig: (requestPromise, options) => {
        const { baseUrl, token, actorConfigId } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(actorConfigId, 'actorConfigId', 'String');

        const safeActorConfigId = replaceSlashWithTilde(actorConfigId);

        const qs = {};
        if (token) qs.token = token;

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${safeActorConfigId}`,
            json: true,
            method: 'GET',
            qs,
        })
            .then(pluckData)
            .then(parseDateFields)
            .catch(catchNotFoundOrThrow);
    },

    /**
     * Gets list of actorConfig runs.
     *
     * By default, the objects are sorted by the startedAt field in ascending order,
     * therefore you can use pagination to incrementally fetch all builds while new ones are still being created.
     * To sort them in descending order, use desc: 1 parameter.
     *
     * The endpoint supports pagination using limit and offset parameters and it will not return more than 1000 array elements.
     *
     * @memberof ApifyClient.actorConfig
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actorConfigId - Unique actorConfig ID
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Number} [options.desc] - If 1 then the objects are sorted by the createdAt field in descending order.
     * @param callback
     * @returns {PaginationList}
     */
    listActorConfigRuns: (requestPromise, options) => {
        const { baseUrl, token, actorConfigId, offset, limit, desc } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(actorConfigId, 'actorConfigId', 'String');
        checkParamOrThrow(limit, 'limit', 'Maybe Number');
        checkParamOrThrow(offset, 'offset', 'Maybe Number');
        checkParamOrThrow(desc, 'desc', 'Maybe Boolean');

        const safeActorConfigId = replaceSlashWithTilde(actorConfigId);
        const query = { token };

        if (limit) query.limit = limit;
        if (offset) query.offset = offset;
        if (desc) query.desc = 1;

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${safeActorConfigId}/runs`,
            json: true,
            method: 'GET',
            qs: query,
        })
            .then(pluckData)
            .then(parseDateFields);
    },

    /**
     * Runs the given actorConfig.
     *
     * @memberof ApifyClient.actorConfig
     * @instance
     * @param {Object} options
     * @param {String} options.actorConfigId - Unique actorConfig ID
     * @param [options.token]
     * @param {Number} [options.waitForFinish] - Number of seconds to wait for actorConfig to finish. Maximum value is 120s.
                                                 If actorConfig doesn't finish in time then actorConfig run in RUNNING state is returned.
     * @param callback
     * @returns {ActRun}
     */
    runActorConfig: (requestPromise, options) => {
        const { baseUrl, token, actorConfigId, waitForFinish } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(actorConfigId, 'actorConfigId', 'String');
        checkParamOrThrow(waitForFinish, 'waitForFinish', 'Maybe Number');

        const safeActorConfigId = replaceSlashWithTilde(actorConfigId);
        const query = {};

        if (waitForFinish) query.waitForFinish = waitForFinish;
        if (token) query.token = token;

        const opts = {
            url: `${baseUrl}${BASE_PATH}/${safeActorConfigId}/runs`,
            method: 'POST',
            qs: query,
        };

        return requestPromise(opts)
            .then(response => JSON.parse(response))
            .then(pluckData)
            .then(parseDateFields);
    },
};
