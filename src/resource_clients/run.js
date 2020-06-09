const ow = require('ow');
const ResourceClient = require('../base/resource_client');
const DatasetClient = require('./dataset');
const KeyValueStoreClient = require('./key_value_store');
const LogClient = require('./log');
const RequestQueueClient = require('./request_queue');
const {
    pluckData,
    parseDateFields,
    catchNotFoundOrThrow,
    stringifyWebhooksToBase64,
} = require('../utils');

class RunClient extends ResourceClient {
    /**
     * @param {object} options
     * @param {string} options.id
     * @param {string} options.baseUrl
     * @param {HttpClient} options.httpClient
     * @param {object} [options.params]
     */
    constructor(options) {
        super({
            resourcePath: 'runs',
            disableMethods: ['update', 'delete'],
            ...options,
        });
    }

    async abort() {
        const response = await this.httpClient.call({
            url: this._url('abort'),
            method: 'POST',
            params: this._params(),
        });

        return parseDateFields(pluckData(response.data));
    }

    async metamorph(targetActorId, options = {}) {
        ow(targetActorId, ow.string);
        ow(options, ow.object.exactShape({
            contentType: ow.optional.string,
            build: ow.optional.string,
            input: ow.any,
        }));

        const safeTargetActorId = this._toSafeId(targetActorId);

        const params = {
            targetActorId: safeTargetActorId,
            build: options.build,
        };

        const request = {
            url: this._url('metamorph'),
            method: 'POST',
            data: options.input,
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

    async waitForFinish(timeoutSecs) {
        // TODO
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
