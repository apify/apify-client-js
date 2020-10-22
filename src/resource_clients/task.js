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
     * @param {ApiClientOptions} options
     */
    constructor(options) {
        super({
            resourcePath: 'actor-tasks',
            ...options,
        });
    }

    /**
     * @param {object} [input]
     * @param {object} [options]
     * @param {string} [options.build]
     * @param {number} [options.memory]
     * @param {number} [options.timeout]
     * @param {array} [options.webhooks]
     * @return {Promise<Run>}
     */
    async start(input, options = {}) {
        ow(input, ow.optional.object);
        ow(options, ow.object.exactShape({
            build: ow.optional.string,
            memory: ow.optional.number,
            timeout: ow.optional.number,
            waitForFinish: ow.optional.number,
            webhooks: ow.optional.array.ofType(ow.object),
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
            data: input,
            params: this._params(params),
        };

        const response = await this.httpClient.call(request);
        return parseDateFields(pluckData(response.data));
    }

    /**
     * @param {object} [input]
     * @param {object} [options]
     * @param {string} [options.build]
     * @param {number} [options.memory]
     * @param {number} [options.timeout]
     * @param {number} [options.waitSecs]
     * @param {array} [options.webhooks]
     * @return {Promise<Run>}
     */
    async call(input, options = {}) {
        ow(input, ow.optional.object);
        ow(options, ow.object.exactShape({
            build: ow.optional.string,
            memory: ow.optional.number,
            timeout: ow.optional.number.not.negative,
            waitSecs: ow.optional.number.not.negative,
            webhooks: ow.optional.array.ofType(ow.object),
        }));

        const { waitSecs, ...startOptions } = options;

        const { id, actId } = await this.start(input, startOptions);

        return this.apifyClient.run(id, actId).waitForFinish({ waitSecs });
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
