const isUndefined = require('lodash/isUndefined');
const log = require('apify-shared/log');
const omit = require('lodash/omit');
const ow = require('ow');
const {
    pluckData,
    parseDateFields,
    catchNotFoundOrThrow,
    stringifyWebhooksToBase64,
    replaceSlashWithTilde,
} = require('./utils');
const Resource = require('./resource');
const { paginationShape } = require('./shapes');

const DEPRECATED_OPTION_NAMES = ['act', 'actId', 'actVersion'];

/**
 * Actors
 * @memberOf ApifyClient
 * @description
 * The API endpoints described in this section enable you to manage, build and run Apify actors.
 * For more information, see the Actor documentation.
 * Note that for all the API endpoints that accept the actor ID parameter to specify an actor,
 * you can pass either the actor ID (e.g. HG7ML7M8z78YcAPEB) or a slash-separated username of the actor owner and
 * the actor name (e.g. apify/web-scraper).
 *
 * For more information see the [Actor endpoint](https://docs.apify.com/api/v2#/reference/actors).
 *
 * @namespace actors
 */

class Actors extends Resource {
    constructor(httpClient) {
        super(httpClient, '/v2/acts');
    }

    _logDeprecated(oldMethod, newMethod) {
        log.deprecated(`apifyClient.act(or)s.${oldMethod}() is deprecated. Use apifyClient.actors.${newMethod}() instead.`);
    }

    _logDeprecatedOptions(methodName, options) {
        DEPRECATED_OPTION_NAMES.forEach((name) => {
            if (name in options) {
                log.deprecated(`apifyClient.act(or)s.${methodName}: options.${name} is deprecated!`
                    + ` Use options.${name.replace('act', 'actor')} instead!`);
            }
        });
    }

    /**
     * Gets list of your actors.
     * @description By default, the objects are sorted by the createdAt field in ascending order,
     * therefore you can use pagination to incrementally fetch all actors while new ones are still being created.
     * To sort them in descending order, use desc: `true` parameter.
     * The endpoint supports pagination using limit and offset parameters and it will not return more than 1000 array elements.
     *
     * For more information see the [list actor endpoint](https://docs.apify.com/api/v2#/reference/actors/actor-collection/get-list-of-actors).
     *
     * @memberof ApifyClient.actors
     * @param {Object} [options]
     * @param {Number} [options.offset] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit] - Maximum number of array elements to return.
     * @param {Boolean} [options.desc] - If `true` then the objects are sorted by the createdAt field in descending order.
     * @param {Boolean} [options.my] - If `true` then the returned list only contains actors owned by the user.
     * @returns {Promise<PaginationList>}
     */
    async listActors(options = {}) {
        ow(options, ow.object.partialShape({
            ...paginationShape,
            my: ow.optional.boolean,
        }));
        const { offset, limit, desc, my } = options;

        const query = {};

        if (limit) query.limit = limit;
        if (offset) query.offset = offset;
        if (desc) query.desc = 1;
        if (my) query.my = 1;

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
     * Creates a new actor with settings specified in an Actor object passed as `options.actor`.
     * The response is the full actor object as returned by the `client.actors.getActor()`.
     *
     * For more information see the [create actor endpoint](https://docs.apify.com/api/v2#/reference/actors/actor-collection/create-actor).
     * @memberof ApifyClient.actors
     * @param {Object} options
     * @param {Object} options.actor
     * @returns {Actor}
     */
    async createActor(options) {
        this._logDeprecatedOptions('createAct(or)', options);
        const actor = options.actor || options.act;

        ow(actor, ow.object);

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
     *
     * For more details see [update actor endpoint](https://docs.apify.com/api/v2#/reference/actors/actor-object/update-actor)
     *
     * @memberof ApifyClient.actors
     * @param {Object} options
     * @param {Object} options.actor - Updated actor object.
     * @param {Object} options.actor.id - Actor ID or a slash-separated owner's username and actor name. (Example: apify/web-scraper)
     * @returns {Actor}
     */
    async updateActor(options = {}) {
        log.deprecated('apifyClient.act(or)s.updateAct(or): options.act is deprecated! Use options.actor instead!');
        log.deprecated('apifyClient.act(or)s.updateAct(or): options.actId is deprecated! Use options.actor.id instead!');
        const actor = options.actor || options.act;

        ow(actor, ow.object.partialShape({
            id: ow.optional.string,
        }));
        ow(options.actId, ow.optional.string);

        const safeActorId = replaceSlashWithTilde(!options.actId && actor.id ? actor.id : options.actId);

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
     * For more details see [delete actor endpoint](https://docs.apify.com/api/v2#/reference/actors/actor-object/delete-actor)
     *
     * @memberof ApifyClient.actors
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a slash-separated owner's username and actor name. (Example: apify/web-scraper)
     */
    async deleteActor(options = {}) {
        this._logDeprecatedOptions('deleteAct(or)', options);
        const actorId = options.actorId || options.actId;

        ow(actorId, ow.string);

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
     * For more details see [get actor endpoint](https://docs.apify.com/api/v2#/reference/actors/actor-object/get-actor)
     * @memberof ApifyClient.actors
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a slash-separated owner's username and actor name. (Example: apify/web-scraper)
     * @returns {Actor}
     */
    async getActor(options = {}) {
        this._logDeprecatedOptions('getAct(or)', options);
        const actorId = options.actorId || options.actId;

        ow(actorId, ow.string);

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
     * For more details see [get list of runs endpoint](https://docs.apify.com/api/v2#/reference/actors/run-collection/get-list-of-runs)

     * @memberof ApifyClient.actors
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a slash-separated owner's username and actor name. (Example: apify/web-scraper)
     * @param {Number} [options.offset] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit] - Maximum number of array elements to return.
     * @param {Boolean} [options.desc] - If `true` then the objects are sorted by the createdAt field in descending order.
     * @returns {PaginationList}
     */
    async listRuns(options = {}) {
        this._logDeprecatedOptions('listRuns', options);
        const actorId = options.actorId || options.actId;
        const { offset, limit, desc } = options;

        ow(actorId, ow.string);
        ow(options, ow.object.partialShape(paginationShape));

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
     * For more details see [run actor endpoint](https://docs.apify.com/api/v2#/reference/actors/run-collection/run-actor)
     *
     * @memberof ApifyClient.actors
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a slash-separated owner's username and actor name. (Example: apify/web-scraper)
     * @param {*} [options.body] - Actor input, passed as HTTP POST payload. Most imaginable types are supported.
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
        this._logDeprecatedOptions('runAct(or)', options);
        const actorId = options.actorId || options.actId;
        ow(actorId, ow.string);
        ow(options, ow.object.partialShape({
            contentType: ow.optional.string,
            waitForFinish: ow.optional.number,
            timeout: ow.optional.number,
            memory: ow.optional.number,
            build: ow.optional.string,
            webhooks: ow.optional.array.ofType(ow.object),
        }));

        const { contentType, body, waitForFinish, timeout, memory, build, webhooks } = options;

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
        if (body) endpointOptions.body = body;

        // To remove the content type with the null property to suite the integration tests needs.
        if (!isUndefined(contentType)) endpointOptions.headers = { 'content-type': contentType };

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
     * For more details see [get run endpoint](https://docs.apify.com/api/v2#/reference/actors/run-object/get-run)
     *
     * @memberof ApifyClient.actors
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a slash-separated owner's username and actor name. (Example: apify/web-scraper)
     * @param {String} options.runId - Unique run ID
     * @param {Number} [options.waitForFinish] - Number of seconds to wait for actor to finish. Maximum value is 120s.
                                                 If actor doesn't finish in time then actor run in RUNNING state is returned.
     * @returns {ActorRun}
     */
    async getRun(options = {}) {
        this._logDeprecatedOptions('getRun', options);
        const actorId = options.actorId || options.actId;
        ow(actorId, ow.string);
        ow(options, ow.object.partialShape({
            runId: ow.string,
            waitForFinish: ow.optional.number,
        }));

        const { runId, waitForFinish } = options;

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
     *  For more details see [abort run endpoint](https://docs.apify.com/api/v2#/reference/actors/abort-run/abort-run)
     *
     * @memberof ApifyClient.actors
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a slash-separated owner's username and actor name. (Example: apify/web-scraper)
     * @param {String} options.runId - Unique run ID
     * @returns {ActorRun}
     */
    async abortRun(options = {}) {
        this._logDeprecatedOptions('abortRun', options);
        const actorId = options.actorId || options.actId;
        ow(actorId, ow.string);
        ow(options, ow.object.partialShape({
            runId: ow.string,
        }));

        const { runId } = options;

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
     * For more details see [metamorph run endpoint](https://docs.apify.com/api/v2#/reference/actors/metamorph-run/metamorph-run)
     *
     * @memberof ApifyClient.actors
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a slash-separated owner's username and actor name. (Example: apify/web-scraper)
     * @param {String} options.runId - ID a an actor run to metamorph.
     * @param {String} options.targetActorId - ID of an actor to which run should metamorph.
     * @param {String|Buffer} [options.body] - Actor input, passed as HTTP POST payload
     * @param {String} [options.contentType] - Content type of actor input e.g 'application/json'
     * @param {String} [options.build] - Tag or number of the build to run (e.g. <code>latest</code> or <code>1.2.34</code>).
     * @returns {ActorRun}
     */
    async metamorphRun(options = {}) {
        this._logDeprecatedOptions('metamorphRun', options);
        const actorId = options.actorId || options.actId;
        ow(actorId, ow.string);
        ow(options, ow.object.partialShape({
            runId: ow.string,
            targetActorId: ow.string,
            contentType: ow.optional.string,
            build: ow.optional.string,
        }));

        const { runId, targetActorId, contentType, body, build } = options;

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
        if (body) endpointOptions.body = body;

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
     * For more details see [ressurect run endpoint](https://docs.apify.com/api/v2#/reference/actors/resurrect-run/resurrect-run)
     *
     * @memberof ApifyClient.actors
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a slash-separated owner's username and actor name. (Example: apify/web-scraper)
     * @param {String} options.runId - Unique run ID
     * @returns {ActorRun}
     */
    async resurrectRun(options = {}) {
        this._logDeprecatedOptions('resurrectRun', options);
        const actorId = options.actorId || options.actId;
        ow(actorId, ow.string);
        ow(options, ow.object.partialShape({
            runId: ow.string,
        }));

        const { runId } = options;

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
     * For more details see [get list of builds endpoint](https://docs.apify.com/api/v2#/reference/actors/build-collection/get-list-of-builds)
     *
     * @memberof ApifyClient.actors
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a slash-separated owner's username and actor name. (Example: apify/web-scraper)
     * @param {Number} [options.offset] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit] - Maximum number of array elements to return.
     * @param {Boolean} [options.desc] - If `true` then the objects are sorted by the createdAt field in descending order.
     * @returns {PaginationList}
     */
    async listBuilds(options = {}) {
        this._logDeprecatedOptions('listBuilds', options);
        const actorId = options.actorId || options.actId;
        ow(actorId, ow.string);
        ow(options, ow.object.partialShape(paginationShape));

        const { offset, limit, desc } = options;

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
     * For more details see [build actor endpoint](https://docs.apify.com/api/v2#/reference/actors/build-collection/build-actor)
     *
     * @memberof ApifyClient.actors
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a slash-separated owner's username and actor name. (Example: apify/web-scraper)
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
        this._logDeprecatedOptions('buildAct(or)', options);
        const actorId = options.actorId || options.actId;
        ow(actorId, ow.string);
        ow(options, ow.object.partialShape({
            version: ow.string,
            waitForFinish: ow.optional.number,
            tag: ow.optional.string,
            betaPackages: ow.optional.boolean,
            useCache: ow.optional.boolean,
        }));

        const { waitForFinish, version, tag, betaPackages, useCache } = options;

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
     * For more details see [get build endpoint](https://docs.apify.com/api/v2#/reference/actors/build-object/get-build)
     *
     * @memberof ApifyClient.actors
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a slash-separated owner's username and actor name. (Example: apify/web-scraper)
     * @param {String} options.buildId - Unique build ID
     * @param {Number} [options.waitForFinish] - Number of seconds to wait for actor to finish. Maximum value is 120s.
                                                 If actor doesn't finish in time then actor run in RUNNING state is returned.
     * @returns {ActorBuild}
     */
    async getBuild(options = {}) {
        this._logDeprecatedOptions('getBuild', options);
        const actorId = options.actorId || options.actId;
        ow(actorId, ow.string);
        ow(options, ow.object.partialShape({
            buildId: ow.string,
            waitForFinish: ow.optional.number,
        }));
        const { buildId, waitForFinish } = options;

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
     * For more details see [abort build endpoint](https://docs.apify.com/api/v2#/reference/actors/abort-build/abort-build)
     *
     * @memberof ApifyClient.actors
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a slash-separated owner's username and actor name. (Example: apify/web-scraper)
     * @param {String} options.buildId - Unique build ID
     * @returns {ActorBuild}
     */
    async abortBuild(options = {}) {
        this._logDeprecatedOptions('abortBuild', options);
        const actorId = options.actorId || options.actId;
        ow(actorId, ow.string);
        ow(options, ow.object.partialShape({
            buildId: ow.string,
        }));
        const { buildId } = options;

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
     * For more details see [get list of version endpoint](https://docs.apify.com/api/v2#/reference/actors/version-collection/get-list-of-versions)
     *
     * @memberof ApifyClient.actors
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a slash-separated owner's username and actor name. (Example: apify/web-scraper)
     * @return {PaginationList}
     */
    async listActorVersions(options = {}) {
        this._logDeprecatedOptions('listAct(or)Versions', options);
        const actorId = options.actorId || options.actId;
        ow(actorId, ow.string);

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
     * For more details see [create version endpoint](https://docs.apify.com/api/v2#/reference/actors/version-collection/create-version)
     *
     * @memberof ApifyClient.actors
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a slash-separated owner's username and actor name. (Example: apify/web-scraper)
     * @param {Object} options.actorVersion - Actor version object
     * @return {ActorVersion}
     */
    async createActorVersion(options = {}) {
        this._logDeprecatedOptions('createAct(or)Versions', options);
        const actorId = options.actorId || options.actId;
        const actorVersion = options.actorVersion || options.actVersion;
        ow(actorId, ow.string);
        ow(actorVersion, ow.object);

        const safeActorId = replaceSlashWithTilde(actorId);

        const endpointOptions = {
            url: `/${safeActorId}/versions`,
            method: 'POST',
            body: actorVersion,
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
     * For more details see [get version endpoint](https://docs.apify.com/api/v2#/reference/actors/version-object/get-version)
     *
     * @memberof ApifyClient.actors
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a slash-separated owner's username and actor name. (Example: apify/web-scraper)
     * @param {String} options.versionNumber - Version of actor in major.minor string format. Example: `1.0`
     * @return {ActorVersion}
     */
    async getActorVersion(options = {}) {
        this._logDeprecatedOptions('getAct(or)Versions', options);
        const actorId = options.actorId || options.actId;
        ow(actorId, ow.string);
        ow(options, ow.object.partialShape({
            versionNumber: ow.string,
        }));

        const { versionNumber } = options;

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
     * For more details see [update version endpoint](https://docs.apify.com/api/v2#/reference/actors/version-object/update-version)
     *
     * @memberof ApifyClient.actors
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a slash-separated owner's username and actor name. (Example: apify/web-scraper)
     * @param {Object} options.actorVersion - Actor version object
     * @param {Object} options.actorVersion.versionNumber - Version of actor in major.minor string format. Example: `1.0`
     * @return {ActorVersion}
     */
    async updateActorVersion(options = {}) {
        const methodName = 'updateAct(or)Versions';
        this._logDeprecatedOptions(methodName, options);
        if (options.versionNumber) {
            log.deprecated(`apifyClient.act(or)s.${methodName}(): options.versionNumber is deprecated!`
                + ' Use options.actorVersion.versionNumber instead!');
        }
        const actorId = options.actorId || options.actId;
        const actorVersion = options.actorVersion || options.actVersion;
        ow(actorId, ow.string);
        ow(actorVersion, ow.object.partialShape({
            versionNumber: ow.string,
        }));

        const { versionNumber } = actorVersion;

        const safeActorId = replaceSlashWithTilde(actorId);

        const endpointOptions = {
            url: `/${safeActorId}/versions/${versionNumber}`,
            method: 'PUT',
            body: actorVersion,
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
     * For more details see [update version endpoint](https://docs.apify.com/api/v2#/reference/actors/version-object/delete-version)
     *
     * @memberof ApifyClient.actors
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a slash-separated owner's username and actor name. (Example: apify/web-scraper)
     * @param {String} options.versionNumber - Version of actor in major.minor string format. Example: `1.0`
     * @return {Object}
     */
    async deleteActorVersion(options = {}) {
        this._logDeprecatedOptions('deleteAct(or)Version', options);
        const actorId = options.actorId || options.actId;
        ow(actorId, ow.string);
        ow(options, ow.object.partialShape({
            versionNumber: ow.string,
        }));
        const { versionNumber } = options;

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
     * For more details see [get list of webhooks endpoint](https://docs.apify.com/api/v2#/reference/actors/webhook-collection/get-list-of-webhooks)
     *
     * @memberof ApifyClient.actors
     * @param {Object} options
     * @param {String} options.actorId - Actor ID or a slash-separated owner's username and actor name. (Example: apify/web-scraper)
     * @param {Number} [options.offset] - Number of array elements that should be skipped at the start.
     * @param {Number} [options.limit] - Maximum number of array elements to return.
     * @param {Boolean} [options.desc] - If `true` then the objects are sorted by the createdAt field in descending order.
     * @returns {PaginationList}
     */
    async listWebhooks(options = {}) {
        this._logDeprecatedOptions('listWebhooks', options);
        const actorId = options.actorId || options.actId;
        ow(actorId, ow.string);
        ow(options, ow.object.partialShape(paginationShape));
        const { offset, limit, desc } = options;

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

module.exports = Actors;
