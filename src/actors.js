import omit from 'lodash/omit';
import log from 'apify-shared/log';
import {
    checkParamOrThrow,
    pluckData,
    parseDateFields,
    catchNotFoundOrThrow,
    stringifyWebhooksToBase64,
    replaceSlashWithTilde,
} from './utils';
import Resource from './resource';

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
 *      const crawler = await apifyClient.actors.listActors();
 *      // Do something with actors list ...
 * } catch (err) {
 *      // Do something with error ...
 * }
 * ```
 * @namespace actors
 */

export default class Actors extends Resource {
    constructor(httpClient) {
        super(httpClient, '/v2/acts');
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
     * For more information see the [API V2 blueprint](https://docs.apify.com/api/v2#/reference/actors/actor-collection/get-list-of-actors).
     *
     * **Example**:
     *
     * ```javascript
     *  const actorPaginationList = await client.actors.listActors();
     *  // TODO: this particular endpoint is in the example but I would add some minimal working examples.
     *
     * ```
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Boolean} [options.desc] - If `true` then the objects are sorted by the createdAt field in descending order.
     * @returns {Promise<PaginationList>}
     */
    async listActors(options = {}) {
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

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * @ignore
     * @deprecated
     */
    listActs(options) {
        this._logDeprecated('listActs', 'listActors');
        return this.listActors(options);
    }

    /**
     * Creates a new actor with settings specified in an Actor object (Maybe link instead of example) passed as `options.actor`.
     * The response is the full actor object as returned by the `client.actors.getActor()`.
     * //TODO: We could possible add only link to the endpoint
     * ***Example**:
     *
     * ```javascript
     * const actor = {
     *    "name": "MyActor",
     *    "description": "My favourite actor!",
     *    "isPublic": false,
     *    "title": "My Actor",
     *    "restartOnError": false,
     *    "versions": [
     *     {
     *        "versionNumber": "0.0",
     *        "sourceType": "SOURCE_CODE",
     *        "buildTag": "latest",
     *        "envVars": [
     *          {
     *            "name": "DOMAIN",
     *            "value": "http://example.com",
     *            "isSecret": false
     *          },
     *          {
     *            "key": "SECRET_PASSWORD",
     *            "value": "MyTopSecretPassword123",
     *            "isSecret": true
     *          }
     *        ],
     *        "baseDockerImage": "apify/actor-node-basic",
     *        "applyEnvVarsToBuild": false,
     *        "sourceCode": "console.log('Hello world!');"
     *      }
     *    ]
     *  }
     *
     *  await client.actors.listActors({actor});
     * ```
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param {Object} options.actor
     * @returns {Actor}
     */
    async createActor(options = {}) {
        const actor = options.actor || options.act;

        checkParamOrThrow(actor, 'actor', 'Object');

        const endpointOptions = {
            url: '',
            method: 'POST',
            body: actor,
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * @ignore
     * @deprecated
     */
    createAct(options) {
        this._logDeprecated('createAct', 'createActor');
        return this.createActor(options);
    }

    /**
     * Updates settings of an actor using values specified by an actor object passed as `options.actor`.
     * If the object does not define a specific property, its value will not be updated.
     * The response is the full actor object as returned by the `client.actors.getActor()`.
     * You can pass the id of actor either separately in `options.actorId` or in the actor object itself under the `id` key.
     *
     * For more details see (update actor endpoint)[https://docs.apify.com/api/v2#/reference/actors/actor-object/update-actor]
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a tilde-separated owner's username and actor name
     * @param {Object} options.actor - Updated actor object.
     * @returns {Actor}
     */
    async updateActor(options = {}) {
        const actorId = options.actorId || options.actId;
        const actor = options.actor || options.act;
        checkParamOrThrow(actor, 'actor', 'Object');

        const safeActorId = replaceSlashWithTilde(!actorId && actor.id ? actor.id : actorId);
        checkParamOrThrow(safeActorId, 'actorId', 'String');

        const endpointOptions = {
            url: `/${safeActorId}`,
            method: 'PUT',
            body: omit(actor, 'id'),
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * @ignore
     * @deprecated
     */
    updateAct(options) {
        this._logDeprecated('updateAct', 'updateActor');
        return this.updateActor(options);
    }

    /**
     * Deletes actor.
     *
     * For more details see (delete actor endpoint)[https://docs.apify.com/api/v2#/reference/actors/actor-object/delete-actor]
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a tilde-separated owner's username and actor name
     */
    async deleteActor(options = {}) {
        const actorId = options.actorId || options.actId;

        checkParamOrThrow(actorId, 'actorId', 'String');

        const safeActorId = replaceSlashWithTilde(actorId);

        const endpointOptions = {
            url: `/${safeActorId}`,
            method: 'DELETE',
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(response);
    }

    /**
     * @ignore
     * @deprecated
     */
    deleteAct(options) {
        this._logDeprecated('deleteAct', 'deleteActor');
        return this.deleteActor(options);
    }

    /**
     * Gets an object that contains all the details about a specific actor.
     *
     * For more details see (get actor endpoint)[https://docs.apify.com/api/v2#/reference/actors/actor-object/get-actor]
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a tilde-separated owner's username and actor name.
     * @returns {Actor}
     */
    async getActor(options = {}) {
        const actorId = options.actorId || options.actId;

        checkParamOrThrow(actorId, 'actorId', 'String');

        const safeActorId = replaceSlashWithTilde(actorId);

        const endpointOptions = {
            url: `/${safeActorId}`,
            method: 'GET',
        };

        try {
            const response = await this._call(options, endpointOptions);
            return parseDateFields(pluckData(response));
        } catch (err) {
            return catchNotFoundOrThrow(err);
        }
    }

    /**
     * @ignore
     * @deprecated
     */
    getAct(options) {
        this._logDeprecated('getAct', 'getActor');
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
     * For more details see (get list of runs endpoint)[https://docs.apify.com/api/v2#/reference/actors/run-collection/get-list-of-runs]

     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a tilde-separated owner's username and actor name.
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Boolean} [options.desc] - If `true` then the objects are sorted by the createdAt field in descending order.
     * @returns {PaginationList}
     */
    async listRuns(options = {}) {
        const actorId = options.actorId || options.actId;
        const { offset, limit, desc } = options;

        checkParamOrThrow(actorId, 'actorId', 'String');
        checkParamOrThrow(limit, 'limit', 'Maybe Number');
        checkParamOrThrow(offset, 'offset', 'Maybe Number');
        checkParamOrThrow(desc, 'desc', 'Maybe Boolean');

        const safeActorId = replaceSlashWithTilde(actorId);
        const query = {};

        if (limit) query.limit = limit;
        if (offset) query.offset = offset;
        if (desc) query.desc = 1;

        const endpointOptions = {
            url: `/${safeActorId}/runs`,
            method: 'GET',
            qs: query,
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * Runs a specific actor and returns its output.
     *
     * For more details see (run actor endpoint)[https://docs.apify.com/api/v2#/reference/actors/run-collection/run-actor]
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a tilde-separated owner's username and actor name.
     * @param {String|Buffer} [options.body] - Actor input, passed as HTTP POST payload
     * @param {String} [options.contentType] - Content type of actor input e.g 'application/json'
     * @param {Number} [options.waitForFinish] - Number of seconds to wait for actor to finish. Maximum value is 120s.
                                                 If actor doesn't finish in time then actor run in RUNNING state is returned.
     * @param {Number} [options.timeout] - Timeout for the actor run in seconds. Zero value means there is no timeout.
     * @param {Number} [options.memory] - Amount of memory allocated for the actor run, in megabytes.
     * @param {String} [options.build] - Tag or number of the build to run (e.g. <code>latest</code> or <code>1.2.34</code>).
     * @param {Array}  [options.webhooks] - Specifies optional webhooks associated with the actor run,
     *                                      which can be used to receive a notification e.g. when the actor finished or failed,
     *                                      see {@link https://apify.com/docs/webhooks#adhoc|adhoc webhooks documentation} for detailed description.
     * @returns {ActorRun}
     */
    async runActor(options = {}) {
        const actorId = options.actorId || options.actId;
        const { contentType, body, waitForFinish, timeout, memory, build, webhooks } = options;

        checkParamOrThrow(actorId, 'actorId', 'String');
        checkParamOrThrow(contentType, 'contentType', 'Maybe String');
        checkParamOrThrow(waitForFinish, 'waitForFinish', 'Maybe Number');
        checkParamOrThrow(timeout, 'timeout', 'Maybe Number');
        checkParamOrThrow(memory, 'memory', 'Maybe Number');
        checkParamOrThrow(build, 'build', 'Maybe String');
        checkParamOrThrow(webhooks, 'webhooks', 'Maybe Array');

        const safeActorId = replaceSlashWithTilde(actorId);
        const query = {};

        if (waitForFinish) query.waitForFinish = waitForFinish;
        if (timeout) query.timeout = timeout;
        if (memory) query.memory = memory;
        if (build) query.build = build;
        if (webhooks) query.webhooks = stringifyWebhooksToBase64(webhooks);

        const endpointOptions = {
            url: `/${safeActorId}/runs`,
            method: 'POST',
            qs: query,
            json: false,
        };

        if (contentType) endpointOptions.headers = { 'content-type': contentType };

        if (body) {
            checkParamOrThrow(body, 'body', 'Buffer | String');
            endpointOptions.body = body;
        }

        const rawResponse = await this._call(options, endpointOptions);
        const response = JSON.parse(rawResponse);
        return parseDateFields(pluckData(response));
    }

    /**
     * @ignore
     * @deprecated
     */
    runAct(options) {
        this._logDeprecated('runAct', 'runActor');
        return this.runActor(options);
    }

    /**
     * Gets actor run.
     * Gets an object that contains all the details about a specific run of an actor.
     * By passing the optional waitForFinish=1 parameter the API endpoint will synchronously wait for the build to finish.
     * This is useful to avoid periodic polling when waiting for actor build to complete.
     *
     * This endpoints do not require the authentication token, the calls are authenticated using a hard-to-guess ID of the run.
     *
     * For more details see (get run endpoint)[https://docs.apify.com/api/v2#/reference/actors/run-object/get-run]
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a tilde-separated owner's username and actor name.
     * @param {String} options.runId - Unique run ID
     * @param {Number} [options.waitForFinish] - Number of seconds to wait for actor to finish. Maximum value is 120s.
                                                 If actor doesn't finish in time then actor run in RUNNING state is returned.
     * @returns {ActorRun}
     */
    async getRun(options = {}) {
        const actorId = options.actorId || options.actId;
        const { runId, waitForFinish } = options;

        checkParamOrThrow(actorId, 'actorId', 'String');
        checkParamOrThrow(runId, 'runId', 'String');
        checkParamOrThrow(waitForFinish, 'waitForFinish', 'Maybe Number');

        const safeActorId = replaceSlashWithTilde(actorId);

        const endpointOptions = {
            url: `/${safeActorId}/runs/${runId}`,
            method: 'GET',
        };
        if (waitForFinish) endpointOptions.qs = { waitForFinish };

        try {
            const response = await this._call(options, endpointOptions);
            return parseDateFields(pluckData(response));
        } catch (err) {
            return catchNotFoundOrThrow(err);
        }
    }

    /**
     * Aborts an actor run and returns an object that contains all the details about the run.
     * Only runs that are starting or running are aborted. For runs with status FINISHED, FAILED, ABORTING and TIMED-OUT this call does nothing.
     *
     *  For more details see (abort run endpoint)[https://docs.apify.com/api/v2#/reference/actors/abort-run/abort-run]
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a tilde-separated owner's username and actor name.
     * @param {String} options.runId - Unique run ID
     * @returns {ActorRun}
     */
    async abortRun(options = {}) {
        const actorId = options.actorId || options.actId;
        const { runId } = options;

        checkParamOrThrow(actorId, 'actorId', 'String');
        checkParamOrThrow(runId, 'runId', 'String');

        const safeActorId = replaceSlashWithTilde(actorId);

        const endpointOptions = {
            url: `/${safeActorId}/runs/${runId}/abort`,
            method: 'POST',
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * Transforms an actor run into a run of another actor with a new input.
     * This is useful if you want to use another actor to finish the work of your current actor run,
     * without the need to create a completely new run and waiting for its finish. For the users of your actors,
     * the metamorph operation is transparent, they will just see your actor got the work done.Internally,
     * the system stops the Docker container corresponding to the actor run and starts a new container using a different Docker image.
     * All the default storages are preserved and the new input is stored under the INPUT-METAMORPH-1 key in the same default key-value store.
     *
     * For more details see (metamorph run endpoint)[https://docs.apify.com/api/v2#/reference/actors/metamorph-run/metamorph-run]
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a tilde-separated owner's username and actor name.
     * @param {String} options.runId - ID a an actor run to metamorph.
     * @param {String} options.targetActorId - ID of an actor to which run should metamorph.
     * @param {String|Buffer} [options.body] - Actor input, passed as HTTP POST payload
     * @param {String} [options.contentType] - Content type of actor input e.g 'application/json'
     * @param {String} [options.build] - Tag or number of the build to run (e.g. <code>latest</code> or <code>1.2.34</code>).
     * @returns {ActorRun}
     */
    async metamorphRun(options = {}) {
        const actorId = options.actorId || options.actId;
        const { runId, targetActorId, contentType, body, build } = options;

        checkParamOrThrow(actorId, 'actorId', 'String');
        checkParamOrThrow(runId, 'runId', 'String');
        checkParamOrThrow(targetActorId, 'targetActorId', 'String');
        checkParamOrThrow(contentType, 'contentType', 'Maybe String');
        checkParamOrThrow(build, 'build', 'Maybe String');

        const safeActorId = replaceSlashWithTilde(actorId);
        const safeTargetActorId = replaceSlashWithTilde(targetActorId);

        const query = {
            targetActorId: safeTargetActorId,
        };
        if (build) query.build = build;

        const endpointOptions = {
            url: `/${safeActorId}/runs/${runId}/metamorph`,
            method: 'POST',
            qs: query,
            json: false,
        };

        if (contentType) endpointOptions.headers = { 'content-type': contentType };

        if (body) {
            checkParamOrThrow(body, 'body', 'Buffer | String');
            endpointOptions.body = body;
        }

        const rawResponse = await this._call(options, endpointOptions);
        const response = JSON.parse(rawResponse);
        return parseDateFields(pluckData(response));
    }

    /**
     * Resurrects a finished actor run and returns an object that contains all the details about the resurrected run.
     * Only finished runs, i.e. runs with status FINISHED, FAILED, ABORTED and TIMED-OUT can be resurrected.
     * Run status will be updated to RUNNING and its container will be restarted with the same storages
     * (the same behaviour as when the run gets migrated to the new server).
     *
     * For more details see (ressurect run endpoint)[https://docs.apify.com/api/v2#/reference/actors/resurrect-run/resurrect-run]
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a tilde-separated owner's username and actor name.
     * @param {String} options.runId - Unique run ID
     * @returns {ActorRun}
     */
    async resurrectRun(options = {}) {
        const actorId = options.actorId || options.actId;
        const { runId } = options;

        checkParamOrThrow(actorId, 'actorId', 'String');
        checkParamOrThrow(runId, 'runId', 'String');

        const safeActorId = replaceSlashWithTilde(actorId);

        const endpointOptions = {
            url: `/${safeActorId}/runs/${runId}/resurrect`,
            method: 'POST',
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
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
     * For more details see (get list of builds endpoint)[https://docs.apify.com/api/v2#/reference/actors/build-collection/get-list-of-builds]
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a tilde-separated owner's username and actor name.
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Boolean} [options.desc] - If `true` then the objects are sorted by the createdAt field in descending order.
     * @returns {PaginationList}
     */
    async listBuilds(options = {}) {
        const actorId = options.actorId || options.actId;
        const { offset, limit, desc } = options;

        checkParamOrThrow(actorId, 'actorId', 'String');
        checkParamOrThrow(limit, 'limit', 'Maybe Number');
        checkParamOrThrow(offset, 'offset', 'Maybe Number');
        checkParamOrThrow(desc, 'desc', 'Maybe Boolean');

        const safeActorId = replaceSlashWithTilde(actorId);
        const query = {};

        if (limit) query.limit = limit;
        if (offset) query.offset = offset;
        if (desc) query.desc = 1;

        const endpointOptions = {
            url: `/${safeActorId}/builds`,
            method: 'GET',
            qs: query,
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * Builds given actor and returns object of that build.
     *
     * For more details see (build actor endpoint)[https://docs.apify.com/api/v2#/reference/actors/build-collection/build-actor]
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a tilde-separated owner's username and actor name.
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
    async buildActor(options = {}) {
        const actorId = options.actorId || options.actId;
        const { waitForFinish, version, tag, betaPackages, useCache } = options;

        checkParamOrThrow(actorId, 'actorId', 'String');
        checkParamOrThrow(version, 'version', 'String');
        checkParamOrThrow(waitForFinish, 'waitForFinish', 'Maybe Number');
        checkParamOrThrow(tag, 'tag', 'Maybe String');
        checkParamOrThrow(betaPackages, 'betaPackages', 'Maybe Boolean');
        checkParamOrThrow(useCache, 'useCache', 'Maybe Boolean');

        const safeActorId = replaceSlashWithTilde(actorId);
        const query = { version };

        if (waitForFinish) query.waitForFinish = waitForFinish;
        if (betaPackages) query.betaPackages = 1;
        if (useCache) query.useCache = 1;
        if (tag) query.tag = tag;

        const endpointOptions = {
            url: `/${safeActorId}/builds`,
            method: 'POST',
            qs: query,
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * @ignore
     * @deprecated
     */
    buildAct(options) {
        this._logDeprecated('buildAct', 'buildActor');
        return this.buildActor(options);
    }

    /**
     * Gets an object that contains all the details about a specific build of an actor.
     * By passing the optional waitForFinish=1 parameter the API endpoint will synchronously wait for the build to finish.
     * This is useful to avoid periodic polling when waiting for an actor build to finish.
     *
     * For more details see (get build endpoint)[https://docs.apify.com/api/v2#/reference/actors/build-object/get-build]
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a tilde-separated owner's username and actor name.
     * @param {String} options.buildId - Unique build ID
     * @param {Number} [options.waitForFinish] - Number of seconds to wait for actor to finish. Maximum value is 120s.
                                                 If actor doesn't finish in time then actor run in RUNNING state is returned.
     * @returns {ActorBuild}
     */
    async getBuild(options = {}) {
        const actorId = options.actorId || options.actId;
        const { buildId, waitForFinish } = options;

        checkParamOrThrow(actorId, 'actorId', 'String');
        checkParamOrThrow(buildId, 'buildId', 'String');
        checkParamOrThrow(waitForFinish, 'waitForFinish', 'Maybe Number');

        const safeActorId = replaceSlashWithTilde(actorId);
        const query = {};

        if (waitForFinish) query.waitForFinish = waitForFinish;

        const endpointOptions = {
            url: `/${safeActorId}/builds/${buildId}`,
            method: 'GET',
            qs: query,
        };

        try {
            const response = await this._call(options, endpointOptions);
            return parseDateFields(pluckData(response));
        } catch (err) {
            return catchNotFoundOrThrow(err);
        }
    }

    /**
     * Aborts an actor build and returns an object that contains all the details about the build.
     * Only builds that are starting or running are aborted.
     * For builds with status FINISHED, FAILED, ABORTING and TIMED-OUT this call does nothing.
     *
     * For more details see (abort build endpoint)[https://docs.apify.com/api/v2#/reference/actors/abort-build/abort-build]
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a tilde-separated owner's username and actor name.
     * @param {String} options.buildId - Unique build ID
     * @returns {ActorBuild}
     */
    async abortBuild(options = {}) {
        const actorId = options.actorId || options.actId;
        const { buildId } = options;

        checkParamOrThrow(actorId, 'actorId', 'String');
        checkParamOrThrow(buildId, 'buildId', 'String');

        const safeActorId = replaceSlashWithTilde(actorId);

        const endpointOptions = {
            url: `/${safeActorId}/builds/${buildId}/abort`,
            method: 'POST',
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * Gets the list of versions of a specific actor.
     * The response is a JSON with the list of Version objects where each contains basic information about a single version.
     *
     * For more details see (get list of version endpoint)[https://docs.apify.com/api/v2#/reference/actors/version-collection/get-list-of-versions]
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a tilde-separated owner's username and actor name.
     * @return {PaginationList}
     */
    async listActorVersions(options = {}) {
        const actorId = options.actorId || options.actId;

        checkParamOrThrow(actorId, 'actorId', 'String');

        const safeActorId = replaceSlashWithTilde(actorId);

        const endpointOptions = {
            url: `/${safeActorId}/versions`,
            method: 'GET',
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * @ignore
     * @deprecated
     */
    listActVersions(options) {
        this._logDeprecated('listActVersions', 'listActorVersions');
        return this.listActorVersions(options);
    }

    /**
     * Creates an actor version using values specified by a Version object.
     * The response is the Version object as returned by the Get version endpoint.
     *
     * For more details see (create version endpoint)[https://docs.apify.com/api/v2#/reference/actors/version-collection/create-version]
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a tilde-separated owner's username and actor name.
     * @param {Object} options.actVersion - Actor version
     * @return {ActorVersion}
     */
    async createActorVersion(options = {}) {
        const actorId = options.actorId || options.actId;
        const { actVersion } = options;

        checkParamOrThrow(actorId, 'actorId', 'String');
        checkParamOrThrow(actVersion, 'actVersion', 'Object');

        const safeActorId = replaceSlashWithTilde(actorId);

        const endpointOptions = {
            url: `/${safeActorId}/versions`,
            method: 'POST',
            body: actVersion,
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * @ignore
     * @deprecated
     */
    createActVersion(options) {
        this._logDeprecated('createActVersion', 'createActVersion');
        return this.createActorVersion(options);
    }

    /**
     * Gets a Version object that contains all the details about a specific version of an actor.
     *
     * For more details see (get version endpoint)[https://docs.apify.com/api/v2#/reference/actors/version-object/get-version]
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a tilde-separated owner's username and actor name.
     * @param {String} options.versionNumber - Version number of actor version
     * @return {ActorVersion}
     */
    async getActorVersion(options = {}) {
        const actorId = options.actorId || options.actId;
        const { versionNumber } = options;


        checkParamOrThrow(actorId, 'actorId', 'String');
        checkParamOrThrow(versionNumber, 'versionNumber', 'String');

        const safeActorId = replaceSlashWithTilde(actorId);

        const endpointOptions = {
            url: `/${safeActorId}/versions/${versionNumber}`,
            method: 'GET',
        };

        try {
            const response = await this._call(options, endpointOptions);
            return parseDateFields(pluckData(response));
        } catch (err) {
            return catchNotFoundOrThrow(err);
        }
    }

    /**
     * @ignore
     * @deprecated
     */
    getActVersion(options) {
        this._logDeprecated('getActVersion', 'getActorVersion');
        return this.getActorVersion(options);
    }

    /**
     * Updates an actor version.
     *
     * For more details see (update version endpoint)[https://docs.apify.com/api/v2#/reference/actors/version-object/update-version]
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a tilde-separated owner's username and actor name.
     * @param {String} options.versionNumber - Version number of actor version
     * @param {Object} options.actVersion - Actor version
     * @return {ActorVersion}
     */
    async updateActorVersion(options = {}) {
        const actorId = options.actorId || options.actId;
        const { actVersion, versionNumber } = options;


        checkParamOrThrow(actorId, 'actorId', 'String');
        checkParamOrThrow(actVersion, 'actVersion', 'Object');
        checkParamOrThrow(versionNumber, 'versionNumber', 'String');

        const safeActorId = replaceSlashWithTilde(actorId);

        const endpointOptions = {
            url: `/${safeActorId}/versions/${versionNumber}`,
            method: 'PUT',
            body: actVersion,
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * @ignore
     * @deprecated
     */
    updateActVersion(options) {
        this._logDeprecated('updateActVersion', 'updateActorVersion');
        return this.updateActorVersion(options);
    }

    /**
     * Deletes a specific version of actor's source code.
     *
     * For more details see (update version endpoint)[https://docs.apify.com/api/v2#/reference/actors/version-object/delete-version]
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a tilde-separated owner's username and actor name.
     * @param {String} options.versionNumber - Version number of actor version
     * @return {Object}
     */
    async deleteActorVersion(options = {}) {
        const actorId = options.actorId || options.actId;
        const { versionNumber } = options;

        checkParamOrThrow(actorId, 'actorId', 'String');
        checkParamOrThrow(versionNumber, 'versionNumber', 'String');

        const safeActorId = replaceSlashWithTilde(actorId);

        const endpointOptions = {
            url: `/${safeActorId}/versions/${versionNumber}`,
            method: 'DELETE',
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }

    /**
     * @ignore
     * @deprecated
     */
    deleteActVersion(options) {
        this._logDeprecated('deleteActVersion', 'deleteActorVersion');
        return this.deleteActorVersion(options);
    }

    /**
     * Gets the list of webhooks of a specific actor.
     * The response is a JSON with the list of objects where each object contains basic information about a single webhook.
     * The endpoint supports pagination using the limit and offset parameters and it will not return more than 1000 records.By default,
     * the records are sorted by the createdAt field in ascending order, to sort the records in descending order, use the desc=1 parameter.
     *
     * For more details see (get list of webhooks endpoint)[https://docs.apify.com/api/v2#/reference/actors/webhook-collection/get-list-of-webhooks]
     *
     * @memberof ApifyClient.actors
     * @instance
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a tilde-separated owner's username and actor name.
     * @param {Number} [options.offset=0] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit=1000] - Maximum number of array elements to return.
     * @param {Boolean} [options.desc] - If `true` then the objects are sorted by the createdAt field in descending order.
     * @returns {PaginationList}
     */
    async listWebhooks(options = {}) {
        const actorId = options.actorId || options.actId;
        const { offset, limit, desc } = options;

        checkParamOrThrow(actorId, 'actorId', 'String');
        checkParamOrThrow(limit, 'limit', 'Maybe Number');
        checkParamOrThrow(offset, 'offset', 'Maybe Number');
        checkParamOrThrow(desc, 'desc', 'Maybe Boolean');

        const safeActorId = replaceSlashWithTilde(actorId);
        const query = {};

        if (limit) query.limit = limit;
        if (offset) query.offset = offset;
        if (desc) query.desc = 1;

        const endpointOptions = {
            url: `${safeActorId}/webhooks`,
            method: 'GET',
            qs: query,
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }
}
