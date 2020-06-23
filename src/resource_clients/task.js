const ow = require('ow');
const ResourceClient = require('../base/resource_client');
const RunCollectionClient = require('./run_collection');
const WebhookCollectionClient = require('./webhook_collection');
const {
    pluckData,
    parseDateFields,
    catchNotFoundOrThrow,
    stringifyWebhooksToBase64,
} = require('../utils');

class TaskClient extends ResourceClient {
    /**
     * @param {object} options
     * @param {string} options.id
     * @param {string} options.baseUrl
     * @param {HttpClient} options.httpClient
     * @param {object} [options.params]
     */
    constructor(options) {
        super({
            resourcePath: 'actor-tasks',
            ...options,
        });
    }

    async start(options = {}) {
        ow(options, ow.object.exactShape({
            waitForFinish: ow.optional.number,
            timeout: ow.optional.number,
            memory: ow.optional.number,
            build: ow.optional.string,
            webhooks: ow.optional.array.ofType(ow.object),
            input: ow.optional.object,
        }));

        const { waitForFinish, timeout, memory, build } = options;

        const params = {
            waitForFinish,
            timeout,
            memory,
            build,
            webhooks: stringifyWebhooksToBase64(options.webhooks),
        };

        const request = {
            url: this._url('runs'),
            method: 'POST',
            data: options.input,
            params: this._params(params),
        };

        const response = await this.httpClient.call(request);
        return parseDateFields(pluckData(response.data));
    }

    async call() {
        // TODO
    }

    async getInput() {
        const requestOpts = {
            url: this._url('input'),
            method: 'GET',
            params: this._params(),
        };
        try {
            const response = await this.httpClient.call(requestOpts);
            return response.data;
        } catch (err) {
            return catchNotFoundOrThrow(err);
        }
    }

    async updateInput(newFields) {
        const response = await this.httpClient.call({
            url: this._url('input'),
            method: 'PUT',
            params: this._params(),
            data: newFields,
        });
        return response.data;
    }

    runs() {
        return new RunCollectionClient(this._subResourceOptions());
    }

    webhooks() {
        return new WebhookCollectionClient(this._subResourceOptions());
    }
}

module.exports = TaskClient;
