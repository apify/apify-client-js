import _ from 'underscore';
import { checkParamOrThrow, pluckData, catchNotFoundOrThrow, encodeBody } from './utils';

/**
 * Acts
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
 *      const crawler = await apifyClient.acts.listActs({});
 *      // Do something acts list ...
 * } catch (err) {
 *      // Do something with error ...
 * }
 *
 * // Promise
 * apifyClient.acts.listActs({})
 * .then((actsList) => {
 *      // Do something actsList ...
 * })
 * .catch((err) => {
 *      // Do something with error ...
 * });
 *
 * // Callback
 * apifyClient.acts.listActs({}, (err, actsList) => {
 *      // Do something with error or actsList ...
 * });
 * ```
 * @namespace acts
 */

export const BASE_PATH = '/v2/acts';
export const MAX_WAIT_FOR_FINISH_SECS = 120; // This is used in Apify.call()

const replaceSlashWithTilde = str => str.replace('/', '~');

export default {
    /**
     * Gets list of your acts.
     * @description By default, the objects are sorted by the createdAt field in ascending order,
     * therefore you can use pagination to incrementally fetch all acts while new ones are still being created.
     * To sort them in descending order, use desc: 1 parameter.
     * The endpoint supports pagination using limit and offset parameters and it will not return more than 1000 array elements.
     * @memberof ApifyClient.acts
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Number} [options.desc] - If 1 then the objects are sorted by the createdAt field in descending order.
     * @param callback
     * @returns {PaginationList}
     */
    listActs: (requestPromise, options) => {
        const { baseUrl, token, offset, limit, desc } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(limit, 'limit', 'Maybe Number');
        checkParamOrThrow(offset, 'offset', 'Maybe Number');
        checkParamOrThrow(desc, 'desc', 'Maybe Boolean');

        const query = { token };

        if (limit) query.limit = limit;
        if (offset) query.offset = offset;
        if (desc) query.desc = desc;

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}`,
            json: true,
            method: 'GET',
            qs: query,
        })
        .then(pluckData);
    },

    /**
     * Creates a new act.
     *
     * @memberof ApifyClient.acts
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {Object} options.act
     * @param callback
     * @returns {Act}
     */
    createAct: (requestPromise, options) => {
        const { baseUrl, token, act } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(act, 'act', 'Object');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}`,
            json: true,
            method: 'POST',
            qs: { token },
            body: act,
        })
        .then(pluckData);
    },

    /**
     * Updates act.
     *
     * @memberof ApifyClient.acts
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Act ID
     * @param {Object} options.act
     * @param callback
     * @returns {Act}
     */
    updateAct: (requestPromise, options) => {
        const { baseUrl, token, actId, act } = options;
        const safeActId = replaceSlashWithTilde(!actId && act.id ? act.id : actId);

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(safeActId, 'actId', 'String');
        checkParamOrThrow(act, 'act', 'Object');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${safeActId}`,
            json: true,
            method: 'PUT',
            qs: { token },
            body: _.omit(act, 'id'),
        })
        .then(pluckData);
    },

    /**
     * Deletes act.
     *
     * @memberof ApifyClient.acts
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Act ID
     * @param callback
     */
    deleteAct: (requestPromise, options) => {
        const { baseUrl, token, actId } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(actId, 'actId', 'String');

        const safeActId = replaceSlashWithTilde(actId);

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${safeActId}`,
            json: true,
            method: 'DELETE',
            qs: { token },
        });
    },

    /**
     * Gets act object.
     *
     * @memberof ApifyClient.acts
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Act ID
     * @param callback
     * @returns {Act}
     */
    getAct: (requestPromise, options) => {
        const { baseUrl, token, actId } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(actId, 'actId', 'String');

        const safeActId = replaceSlashWithTilde(actId);

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${safeActId}`,
            json: true,
            method: 'GET',
            qs: { token },
        })
        .then(pluckData)
        .catch(catchNotFoundOrThrow);
    },

    /**
     * Gets list of act runs.
     * @descriptions By default, the objects are sorted by the startedAt field in ascending order,
     * therefore you can use pagination to incrementally fetch all builds while new ones are still being created.
     * To sort them in descending order, use desc: 1 parameter.
     * The endpoint supports pagination using limit and offset parameters and it will not return more than 1000 array elements.
     * @memberof ApifyClient.acts
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Act ID
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Number} [options.desc] - If 1 then the objects are sorted by the createdAt field in descending order.
     * @param callback
     * @returns {PaginationList}
     */
    listRuns: (requestPromise, options) => {
        const { baseUrl, token, actId, offset, limit, desc } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(limit, 'limit', 'Maybe Number');
        checkParamOrThrow(offset, 'offset', 'Maybe Number');
        checkParamOrThrow(desc, 'desc', 'Maybe Boolean');

        const safeActId = replaceSlashWithTilde(actId);
        const query = { token };

        if (limit) query.limit = limit;
        if (offset) query.offset = offset;
        if (desc) query.desc = desc;

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${safeActId}/runs`,
            json: true,
            method: 'GET',
            qs: query,
        })
        .then(pluckData);
    },

    /**
     * Runs the latest build of given act.
     *
     * @memberof ApifyClient.acts
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Act ID
     * @param {string|Object|Buffer} body - Act input
     * @param {Boolean} [useRawBody] - If true, method encodes options.body depends on options.contentType.
     * @param {String} [options.contentType] - Content type of act input e.g 'application/json'
     * @param callback
     * @returns {ActRun}
     */
    // TODO: Ensure that body is null or string or buffer
    runAct: (requestPromise, options) => {
        const { baseUrl, token, actId, contentType, body, useRawBody, waitForFinish, timeout, memory, build } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(contentType, 'contentType', 'Maybe String');
        checkParamOrThrow(useRawBody, 'useRawBody', 'Maybe Boolean');
        checkParamOrThrow(waitForFinish, 'waitForFinish', 'Maybe Number');
        checkParamOrThrow(timeout, 'timeout', 'Maybe Number');
        checkParamOrThrow(memory, 'memory', 'Maybe Number');
        checkParamOrThrow(build, 'build', 'Maybe String');

        const safeActId = replaceSlashWithTilde(actId);
        const query = { token };

        if (waitForFinish) query.waitForFinish = waitForFinish;
        if (timeout) query.timeout = timeout;
        if (memory) query.memory = memory;
        if (build) query.build = build;

        const opts = {
            url: `${baseUrl}${BASE_PATH}/${safeActId}/runs`,
            method: 'POST',
            qs: query,
        };

        if (contentType) opts.headers = { 'Content-Type': contentType };

        if (body) {
            const encodedBody = useRawBody ? body : encodeBody(body, contentType);

            checkParamOrThrow(encodedBody, 'body', 'Buffer | String');

            opts.body = encodedBody;
        }

        return requestPromise(opts)
        .then(response => JSON.parse(response))
        .then(pluckData);
    },

    /**
     * Gets act run.
     *
     * @memberof ApifyClient.acts
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Act ID
     * @param {String} options.runId - Act run ID
     * @param callback
     * @returns {ActRun}
     */
    getRun: (requestPromise, options) => {
        const { baseUrl, token, actId, runId, waitForFinish } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(runId, 'runId', 'String');
        checkParamOrThrow(waitForFinish, 'waitForFinish', 'Maybe Number');

        const safeActId = replaceSlashWithTilde(actId);
        const query = { token };

        if (waitForFinish) query.waitForFinish = waitForFinish;

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${safeActId}/runs/${runId}`,
            json: true,
            method: 'GET',
            qs: query,
        })
        .then(pluckData)
        .catch(catchNotFoundOrThrow);
    },

    /**
     * Gets list of act builds.
     * @descriptions By default, the objects are sorted by the startedAt field in ascending order,
     * therefore you can use pagination to incrementally fetch all builds while new ones are still being created.
     * To sort them in descending order, use desc: 1 parameter.
     * The endpoint supports pagination using limit and offset parameters and it will not return more than 1000 array elements.
     * @memberof ApifyClient.acts
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Act ID
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Number} [options.desc] - If 1 then the objects are sorted by the createdAt field in descending order.
     * @param callback
     * @returns {PaginationList}
     */
    listBuilds: (requestPromise, options) => {
        const { baseUrl, token, actId, offset, limit, desc } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(limit, 'limit', 'Maybe Number');
        checkParamOrThrow(offset, 'offset', 'Maybe Number');
        checkParamOrThrow(desc, 'desc', 'Maybe Boolean');

        const safeActId = replaceSlashWithTilde(actId);
        const query = { token };

        if (limit) query.limit = limit;
        if (offset) query.offset = offset;
        if (desc) query.desc = desc;

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${safeActId}/builds`,
            json: true,
            method: 'GET',
            qs: query,
        })
        .then(pluckData);
    },

    /**
     * Builds given act and returns object of that build.
     *
     * @memberof ApifyClient.acts
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Act ID
     * @param callback
     * @returns {ActBuild}
     */
    buildAct: (requestPromise, options) => {
        const { baseUrl, token, actId, waitForFinish, version } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(version, 'version', 'String');
        checkParamOrThrow(waitForFinish, 'waitForFinish', 'Maybe Number');

        const safeActId = replaceSlashWithTilde(actId);
        const query = { token, version };

        if (waitForFinish) query.waitForFinish = waitForFinish;

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${safeActId}/builds`,
            json: true,
            method: 'POST',
            qs: query,
        })
        .then(pluckData);
    },

    /**
     * Gets act build.
     *
     * @memberof ApifyClient.acts
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Act ID
     * @param {String} options.buildId - Act build ID
     * @param callback
     * @returns {ActBuild}
     */
    getBuild: (requestPromise, options) => {
        const { baseUrl, token, actId, buildId, waitForFinish } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(buildId, 'buildId', 'String');
        checkParamOrThrow(waitForFinish, 'waitForFinish', 'Maybe Number');

        const safeActId = replaceSlashWithTilde(actId);
        const query = { token };

        if (waitForFinish) query.waitForFinish = waitForFinish;

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${safeActId}/builds/${buildId}`,
            json: true,
            method: 'GET',
            qs: query,
        })
        .then(pluckData)
        .catch(catchNotFoundOrThrow);
    },

};
