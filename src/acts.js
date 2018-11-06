import _ from 'underscore';
import { checkParamOrThrow, pluckData, parseDateFields, catchNotFoundOrThrow } from './utils';

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
            .then(pluckData)
            .then(parseDateFields);
    },

    /**
     * Updates act.
     *
     * @memberof ApifyClient.acts
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Unique act ID
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
            .then(pluckData)
            .then(parseDateFields);
    },

    /**
     * Deletes act.
     *
     * @memberof ApifyClient.acts
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Unique act ID
     * @param callback
     */
    deleteAct: (requestPromise, options) => {
        const { baseUrl, token, actId } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(token, 'token', 'String');

        const safeActId = replaceSlashWithTilde(actId);

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${safeActId}`,
            json: true,
            method: 'DELETE',
            qs: { token },
        })
            .then(parseDateFields);
    },

    /**
     * Gets act object.
     *
     * @memberof ApifyClient.acts
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Unique act ID
     * @param callback
     * @returns {Act}
     */
    getAct: (requestPromise, options) => {
        const { baseUrl, token, actId } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(token, 'token', 'String');

        const safeActId = replaceSlashWithTilde(actId);

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${safeActId}`,
            json: true,
            method: 'GET',
            qs: { token },
        })
            .then(pluckData)
            .then(parseDateFields)
            .catch(catchNotFoundOrThrow);
    },

    /**
     * Gets list of act runs.
     *
     * By default, the objects are sorted by the startedAt field in ascending order,
     * therefore you can use pagination to incrementally fetch all builds while new ones are still being created.
     * To sort them in descending order, use desc: 1 parameter.
     *
     * The endpoint supports pagination using limit and offset parameters and it will not return more than 1000 array elements.
     *
     * @memberof ApifyClient.acts
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Unique act ID
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
        if (desc) query.desc = 1;

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${safeActId}/runs`,
            json: true,
            method: 'GET',
            qs: query,
        })
            .then(pluckData)
            .then(parseDateFields);
    },

    /**
     * Runs the latest build of given act.
     *
     * @memberof ApifyClient.acts
     * @instance
     * @param {Object} options
     * @param {String} options.actId - Unique act ID
     * @param [options.token]
     * @param {String|Buffer} [options.body] - Act input, passed as HTTP POST payload
     * @param {String} [options.contentType] - Content type of act input e.g 'application/json'
     * @param {Number} [options.waitForFinish] - Number of seconds to wait for act to finish. Maximum value is 120s.
                                                 If act doesn't finish in time then act run in RUNNING state is returned.
     * @param {Number} [options.timeout] - Timeout for the act run in seconds. Zero value means there is no timeout.
     * @param {Number} [options.memory] - Amount of memory allocated for the act run, in megabytes.
     * @param {String} [options.build] - Tag or number of the build to run (e.g. <code>latest</code> or <code>1.2.34</code>).
     * @param callback
     * @returns {ActRun}
     */
    runAct: (requestPromise, options) => {
        const { baseUrl, token, actId, contentType, body, waitForFinish, timeout, memory, build } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(token, 'token', 'Maybe String');
        checkParamOrThrow(contentType, 'contentType', 'Maybe String');
        checkParamOrThrow(waitForFinish, 'waitForFinish', 'Maybe Number');
        checkParamOrThrow(timeout, 'timeout', 'Maybe Number');
        checkParamOrThrow(memory, 'memory', 'Maybe Number');
        checkParamOrThrow(build, 'build', 'Maybe String');

        const safeActId = replaceSlashWithTilde(actId);
        const query = {};

        if (waitForFinish) query.waitForFinish = waitForFinish;
        if (timeout) query.timeout = timeout;
        if (memory) query.memory = memory;
        if (build) query.build = build;
        if (token) query.token = token;

        const opts = {
            url: `${baseUrl}${BASE_PATH}/${safeActId}/runs`,
            method: 'POST',
            qs: query,
        };

        if (contentType) opts.headers = { 'Content-Type': contentType };

        if (body) {
            checkParamOrThrow(body, 'body', 'Buffer | String');

            opts.body = body;
        }

        return requestPromise(opts)
            .then(response => JSON.parse(response))
            .then(pluckData)
            .then(parseDateFields);
    },

    /**
     * Gets act run.
     *
     * @memberof ApifyClient.acts
     * @instance
     * @param {Object} options
     * @param {String} options.actId - Unique act ID
     * @param {String} options.runId - Unique run ID
     * @param [options.token]
     * @param {Number} [options.waitForFinish] - Number of seconds to wait for act to finish. Maximum value is 120s.
                                                 If act doesn't finish in time then act run in RUNNING state is returned.
     * @param callback
     * @returns {ActRun}
     */
    getRun: (requestPromise, options) => {
        const { baseUrl, token, actId, runId, waitForFinish } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(runId, 'runId', 'String');
        checkParamOrThrow(token, 'token', 'Maybe String');
        checkParamOrThrow(waitForFinish, 'waitForFinish', 'Maybe Number');

        const safeActId = replaceSlashWithTilde(actId);
        const query = {};

        if (token) query.token = token;
        if (waitForFinish) query.waitForFinish = waitForFinish;

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${safeActId}/runs/${runId}`,
            json: true,
            method: 'GET',
            qs: query,
        })
            .then(pluckData)
            .then(parseDateFields)
            .catch(catchNotFoundOrThrow);
    },

    /**
     * Abort act run.
     *
     * @memberof ApifyClient.acts
     * @instance
     * @param {Object} options
     * @param {String} options.actId - Unique act ID
     * @param {String} options.runId - Unique run ID
     * @param [options.token]
     * @param callback
     * @returns {ActRun}
     */
    abortRun: (requestPromise, options) => {
        const { baseUrl, token, actId, runId } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(runId, 'runId', 'String');
        checkParamOrThrow(token, 'token', 'Maybe String');

        const safeActId = replaceSlashWithTilde(actId);
        const query = {};

        if (token) query.token = token;

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${safeActId}/runs/${runId}/abort`,
            json: true,
            method: 'POST',
            qs: query,
        })
            .then(pluckData)
            .then(parseDateFields);
    },

    /**
     * Gets list of act builds.
     *
     * By default, the objects are sorted by the startedAt field in ascending order,
     * therefore you can use pagination to incrementally fetch all builds while new ones are still being created.
     * To sort them in descending order, use desc: 1 parameter.
     *
     * The endpoint supports pagination using limit and offset parameters and it will not return more than 1000 array elements.
     *
     * @memberof ApifyClient.acts
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Unique act ID
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
        if (desc) query.desc = 1;

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${safeActId}/builds`,
            json: true,
            method: 'GET',
            qs: query,
        })
            .then(pluckData)
            .then(parseDateFields);
    },

    /**
     * Builds given act and returns object of that build.
     *
     * @memberof ApifyClient.acts
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Unique act ID
     * @param {String} options.version - Version of the act to build.
     * @param {Boolean} [options.betaPackages] - If true, the Docker container will be rebuild using layer cache.
                                                 This is to enable quick rebuild during development.
     * @param {Boolean} [options.useCache] - If true, Docker build uses beta versions of 'apify-client' and
                                             'apify' NPM packages, to test new features.
     * @param {String} [options.tag] - Tag that is applied to the build on success. It enables callers of acts to specify which version of act to run.

     betaPackages
     useCache
     tag
     * @param {Number} [options.waitForFinish] - Number of seconds to wait for act to finish. Maximum value is 120s.
                                                 If act doesn't finish in time then act run in RUNNING state is returned.
     * @param callback
     * @returns {ActBuild}
     */
    buildAct: (requestPromise, options) => {
        const { baseUrl, token, actId, waitForFinish, version, tag, betaPackages, useCache } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(version, 'version', 'String');
        checkParamOrThrow(waitForFinish, 'waitForFinish', 'Maybe Number');
        checkParamOrThrow(tag, 'tag', 'Maybe String');
        checkParamOrThrow(betaPackages, 'betaPackages', 'Maybe Boolean');
        checkParamOrThrow(useCache, 'useCache', 'Maybe Boolean');

        const safeActId = replaceSlashWithTilde(actId);
        const query = { token, version };

        if (waitForFinish) query.waitForFinish = waitForFinish;
        if (betaPackages) query.betaPackages = 1;
        if (useCache) query.useCache = 1;
        if (tag) query.tag = tag;

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${safeActId}/builds`,
            json: true,
            method: 'POST',
            qs: query,
        })
            .then(pluckData)
            .then(parseDateFields);
    },

    /**
     * Gets act build.
     *
     * @memberof ApifyClient.acts
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Unique act ID
     * @param {String} options.buildId - Unique build ID
     * @param {Number} [options.waitForFinish] - Number of seconds to wait for act to finish. Maximum value is 120s.
                                                 If act doesn't finish in time then act run in RUNNING state is returned.
     * @param callback
     * @returns {ActBuild}
     */
    getBuild: (requestPromise, options) => {
        const { baseUrl, token, actId, buildId, waitForFinish } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(token, 'token', 'String');
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
            .then(parseDateFields)
            .catch(catchNotFoundOrThrow);
    },

    /**
     * Abort act build.
     *
     * @memberof ApifyClient.acts
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Unique act ID
     * @param {String} options.buildId - Unique build ID
     * @param callback
     * @returns {ActBuild}
     */
    abortBuild: (requestPromise, options) => {
        const { baseUrl, token, actId, buildId } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(buildId, 'buildId', 'String');

        const safeActId = replaceSlashWithTilde(actId);
        const query = { token };

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${safeActId}/builds/${buildId}/abort`,
            json: true,
            method: 'POST',
            qs: query,
        })
            .then(pluckData)
            .then(parseDateFields);
    },

    /**
     * Gets the list of versions of a specific act.
     *
     * @memberof ApifyClient.acts
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Unique act ID
     * @return {PaginationList}
     */
    listActVersions: (requestPromise, options) => {
        const { baseUrl, token, actId } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(token, 'token', 'Maybe String');

        const safeActId = replaceSlashWithTilde(actId);

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${safeActId}/versions`,
            json: true,
            method: 'GET',
            qs: token ? { token } : {},
        })
            .then(pluckData)
            .then(parseDateFields);
    },

    /**
     * Creates an act version.
     *
     * @memberof ApifyClient.acts
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Unique act ID
     * @param {String} options.actVersion - Act Version
     * @return {ActVersion}
     */
    createActVersion: (requestPromise, options) => {
        const { baseUrl, token, actId, actVersion } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(actVersion, 'actVersion', 'Object');

        const safeActId = replaceSlashWithTilde(actId);

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${safeActId}/versions`,
            json: true,
            method: 'POST',
            body: actVersion,
            qs: { token },
        })
            .then(pluckData)
            .then(parseDateFields);
    },

    /**
     * Gets an act version.
     *
     * @memberof ApifyClient.acts
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Unique act ID
     * @param {String} options.versionNumber - Version number of act version
     * @return {ActVersion}
     */
    getActVersion: (requestPromise, options) => {
        const { baseUrl, token, actId, versionNumber } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(token, 'token', 'Maybe String');
        checkParamOrThrow(versionNumber, 'versionNumber', 'String');

        const safeActId = replaceSlashWithTilde(actId);

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${safeActId}/versions/${versionNumber}`,
            json: true,
            method: 'GET',
            qs: token ? { token } : {},
        })
            .then(pluckData)
            .then(parseDateFields);
    },

    /**
     * Updates an act version.
     *
     * @memberof ApifyClient.acts
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Unique act ID
     * @param {String} options.versionNumber - Version number of act version
     * @param {Object} options.actVersion - Version
     * @return {ActVersion}
     */
    updateActVersion: (requestPromise, options) => {
        const { baseUrl, token, actId, actVersion, versionNumber } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(actVersion, 'actVersion', 'Object');
        checkParamOrThrow(versionNumber, 'versionNumber', 'String');

        const safeActId = replaceSlashWithTilde(actId);

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${safeActId}/versions/${versionNumber}`,
            json: true,
            method: 'PUT',
            body: actVersion,
            qs: { token },
        })
            .then(pluckData)
            .then(parseDateFields);
    },

    /**
     * Deletes an act version.
     *
     * @memberof ApifyClient.acts
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Unique act ID
     * @param {String} options.versionNumber - Version number of act version
     * @return {}
     */
    deleteActVersion: (requestPromise, options) => {
        const { baseUrl, token, actId, versionNumber } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(versionNumber, 'versionNumber', 'String');

        const safeActId = replaceSlashWithTilde(actId);

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${safeActId}/versions/${versionNumber}`,
            json: true,
            method: 'DELETE',
            qs: { token },
        })
            .then(pluckData)
            .then(parseDateFields);
    },
};
