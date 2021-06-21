const ow = require('ow').default;
const ResourceClient = require('../base/resource_client');
const DatasetClient = require('./dataset');
const KeyValueStoreClient = require('./key_value_store');
const LogClient = require('./log');
const RequestQueueClient = require('./request_queue');
const {
    pluckData,
    parseDateFields,
} = require('../utils');

/**
 * @hideconstructor
 */
class RunClient extends ResourceClient {
    /**
     * @param {ApiClientOptions} options
     */
    constructor(options) {
        super({
            resourcePath: options.resourcePath || 'actor-runs',
            ...options,
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-runs/run-object/get-run
     * @param {object} [options]
     * @param {number} [options.waitForFinish]
     * @return {Promise<Run>}
     */
    async get(options = {}) {
        ow(options, ow.object.exactShape({
            waitForFinish: ow.optional.number,
        }));
        return this._get(options);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-runs/abort-run/abort-run
     * @param {object} [options]
     * @param {object} [options.gracefully]
     * @return {Promise<Run>}
     */
    async abort(options = {}) {
        ow(options, ow.object.exactShape({
            gracefully: ow.optional.boolean,
        }));
        const response = await this.httpClient.call({
            url: this._url('abort'),
            method: 'POST',
            params: this._params(options),
        });

        return parseDateFields(pluckData(response.data));
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-runs/metamorph-run/metamorph-run
     * @param {string} targetActorId
     * @param {*} [input]
     * @param {object} [options]
     * @param {object} [options.contentType]
     * @param {object} [options.build]
     * @return {Promise<Run>}
     */
    async metamorph(targetActorId, input, options = {}) {
        ow(targetActorId, ow.string);
        // input can be anything, pointless to validate
        ow(options, ow.object.exactShape({
            contentType: ow.optional.string,
            build: ow.optional.string,
        }));

        const safeTargetActorId = this._toSafeId(targetActorId);

        const params = {
            targetActorId: safeTargetActorId,
            build: options.build,
        };

        const request = {
            url: this._url('metamorph'),
            method: 'POST',
            data: input,
            params: this._params(params),
            // Apify internal property. Tells the request serialization interceptor
            // to stringify functions to JSON, instead of omitting them.
            stringifyFunctions: true,
        };
        if (options.contentType) {
            request.headers = {
                'content-type': options.contentType,
            };
        }

        const response = await this.httpClient.call(request);
        return parseDateFields(pluckData(response.data));
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-runs/resurrect-run/resurrect-run
     * @param {object} [options]
     * @param {string} [options.build]
     * @param {number} [options.memory]
     * @param {number} [options.timeout]
     * @return {Promise<Run>}
     */
    async resurrect(options = {}) {
        ow(options, ow.object.exactShape({
            build: ow.optional.string,
            memory: ow.optional.number,
            timeout: ow.optional.number,
        }));

        const response = await this.httpClient.call({
            url: this._url('resurrect'),
            method: 'POST',
            params: this._params(options),
        });

        return parseDateFields(pluckData(response.data));
    }

    /**
     * Returns a promise that resolves with the finished Run object when the provided actor run finishes
     * or with the unfinished Run object when the `waitSecs` timeout lapses. The promise is NOT rejected
     * based on run status. You can inspect the `status` property of the Run object to find out its status.
     *
     * The difference between this function and the `waitForFinish` parameter of the `get` method
     * is the fact that this function can wait indefinitely. Its use is preferable to the
     * `waitForFinish` parameter alone, which it uses internally.
     *
     * This is useful when you need to chain actor executions. Similar effect can be achieved
     * by using webhooks, so be sure to review which technique fits your use-case better.
     *
     * @param {object} [options]
     * @param {number} [options.waitSecs]
     *  Maximum time to wait for the run to finish, in seconds.
     *  If the limit is reached, the returned promise is resolved to a run object that will have
     *  status `READY` or `RUNNING`. If `waitSecs` omitted, the function waits indefinitely.
     * @returns {Promise<Run>}
     */
    async waitForFinish(options = {}) {
        ow(options, ow.object.exactShape({
            waitSecs: ow.optional.number,
        }));
        return this._waitForFinish(options);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-runs/run-object-and-its-storages
     *
     * This also works through `actorClient.lastRun().dataset()`.
     * https://docs.apify.com/api/v2#/reference/actors/last-run-object-and-its-storages
     * @return {DatasetClient}
     */
    dataset() {
        return new DatasetClient(this._subResourceOptions({
            resourcePath: 'dataset',
        }));
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-runs/run-object-and-its-storages
     *
     * This also works through `actorClient.lastRun().keyValueStore()`.
     * https://docs.apify.com/api/v2#/reference/actors/last-run-object-and-its-storages
     * @return {KeyValueStoreClient}
     */
    keyValueStore() {
        return new KeyValueStoreClient(this._subResourceOptions({
            resourcePath: 'key-value-store',
        }));
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-runs/run-object-and-its-storages
     *
     * This also works through `actorClient.lastRun().requestQueue()`.
     * https://docs.apify.com/api/v2#/reference/actors/last-run-object-and-its-storages
     * @return {RequestQueueClient}
     */
    requestQueue() {
        return new RequestQueueClient(this._subResourceOptions({
            resourcePath: 'request-queue',
        }));
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-runs/run-object-and-its-storages
     *
     * This also works through `actorClient.lastRun().log()`.
     * https://docs.apify.com/api/v2#/reference/actors/last-run-object-and-its-storages
     * @return {LogClient}
     */
    log() {
        return new LogClient(this._subResourceOptions({
            resourcePath: 'log',
        }));
    }
}

module.exports = RunClient;
