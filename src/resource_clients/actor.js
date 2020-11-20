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
     * https://docs.apify.com/api/v2#/reference/actors/actor-object/get-actor
     * @return {Promise<?Actor>}
     */
    async get() {
        return this._get();
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/actor-object/update-actor
     * @param {object} newFields
     * @return {Promise<Actor>}
     */
    async update(newFields) {
        ow(newFields, ow.object);
        return this._update(newFields);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/actor-object/delete-actor
     * @return {Promise<void>}
     */
    async delete() {
        return this._delete();
    }

    /**
     * Starts an actor and immediately returns the Run object.
     * https://docs.apify.com/api/v2#/reference/actors/run-collection/run-actor
     * @param {*} [input]
     * @param {object} [options]
     * @param {string} [options.build]
     * @param {string} [options.contentType]
     * @param {number} [options.memory]
     * @param {number} [options.timeout]
     * @param {object[]} [options.webhooks]
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
     * Starts an actor and waits for it to finish before returning the Run object.
     * It waits indefinitely, unless the `waitSecs` option is provided.
     * https://docs.apify.com/api/v2#/reference/actors/run-collection/run-actor
     * @param {*} [input]
     * @param {object} [options]
     * @param {string} [options.build]
     * @param {string} [options.contentType]
     * @param {number} [options.memory]
     * @param {number} [options.timeout]
     * @param {number} [options.waitSecs]
     * @param {object[]} [options.webhooks]
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
        const { id } = await this.start(input, startOptions);

        // Calling root client because we need access to top level API.
        // Creating a new instance of RunClient here would only allow
        // setting it up as a nested route under actor API.
        return this.apifyClient.run(id).waitForFinish({ waitSecs });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/build-collection/build-actor
     * @param {string} versionNumber
     * @param {object} [options]
     * @param {boolean} [options.betaPackages]
     * @param {string} [options.tag]
     * @param {boolean} [options.useCache]
     * @return {Promise<Build>}
     */
    async build(versionNumber, options = {}) {
        ow(versionNumber, ow.string);
        ow(options, ow.object.exactShape({
            betaPackages: ow.optional.boolean,
            tag: ow.optional.string,
            useCache: ow.optional.boolean,
            waitForFinish: ow.optional.number,
        }));

        const response = await this.httpClient.call({
            url: this._url('builds'),
            method: 'POST',
            params: this._params({
                version: versionNumber,
                ...options,
            }),
        });

        return parseDateFields(pluckData(response.data));
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/last-run-object-and-its-storages
     * @param {object} options
     * @param {string} options.status
     * @return {RunClient}
     */
    lastRun(options = {}) {
        ow(options, ow.object.exactShape({
            status: ow.optional.string.oneOf(Object.values(ACT_JOB_STATUSES)),
        }));

        return new RunClient(this._subResourceOptions({
            id: 'last',
            params: this._params(options),
            resourcePath: 'runs',
        }));
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/build-collection
     * @return {BuildCollectionClient}
     */
    builds() {
        return new BuildCollectionClient(this._subResourceOptions({
            resourcePath: 'builds',
        }));
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/run-collection
     * @return {RunCollectionClient}
     */
    runs() {
        return new RunCollectionClient(this._subResourceOptions({
            resourcePath: 'runs',
        }));
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/version-object
     * @param {string} versionNumber
     * @return {ActorVersionClient}
     */
    version(versionNumber) {
        ow(versionNumber, ow.string);
        return new ActorVersionClient(this._subResourceOptions({
            id: versionNumber,
        }));
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/version-collection
     * @return {ActorVersionCollectionClient}
     */
    versions() {
        return new ActorVersionCollectionClient(this._subResourceOptions());
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/webhook-collection
     * @return {WebhookCollectionClient}
     */
    webhooks() {
        return new WebhookCollectionClient(this._subResourceOptions());
    }
}

module.exports = ActorClient;
