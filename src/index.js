import _ from 'underscore';
import { requestPromise, REQUEST_PROMISE_OPTIONS, EXP_BACKOFF_MAX_REPEATS } from './utils';
import acts from './acts';
import tasks from './tasks';
import keyValueStores from './key_value_stores';
import datasets from './datasets';
import logs from './logs';
import users from './users';
import webhooks from './webhooks';
import webhookDispatches from './webhook_dispatches';
import requestQueues, { REQUEST_ENDPOINTS_EXP_BACKOFF_MAX_REPEATS } from './request_queues';
import ApifyClientError, { INVALID_PARAMETER_ERROR_TYPE } from './apify_error';

/** @ignore */
const getDefaultOptions = () => ({
    baseUrl: 'https://api.apify.com',
});

/**
 * IMPORTANT:
 *
 * This file MUST contain only one export which is default export of Apify Client.
 * Otherwise it would not get exported under require('apify-client') but ugly
 * require('apify-client').default instead.
 *
 * See: https://github.com/59naga/babel-plugin-add-module-exports
 */

/**
 * Each property is a plain object of methods.
 *
 * Method must have 2 parameters "options" and "requestPromise" where:
 * - requestPromise is utils.requestPromise with Promise parameter set based on
 *   user's choice of Promises dependency.
 * - options
 *
 * Method must return promise.
 * @ignore
 */
const methodGroups = {
    acts,
    tasks,
    keyValueStores,
    datasets,
    requestQueues,
    logs,
    users,
    webhooks,
    webhookDispatches,
};

/**
 * @type package
 * @class ApifyClient
 * @param {Object} [options] - Global options for ApifyClient. You can globally configure here any method option from any namespace. For example
 *                             if you are working with just one actor then you can preset it's actId here instead of passing it to each
 *                             actor's method.
 * @param {String} [options.userId] - Your user ID at apify.com
 * @param {String} [options.token] - Your API token at apify.com
 * @param {Number} [options.expBackOffMillis=500] - Wait time in milliseconds before repeating request to Apify API in a case of server
                                                    or rate limit error
 * @param {Number} [options.expBackOffMaxRepeats=8] - Maximum number of repeats in a case of error
 * @param {Array<Number>} [options.retryOnStatusCodes=[429]] - An array of status codes on which request gets retried. By default requests are retried
 *                                                             only in a case of limit error (status code 429).
 * @description Basic usage of ApifyClient:
 * ```javascript
 * const ApifyClient = require('apify-client');
 *
 * const apifyClient = new ApifyClient({
 *   userId: 'jklnDMNKLekk',
 *   token: 'SNjkeiuoeD443lpod68dk',
 * });
 * ```
 *
 * All API calls done through this client are made with exponential backoff.
 * What this means, is that if the API call fails, this client will attempt the call again with a small delay.
 * If it fails again, it will do another attempt after twice as long and so on, until one attempt succeeds
 * or 8th attempt fails.
 */
const ApifyClient = function (options = {}) {
    // This allows to initiate ApifyClient both ways - with and without "new".
    if (!this || this.constructor !== ApifyClient) return new ApifyClient(options);

    // This is used only internally for unit testing of ApifyClient.
    const undecoratedMethodGroups = options._overrideMethodGroups || methodGroups;
    delete options._overrideMethodGroups;

    const instanceOpts = Object.assign({}, getDefaultOptions(), options);

    /**
     * This decorator does:
     * - extends "options" parameter with values from default options and from ApifyClient instance options
     * - adds options.baseUrl
     * - passes preconfigured utils.requestPromise
     * - allows to use method with both callbacks and promises
     * @ignore
     */
    const methodDecorator = (method) => {
        return (callOpts, callback) => {
            const mergedOpts = Object.assign({}, instanceOpts, callOpts);

            // Check that all required parameters are set.
            if (!instanceOpts.baseUrl) throw new ApifyClientError(INVALID_PARAMETER_ERROR_TYPE, 'The "options.baseUrl" parameter is required');

            // Remove traling forward slash from baseUrl.
            if (mergedOpts.baseUrl.substr(-1) === '/') mergedOpts.baseUrl = mergedOpts.baseUrl.slice(0, -1);

            const preconfiguredRequestPromise = (requestPromiseOptions) => {
                return requestPromise(Object.assign({}, _.pick(mergedOpts, REQUEST_PROMISE_OPTIONS), requestPromiseOptions), this.stats);
            };

            const promise = method(preconfiguredRequestPromise, mergedOpts);
            if (!callback) return promise;

            promise.then(
                result => callback(null, result),
                error => callback(error),
            );
        };
    };

    // Decorate methods and bind them to this object.
    _.forEach(undecoratedMethodGroups, (methodGroup, name) => {
        this[name] = _.mapObject(methodGroup, methodDecorator);
    });
    /**
     * Overrides options of ApifyClient instance.
     * @memberof ApifyClient
     * @function setOptions
     * @instance
     * @param {Object} options - See {@link ApifyClient} options object
     */
    this.setOptions = (newOptions) => {
        _.forEach(newOptions, (val, key) => {
            instanceOpts[key] = val;
        });
    };

    /**
     * Returns options of ApifyClient instance.
     * @memberof ApifyClient
     * @function getOptions
     * @instance
     * @return {Object} See {@link ApifyClient} constructor options
     */
    this.getOptions = () => {
        return _.clone(instanceOpts);
    };

    /**
     * This helper function is used in unit tests.
     * @ignore
     */
    this.getDefaultOptions = getDefaultOptions;

    /**
     * An object that contains various statistics about the API operations.
     * @memberof ApifyClient
     * @instance
     */
    this.stats = {
        // Number of Apify client function calls
        calls: 0,

        // Number of Apify API requests
        requests: 0,

        // Number of times the API returned 429 error. Spread based on number of retries.
        rateLimitErrors: new Array(Math.max(REQUEST_ENDPOINTS_EXP_BACKOFF_MAX_REPEATS, EXP_BACKOFF_MAX_REPEATS)).fill(0),

        // TODO: We can add internalServerErrors and other stuff here...
    };
};

export default ApifyClient;
