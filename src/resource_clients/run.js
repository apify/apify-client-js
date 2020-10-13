const ow = require('ow');
const ResourceClient = require('../base/resource_client');
const DatasetClient = require('./dataset');
const KeyValueStoreClient = require('./key_value_store');
const LogClient = require('./log');
const RequestQueueClient = require('./request_queue');
const {
    pluckData,
    parseDateFields,
} = require('../utils');
const {
    waitForFinish,
} = require('./shared_methods/wait_for_finish');

class RunClient extends ResourceClient {
    /**
     * @param {ApiClientOptions} options
     */
    constructor(options) {
        super({
            resourcePath: 'runs',
            disableMethods: ['update', 'delete'],
            ...options,
        });
        this._waitForFinish = waitForFinish;
    }

    async abort() {
        const response = await this.httpClient.call({
            url: this._url('abort'),
            method: 'POST',
            params: this._params(),
        });

        return parseDateFields(pluckData(response.data));
    }

    /**
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
        };
        if (options.contentType) {
            request.headers = {
                'content-type': options.contentType,
            };
        }

        const response = await this.httpClient.call(request);
        return parseDateFields(pluckData(response.data));
    }

    async resurrect() {
        const response = await this.httpClient.call({
            url: this._url('resurrect'),
            method: 'POST',
            params: this._params(),
        });

        return parseDateFields(pluckData(response.data));
    }

    /**
     * Returns a promise that resolves with the finished Run object when the provided actor run finishes
     * or with the unfinished Run object when the `waitSecs` timeout lapses. The promise is NOT rejected
     * based on run status. You can inspect the `status` property of the Run object to find out its status.
     *
     * This is useful when you need to chain actor executions. Similar effect can be achieved
     * by using webhooks, so be sure to review which technique fits your use-case better.
     *
     * @param {object} [options]
     * @param {number} [options.waitSecs]
     *  Maximum time to wait for the run to finish, in seconds.
     *  If the limit is reached, the returned promise is resolved to a run object that will have
     *  status `READY` or `RUNNING`. If `waitSecs` omitted, the function waits indefinitely.
     * @returns {Promise<Object>}
     */
    async waitForFinish(options = {}) {
        return this._waitForFinish(options);
    }

    dataset() {
        return new DatasetClient(this._subResourceOptions({
            resourcePath: 'dataset',
        }));
    }

    keyValueStore() {
        return new KeyValueStoreClient(this._subResourceOptions({
            resourcePath: 'key-value-store',
        }));
    }

    requestQueue() {
        return new RequestQueueClient(this._subResourceOptions({
            resourcePath: 'request-queue',
        }));
    }

    log() {
        return new LogClient(this._subResourceOptions({
            resourcePath: 'log',
        }));
    }
}

module.exports = RunClient;
