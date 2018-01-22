import _ from 'underscore';
import { requestPromise, REQUEST_PROMISE_OPTIONS } from './utils';
import acts from './acts';
import crawlers from './crawlers';
import keyValueStores from './key_value_stores';
import datasets from './datasets';
import logs from './logs';
import ApifyError, { INVALID_PARAMETER_ERROR_TYPE_V2 } from './apify_error';

/**
 * Apify Client for JavaScript
 */

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
    crawlers,
    keyValueStores,
    datasets,
    logs,
};

/**
 * Creates ApifyClient
 * @class ApifyClient
 * @param {Object} [options] - Global options for ApifyClient. You can globally configure here any method option from any namespace. For example
 *                             if you are working with just one crawler then you can preset it's crawlerId here instead of passing it to each
 *                             crawler's method.
 * @param {String} [options.userId] - Your user ID at apify.com
 * @param {String} [options.token] - Your API token at apify.com
 * @param {Object} [options.promise=Promise] - Promises dependency to use (default is native Promise)
 * @param {Number} [options.expBackOffMillis=500] - Wait time in milliseconds before repeating request to Apify API in a case of server
                                                    or rate limit error
 * @param {Number} [options.expBackOffMaxRepeats=8] - Maximum number of repeats in a case of error
 * @description Basic usage of ApifyClient with Bluebird promise:
 * ```javascript
 * const ApifyClient = require('apify-client');
 * const Promise = require("bluebird");;
 *
 * const apifyClient = new ApifyClient({
 *   userId: 'jklnDMNKLekk',
 *   token: 'SNjkeiuoeD443lpod68dk',
 *   promise: Promise,
 * });
 * ```
 */
const ApifyClient = function (options = {}) {
    // This allows to initiate ApifyClient both ways - with and without "new".
    if (!this || this.constructor !== ApifyClient) return new ApifyClient(options);

    // This is used only internally for unit testing of ApifyClient.
    const undecoratedMethodGroups = options._overrideMethodGroups || methodGroups;
    delete options._overrideMethodGroups;

    const instanceOpts = Object.assign({}, getDefaultOptions(), options);

    // Choose Promises dependency and throw if no one is set.
    if (!instanceOpts.promise) {
        if (typeof Promise === 'function') {
            instanceOpts.promise = Promise;
        } else {
            throw new ApifyError(INVALID_PARAMETER_ERROR_TYPE_V2, 'The "options.promise" parameter is required when native Promise is not available');
        }
    }

    /**
     * This decorator does:
     * - extends "options" parameter with values from default options and from ApifyClient instance options
     * - adds options.baseUrl
     * - passes preconfigured utils.requestPromise with Promises dependency set
     * - allows to use method with both callbacks and promises
     * @ignore
     */
    const methodDecorator = (method) => {
        return (callOpts, callback) => {
            const mergedOpts = Object.assign({}, instanceOpts, callOpts);

            // Check that all required parameters are set.
            if (!instanceOpts.baseUrl) throw new ApifyError(INVALID_PARAMETER_ERROR_TYPE_V2, 'The "options.baseUrl" parameter is required');

            // Remove traling forward slash from baseUrl.
            if (mergedOpts.baseUrl.substr(-1) === '/') mergedOpts.baseUrl = mergedOpts.baseUrl.slice(0, -1);

            const preconfiguredRequestPromise = (requestPromiseOptions) => {
                return requestPromise(Object.assign({}, _.pick(mergedOpts, REQUEST_PROMISE_OPTIONS), requestPromiseOptions));
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
     * @param {Object} options - See {@link ApifyClient} options object for ApifyClient
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
};

export default ApifyClient;
