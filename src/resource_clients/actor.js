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
     * @param {object} options
     * @param {string} options.id
     * @param {string} options.baseUrl
     * @param {HttpClient} options.httpClient
     * @param {object} [options.params]
     */
    constructor(options) {
        super({
            resourcePath: 'acts',
            ...options,
        });
    }

    async start(options = {}) {
        ow(options, ow.object.exactShape({
            contentType: ow.optional.string,
            waitForFinish: ow.optional.number,
            timeout: ow.optional.number,
            memory: ow.optional.number,
            build: ow.optional.string,
            webhooks: ow.optional.array.ofType(ow.object),
            input: ow.any,
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
        if (options.contentType) {
            request.headers = {
                'content-type': options.contentType,
            };
        }

        const response = await this.httpClient.call(request);
        return parseDateFields(pluckData(response.data));
    }

    async call() {
        // TODO
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
        return new RunClient({
            id: 'last',
            baseUrl: this._url(),
            httpClient: this.httpClient,
            params: this._params(options),
            disableMethods: ['delete', 'update', 'abort', 'resurrect', 'metamorph'],
        });
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
