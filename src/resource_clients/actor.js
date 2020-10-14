const {
    ACT_JOB_STATUSES,
} = require('apify-shared/consts');
const ow = require('ow');
const ActorVersionClient = require('./actor_version');
const ActorVersionCollectionClient = require('./actor_version_collection');
const BuildCollectionClient = require('./build_collection');
const RunClient = require('./run');
const RunCollectionClient = require('./run_collection');
const WebhookCollectionClient = require('./webhook_collection');
const ResourceClient = require('../base/resource_client');
const {
    pluckData,
    parseDateFields,
    stringifyWebhooksToBase64,
} = require('../utils');

class ActorClient extends ResourceClient {
    /**
     * @param {ApiClientOptions} options
     */
    constructor(options) {
        super({
            resourcePath: 'acts',
            ...options,
        });
    }

    /**
     * @param {*} [input]
     * @param {object} [options]
     * @param {string} [options.build]
     * @param {string} [options.contentType]
     * @param {number} [options.memory]
     * @param {number} [options.timeout]
     * @param {array} [options.webhooks]
     * @return {Promise<Run>}
     */
    async start(input, options = {}) {
        // input can be anything, pointless to validate
        ow(options, ow.object.exactShape({
            build: ow.optional.string,
            contentType: ow.optional.string,
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
        if (options.contentType) {
            request.headers = {
                'content-type': options.contentType,
            };
        }

        const response = await this.httpClient.call(request);
        return parseDateFields(pluckData(response.data));
    }

    /**
     * @param {*} [input]
     * @param {object} [options]
     * @param {string} [options.build]
     * @param {string} [options.contentType]
     * @param {number} [options.memory]
     * @param {number} [options.timeout]
     * @param {number} [options.waitSecs]
     * @param {array} [options.webhooks]
     * @return {Promise<Run>}
     */
    async call(input, options = {}) {
        // input can be anything, pointless to validate
        ow(options, ow.object.exactShape({
            build: ow.optional.string,
            contentType: ow.optional.string,
            memory: ow.optional.number,
            timeout: ow.optional.number.not.negative,
            waitSecs: ow.optional.number.not.negative,
            webhooks: ow.optional.array.ofType(ow.object),
        }));

        const { waitSecs, ...startOptions } = options;

        const { id, actId } = await this.start(input, startOptions);

        return this.apifyClient.run(id, actId).waitForFinish({ waitSecs });
    }

    async build(options = {}) {
        ow(options, ow.object.exactShape({
            version: ow.string,
            waitForFinish: ow.optional.number,
            tag: ow.optional.string,
            betaPackages: ow.optional.boolean,
            useCache: ow.optional.boolean,
        }));

        const response = await this.httpClient.call({
            url: this._url('builds'),
            method: 'POST',
            params: this._params(options),
        });

        return parseDateFields(pluckData(response.data));
    }

    lastRun(options = {}) {
        ow(options, ow.object.exactShape({
            status: ow.optional.string.oneOf(Object.values(ACT_JOB_STATUSES)),
        }));

        return new RunClient(this._subResourceOptions({
            id: 'last',
            params: this._params(options),
            disableMethods: ['delete', 'update', 'abort', 'resurrect', 'metamorph'],
        }));
    }

    builds() {
        return new BuildCollectionClient(this._subResourceOptions());
    }

    runs() {
        return new RunCollectionClient(this._subResourceOptions());
    }

    // Tasks don't have an endpoint nested
    // under actors
    // tasks() {
    //     return new TaskCollectionClient({
    //         baseUrl: this._url(),
    //         httpClient: this.httpClient,
    //     });
    // }

    version(versionNumber) {
        ow(versionNumber, ow.string);
        return new ActorVersionClient(this._subResourceOptions({
            id: versionNumber,
        }));
    }

    versions() {
        return new ActorVersionCollectionClient(this._subResourceOptions());
    }

    webhooks() {
        return new WebhookCollectionClient(this._subResourceOptions());
    }
}

module.exports = ActorClient;
