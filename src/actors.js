import _ from 'lodash';
import log from 'apify-shared/log';
import { checkParamOrThrow, pluckData, parseDateFields, catchNotFoundOrThrow, stringifyWebhooksToBase64 } from './utils';

/**
 * Actors
 * @memberOf ApifyClient
 * @description
 * ### Basic usage
 * ```javascript
 * const ApifyClient = require('apify-client');
 *
 * const apifyClient = new ApifyClient({
 *  userId: 'jklnDMNKLekk',
 *  token: 'SNjkeiuoeD443lpod68dk',
 * });
 *
 * try {
 *      const crawler = await apifyClient.actors.listActors({});
 *      // Do something with actors list ...
 * } catch (err) {
 *      // Do something with error ...
 * }
 * ```
 * @namespace actors
 */

const replaceSlashWithTilde = str => str.replace('/', '~');

export default class Actors {
    constructor(httpClient) {
        this.basePath = '/v2/acts';
        this.client = httpClient;
    }

    _getCallOptions(userOptions, endpointOptions) {
        const { baseUrl, token } = userOptions;
        const callOptions = {
            authRequired: true,
            basePath: this.basePath,
            json: true,
            ...endpointOptions,
        };
        if (baseUrl) callOptions.baseUrl = baseUrl;
        if (token) callOptions.token = token;
        return callOptions;
    }

    _logDeprecated(oldMethod, newMethod) {
        log.deprecated(`apifyClient.acts.${oldMethod}() is deprecated. Use apifyClient.actors.${newMethod}() instead.`);
    }

    /**
     * Gets list of your actors.
     * @description By default, the objects are sorted by the createdAt field in ascending order,
     * therefore you can use pagination to incrementally fetch all actors while new ones are still being created.
     * To sort them in descending order, use desc: `true` parameter.
     * The endpoint supports pagination using limit and offset parameters and it will not return more than 1000 array elements.
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Boolean} [options.desc] - If `true` then the objects are sorted by the createdAt field in descending order.
     * @returns {Promise<PaginationList>}
     */
    async listActors(options) {
        const { offset, limit, desc } = options;

        checkParamOrThrow(limit, 'limit', 'Maybe Number');
        checkParamOrThrow(offset, 'offset', 'Maybe Number');
        checkParamOrThrow(desc, 'desc', 'Maybe Boolean');

        const query = {};

        if (limit) query.limit = limit;
        if (offset) query.offset = offset;
        if (desc) query.desc = 1;

        const endpointOptions = {
            url: '',
            method: 'GET',
            qs: query,
        };

        const callOptions = this._getCallOptions(options, endpointOptions);

        const response = await this.client.call(callOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * @ignore
     * @deprecated
     */
    listActs(options) {
        log.deprecated('apifyClient.acts.listActs is deprecated. Use apifyClient.actors.listActors instead.');
        return this.listActors(options);
    }

    /**
     * Creates a new actor.
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param {Object} options.actor
     * @returns {Actor}
     */
    async createActor(options) {
        const actor = options.actor || options.act;

        checkParamOrThrow(actor, 'actor', 'Object');

        const endpointOptions = {
            url: '',
            method: 'POST',
            body: actor,
        };

        const callOptions = this._getCallOptions(options, endpointOptions);

        const response = await this.client.call(callOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * @ignore
     * @deprecated
     */
    createAct(options) {
        log.deprecated('apifyClient.acts.createAct is deprecated. Use apifyClient.actors.createActor instead.');
        return this.createActor(options);
    }

    /**
     * Updates act.
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param {String} options.actorId - Unique actor ID
     * @param {Object} options.actor
     * @returns {Actor}
     */
    async updateActor(options) {
        const actorId = options.actorId || options.actId;
        const actor = options.actor || options.act;
        const safeActorId = replaceSlashWithTilde(!actorId && actor.id ? actor.id : actorId);

        checkParamOrThrow(safeActorId, 'actorId', 'String');
        checkParamOrThrow(actor, 'actor', 'Object');

        const endpointOptions = {
            url: `/${safeActorId}`,
            method: 'PUT',
            body: _.omit(actor, 'id'),
        };

        const callOptions = this._getCallOptions(options, endpointOptions);

        const response = await this.client.call(callOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * @ignore
     * @deprecated
     */
    updateAct(options) {
        log.deprecated('apifyClient.acts.updateAct is deprecated. Use apifyClient.actors.updateActor instead.');
        return this.updateActor(options);
    }

    /**
     * Deletes act.
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Unique actor ID
     */
    deleteActor(options) {
        const { baseUrl, token, actId } = options;

        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(token, 'token', 'String');

        const safeActorId = replaceSlashWithTilde(actId);

        return this.client.call({
            baseUrl,
            basePath: this.basePath,
            url: `/${safeActorId}`,
            json: true,
            method: 'DELETE',
            qs: { token },
        })
            .then(parseDateFields);
    }

    /**
     * @ignore
     * @deprecated
     */
    deleteAct(options) {
        log.deprecated('apifyClient.acts.deleteAct is deprecated. Use apifyClient.actors.deleteActor instead.');
        return this.deleteActor(options);
    }

    /**
     * Gets actor object.
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Unique actor ID
     * @returns {Actor}
     */
    getActor(options) {
        const { baseUrl, token, actId } = options;


        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(token, 'token', 'String');

        const safeActorId = replaceSlashWithTilde(actId);

        return this.client.call({
            baseUrl,
            basePath: this.basePath,
            url: `/${safeActorId}`,
            json: true,
            method: 'GET',
            qs: { token },
        })
            .then(pluckData)
            .then(parseDateFields)
            .catch(catchNotFoundOrThrow);
    }

    /**
     * @ignore
     * @deprecated
     */
    getAct(options) {
        log.deprecated('apifyClient.acts.getAct is deprecated. Use apifyClient.actors.getActor instead.');
        return this.getActor(options);
    }

    /**
     * Gets list of actor runs.
     *
     * By default, the objects are sorted by the startedAt field in ascending order,
     * therefore you can use pagination to incrementally fetch all builds while new ones are still being created.
     * To sort them in descending order, use desc: `true` parameter.
     *
     * The endpoint supports pagination using limit and offset parameters and it will not return more than 1000 array elements.
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Unique actor ID
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Boolean} [options.desc] - If `true` then the objects are sorted by the createdAt field in descending order.
     * @returns {PaginationList}
     */
    listRuns(options) {
        const { baseUrl, token, actId, offset, limit, desc } = options;


        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(limit, 'limit', 'Maybe Number');
        checkParamOrThrow(offset, 'offset', 'Maybe Number');
        checkParamOrThrow(desc, 'desc', 'Maybe Boolean');

        const safeActorId = replaceSlashWithTilde(actId);
        const query = { token };

        if (limit) query.limit = limit;
        if (offset) query.offset = offset;
        if (desc) query.desc = 1;

        return this.client.call({
            baseUrl,
            basePath: this.basePath,
            url: `/${safeActorId}/runs`,
            json: true,
            method: 'GET',
            qs: query,
        })
            .then(pluckData)
            .then(parseDateFields);
    }

    /**
     * Runs the latest build of given act.
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param {String} options.actId - Unique actor ID
     * @param [options.token]
     * @param {String|Buffer} [options.body] - Actor input, passed as HTTP POST payload
     * @param {String} [options.contentType] - Content type of actor input e.g 'application/json'
     * @param {Number} [options.waitForFinish] - Number of seconds to wait for actor to finish. Maximum value is 120s.
                                                 If actor doesn't finish in time then actor run in RUNNING state is returned.
     * @param {Number} [options.timeout] - Timeout for the actor run in seconds. Zero value means there is no timeout.
     * @param {Number} [options.memory] - Amount of memory allocated for the actor run, in megabytes.
     * @param {String} [options.build] - Tag or number of the build to run (e.g. <code>latest</code> or <code>1.2.34</code>).
     * @param {Array}  [options.webhooks] - Specifies optional webhooks associated with the actor run,
     *                                      which can be used to receive a notification e.g. when the actor finished or failed,
     *                                      see {@link https://apify.com/docs/webhooks#adhoc|ad hook webhooks documentation} for detailed description.
     * @returns {ActorRun}
     */
    runActor(options) {
        const { baseUrl, token, actId, contentType, body, waitForFinish, timeout, memory, build, webhooks } = options;


        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(token, 'token', 'Maybe String');
        checkParamOrThrow(contentType, 'contentType', 'Maybe String');
        checkParamOrThrow(waitForFinish, 'waitForFinish', 'Maybe Number');
        checkParamOrThrow(timeout, 'timeout', 'Maybe Number');
        checkParamOrThrow(memory, 'memory', 'Maybe Number');
        checkParamOrThrow(build, 'build', 'Maybe String');
        checkParamOrThrow(webhooks, 'webhooks', 'Maybe Array');

        const safeActorId = replaceSlashWithTilde(actId);
        const query = {};

        if (waitForFinish) query.waitForFinish = waitForFinish;
        if (timeout) query.timeout = timeout;
        if (memory) query.memory = memory;
        if (build) query.build = build;
        if (token) query.token = token;
        if (webhooks) query.webhooks = stringifyWebhooksToBase64(webhooks);

        const opts = {
            baseUrl,
            basePath: this.basePath,
            url: `/${safeActorId}/runs`,
            method: 'POST',
            qs: query,
        };

        if (contentType) opts.headers = { 'Content-Type': contentType };

        if (body) {
            checkParamOrThrow(body, 'body', 'Buffer | String');

            opts.body = body;
        }

        return this.client.call(opts)
            .then(response => JSON.parse(response))
            .then(pluckData)
            .then(parseDateFields);
    }

    /**
     * @ignore
     * @deprecated
     */
    runAct(options) {
        log.deprecated('apifyClient.acts.runAct is deprecated. Use apifyClient.actors.runActor instead.');
        return this.runActor(options);
    }

    /**
     * Gets actor run.
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param {String} options.actId - Unique actor ID
     * @param {String} options.runId - Unique run ID
     * @param [options.token]
     * @param {Number} [options.waitForFinish] - Number of seconds to wait for actor to finish. Maximum value is 120s.
                                                 If actor doesn't finish in time then actor run in RUNNING state is returned.
     * @returns {ActorRun}
     */
    getRun(options) {
        const { baseUrl, token, actId, runId, waitForFinish } = options;


        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(runId, 'runId', 'String');
        checkParamOrThrow(token, 'token', 'Maybe String');
        checkParamOrThrow(waitForFinish, 'waitForFinish', 'Maybe Number');

        const safeActorId = replaceSlashWithTilde(actId);
        const query = {};

        if (token) query.token = token;
        if (waitForFinish) query.waitForFinish = waitForFinish;

        return this.client.call({
            baseUrl,
            basePath: this.basePath,
            url: `/${safeActorId}/runs/${runId}`,
            json: true,
            method: 'GET',
            qs: query,
        })
            .then(pluckData)
            .then(parseDateFields)
            .catch(catchNotFoundOrThrow);
    }

    /**
     * Abort actor run.
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param {String} options.actId - Unique actor ID
     * @param {String} options.runId - Unique run ID
     * @param [options.token]
     * @returns {ActorRun}
     */
    abortRun(options) {
        const { baseUrl, token, actId, runId } = options;


        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(runId, 'runId', 'String');
        checkParamOrThrow(token, 'token', 'Maybe String');

        const safeActorId = replaceSlashWithTilde(actId);
        const query = {};

        if (token) query.token = token;

        return this.client.call({
            baseUrl,
            basePath: this.basePath,
            url: `/${safeActorId}/runs/${runId}/abort`,
            json: true,
            method: 'POST',
            qs: query,
        })
            .then(pluckData)
            .then(parseDateFields);
    }

    /**
     * Transforms the actor run to an actor run of a given actor.
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param {String} options.actId - Unique actor ID
     * @param options.token
     * @param {String} options.runId - ID a an actor run to metamorph.
     * @param {String} options.targetActorId - ID of an actor to which run should metamorph.
     * @param {String|Buffer} [options.body] - Actor input, passed as HTTP POST payload
     * @param {String} [options.contentType] - Content type of actor input e.g 'application/json'
     * @param {String} [options.build] - Tag or number of the build to run (e.g. <code>latest</code> or <code>1.2.34</code>).
     * @returns {ActorRun}
     */
    metamorphRun(options) {
        const { baseUrl, token, actId, runId, targetActorId, contentType, body, build } = options;


        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(runId, 'runId', 'String');
        checkParamOrThrow(targetActorId, 'targetActorId', 'String');
        checkParamOrThrow(contentType, 'contentType', 'Maybe String');
        checkParamOrThrow(build, 'build', 'Maybe String');

        const safeActorId = replaceSlashWithTilde(actId);
        const safeTargetActorId = replaceSlashWithTilde(targetActorId);

        const query = {
            token,
            targetActorId: safeTargetActorId,
        };
        if (build) query.build = build;

        const opts = {
            baseUrl,
            basePath: this.basePath,
            url: `/${safeActorId}/runs/${runId}/metamorph`,
            method: 'POST',
            qs: query,
        };

        if (contentType) opts.headers = { 'Content-Type': contentType };

        if (body) {
            checkParamOrThrow(body, 'body', 'Buffer | String');

            opts.body = body;
        }

        return this.client.call(opts)
            .then(response => JSON.parse(response))
            .then(pluckData)
            .then(parseDateFields);
    }

    /**
     * Resurrects finished (even failed) actor run.
     * Container gets restarted with original storages.
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param {String} options.actId - Unique actor ID
     * @param {String} options.runId - Unique run ID
     * @param [options.token]
     * @returns {ActorRun}
     */
    resurrectRun(options) {
        const { baseUrl, token, actId, runId } = options;


        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(runId, 'runId', 'String');
        checkParamOrThrow(token, 'token', 'Maybe String');

        const safeActorId = replaceSlashWithTilde(actId);
        const query = {};

        if (token) query.token = token;

        return this.client.call({
            baseUrl,
            basePath: this.basePath,
            url: `/${safeActorId}/runs/${runId}/resurrect`,
            json: true,
            method: 'POST',
            qs: query,
        })
            .then(pluckData)
            .then(parseDateFields);
    }

    /**
     * Gets list of actor builds.
     *
     * By default, the objects are sorted by the startedAt field in ascending order,
     * therefore you can use pagination to incrementally fetch all builds while new ones are still being created.
     * To sort them in descending order, use desc: `true` parameter.
     *
     * The endpoint supports pagination using limit and offset parameters and it will not return more than 1000 array elements.
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Unique actor ID
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Boolean} [options.desc] - If `true` then the objects are sorted by the createdAt field in descending order.
     * @returns {PaginationList}
     */
    listBuilds(options) {
        const { baseUrl, token, actId, offset, limit, desc } = options;


        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(limit, 'limit', 'Maybe Number');
        checkParamOrThrow(offset, 'offset', 'Maybe Number');
        checkParamOrThrow(desc, 'desc', 'Maybe Boolean');

        const safeActorId = replaceSlashWithTilde(actId);
        const query = { token };

        if (limit) query.limit = limit;
        if (offset) query.offset = offset;
        if (desc) query.desc = 1;

        return this.client.call({
            baseUrl,
            basePath: this.basePath,
            url: `/${safeActorId}/builds`,
            json: true,
            method: 'GET',
            qs: query,
        })
            .then(pluckData)
            .then(parseDateFields);
    }

    /**
     * Builds given actor and returns object of that build.
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Unique actor ID
     * @param {String} options.version - Version of the actor to build.
     * @param {Boolean} [options.betaPackages] - If true, the Docker container will be rebuild using layer cache.
                                                 This is to enable quick rebuild during development.
     * @param {Boolean} [options.useCache] - If true, Docker build uses beta versions of 'apify-client' and
                                             'apify' NPM packages, to test new features.
     * @param {String} [options.tag] - Tag that is applied to the build on success.
     *                                 It enables callers of actors to specify which version of actor to run.
     betaPackages
     useCache
     tag
     * @param {Number} [options.waitForFinish] - Number of seconds to wait for actor to finish. Maximum value is 120s.
                                                 If actor doesn't finish in time then actor run in RUNNING state is returned.
     * @returns {ActorBuild}
     */
    buildActor(options) {
        const { baseUrl, token, actId, waitForFinish, version, tag, betaPackages, useCache } = options;


        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(version, 'version', 'String');
        checkParamOrThrow(waitForFinish, 'waitForFinish', 'Maybe Number');
        checkParamOrThrow(tag, 'tag', 'Maybe String');
        checkParamOrThrow(betaPackages, 'betaPackages', 'Maybe Boolean');
        checkParamOrThrow(useCache, 'useCache', 'Maybe Boolean');

        const safeActorId = replaceSlashWithTilde(actId);
        const query = { token, version };

        if (waitForFinish) query.waitForFinish = waitForFinish;
        if (betaPackages) query.betaPackages = 1;
        if (useCache) query.useCache = 1;
        if (tag) query.tag = tag;

        return this.client.call({
            baseUrl,
            basePath: this.basePath,
            url: `/${safeActorId}/builds`,
            json: true,
            method: 'POST',
            qs: query,
        })
            .then(pluckData)
            .then(parseDateFields);
    }

    /**
     * @ignore
     * @deprecated
     */
    buildAct(options) {
        log.deprecated('apifyClient.acts.buildAct is deprecated. Use apifyClient.actors.buildActor instead.');
        return this.buildActor(options);
    }

    /**
     * Gets actor build.
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Unique actor ID
     * @param {String} options.buildId - Unique build ID
     * @param {Number} [options.waitForFinish] - Number of seconds to wait for actor to finish. Maximum value is 120s.
                                                 If actor doesn't finish in time then actor run in RUNNING state is returned.
     * @returns {ActorBuild}
     */
    getBuild(options) {
        const { baseUrl, token, actId, buildId, waitForFinish } = options;


        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(buildId, 'buildId', 'String');
        checkParamOrThrow(waitForFinish, 'waitForFinish', 'Maybe Number');

        const safeActorId = replaceSlashWithTilde(actId);
        const query = { token };

        if (waitForFinish) query.waitForFinish = waitForFinish;

        return this.client.call({
            baseUrl,
            basePath: this.basePath,
            url: `/${safeActorId}/builds/${buildId}`,
            json: true,
            method: 'GET',
            qs: query,
        })
            .then(pluckData)
            .then(parseDateFields)
            .catch(catchNotFoundOrThrow);
    }

    /**
     * Abort actor build.
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Unique actor ID
     * @param {String} options.buildId - Unique build ID
     * @returns {ActorBuild}
     */
    abortBuild(options) {
        const { baseUrl, token, actId, buildId } = options;


        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(buildId, 'buildId', 'String');

        const safeActorId = replaceSlashWithTilde(actId);
        const query = { token };

        return this.client.call({
            baseUrl,
            basePath: this.basePath,
            url: `/${safeActorId}/builds/${buildId}/abort`,
            json: true,
            method: 'POST',
            qs: query,
        })
            .then(pluckData)
            .then(parseDateFields);
    }

    /**
     * Gets the list of versions of a specific act.
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Unique actor ID
     * @return {PaginationList}
     */
    listActorVersions(options) {
        const { baseUrl, token, actId } = options;


        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(token, 'token', 'Maybe String');

        const safeActorId = replaceSlashWithTilde(actId);

        return this.client.call({
            baseUrl,
            basePath: this.basePath,
            url: `/${safeActorId}/versions`,
            json: true,
            method: 'GET',
            qs: token ? { token } : {},
        })
            .then(pluckData)
            .then(parseDateFields);
    }

    /**
     * @ignore
     * @deprecated
     */
    listActVersions(options) {
        log.deprecated('apifyClient.acts.listActVersions is deprecated. Use apifyClient.actors.listActorVersions instead.');
        return this.listActorVersions(options);
    }

    /**
     * Creates an actor version.
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Unique actor ID
     * @param {Object} options.actVersion - Actor version
     * @return {ActorVersion}
     */
    createActorVersion(options) {
        const { baseUrl, token, actId, actVersion } = options;


        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(actVersion, 'actVersion', 'Object');

        const safeActorId = replaceSlashWithTilde(actId);

        return this.client.call({
            baseUrl,
            basePath: this.basePath,
            url: `/${safeActorId}/versions`,
            json: true,
            method: 'POST',
            body: actVersion,
            qs: { token },
        })
            .then(pluckData)
            .then(parseDateFields);
    }

    /**
     * @ignore
     * @deprecated
     */
    createActVersion(options) {
        log.deprecated('apifyClient.acts.createActVersion is deprecated. Use apifyClient.actors.createActorVersion instead.');
        return this.createActorVersion(options);
    }

    /**
     * Gets an actor version.
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Unique actor ID
     * @param {String} options.versionNumber - Version number of actor version
     * @return {ActorVersion}
     */
    getActorVersion(options) {
        const { baseUrl, token, actId, versionNumber } = options;


        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(token, 'token', 'Maybe String');
        checkParamOrThrow(versionNumber, 'versionNumber', 'String');

        const safeActorId = replaceSlashWithTilde(actId);

        return this.client.call({
            baseUrl,
            basePath: this.basePath,
            url: `/${safeActorId}/versions/${versionNumber}`,
            json: true,
            method: 'GET',
            qs: token ? { token } : {},
        })
            .then(pluckData)
            .then(parseDateFields)
            .catch(catchNotFoundOrThrow);
    }

    /**
     * @ignore
     * @deprecated
     */
    getActVersion(options) {
        log.deprecated('apifyClient.acts.getActVersion is deprecated. Use apifyClient.actors.getActorVersion instead.');
        return this.getActorVersion(options);
    }

    /**
     * Updates an actor version.
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Unique actor ID
     * @param {String} options.versionNumber - Version number of actor version
     * @param {Object} options.actVersion - Actor version
     * @return {ActorVersion}
     */
    updateActorVersion(options) {
        const { baseUrl, token, actId, actVersion, versionNumber } = options;


        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(actVersion, 'actVersion', 'Object');
        checkParamOrThrow(versionNumber, 'versionNumber', 'String');

        const safeActorId = replaceSlashWithTilde(actId);

        return this.client.call({
            baseUrl,
            basePath: this.basePath,
            url: `/${safeActorId}/versions/${versionNumber}`,
            json: true,
            method: 'PUT',
            body: actVersion,
            qs: { token },
        })
            .then(pluckData)
            .then(parseDateFields);
    }

    /**
     * @ignore
     * @deprecated
     */
    updateActVersion(options) {
        log.deprecated('apifyClient.acts.updateActVersion is deprecated. Use apifyClient.actors.updateActorVersion instead.');
        return this.updateActorVersion(options);
    }

    /**
     * Deletes an actor version.
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Unique actor ID
     * @param {String} options.versionNumber - Version number of actor version
     * @return {}
     */
    deleteActorVersion(options) {
        const { baseUrl, token, actId, versionNumber } = options;


        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(versionNumber, 'versionNumber', 'String');

        const safeActorId = replaceSlashWithTilde(actId);

        return this.client.call({
            baseUrl,
            basePath: this.basePath,
            url: `/${safeActorId}/versions/${versionNumber}`,
            json: true,
            method: 'DELETE',
            qs: { token },
        })
            .then(pluckData)
            .then(parseDateFields);
    }

    /**
     * @ignore
     * @deprecated
     */
    deleteActVersion(options) {
        log.deprecated('apifyClient.acts.deleteActVersion is deprecated. Use apifyClient.actors.deleteActorVersion instead.');
        return this.deleteActorVersion(options);
    }

    /**
     * Gets list of webhooks for given actor.
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param options.token
     * @param {String} options.actId - Unique actor ID
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Boolean} [options.desc] - If `true` then the objects are sorted by the createdAt field in descending order.
     * @returns {PaginationList}
     */
    listWebhooks(options) {
        const { baseUrl, token, actId, offset, limit, desc } = options;


        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(limit, 'limit', 'Maybe Number');
        checkParamOrThrow(offset, 'offset', 'Maybe Number');
        checkParamOrThrow(desc, 'desc', 'Maybe Boolean');

        const safeActorId = replaceSlashWithTilde(actId);
        const query = { token };

        if (limit) query.limit = limit;
        if (offset) query.offset = offset;
        if (desc) query.desc = 1;

        return this.client.call({
            baseUrl,
            basePath: this.basePath,
            url: `${safeActorId}/webhooks`,
            json: true,
            method: 'GET',
            qs: query,
        })
            .then(pluckData)
            .then(parseDateFields);
    }
}
