import _ from 'underscore';
import { requestPromise } from './utils';
import * as acts from './acts';
import crawlers from './crawlers';
import keyValueStores from './key_value_stores';
import ApifyError, { INVALID_PARAMETER_ERROR_TYPE } from './apify_error';

const getDefaultOptions = () => ({
    baseUrl: 'https://api.apifier.com',
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
 */
const methodGroups = {
    acts,
    crawlers,
    keyValueStores,
};

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
            throw new ApifyError(INVALID_PARAMETER_ERROR_TYPE, 'The "options.promise" parameter is required when native Promise is not available');
        }
    }

    const preconfiguredRequest = _.partial(requestPromise, instanceOpts.promise);

    /**
     * This decorator does:
     * - extends "options" parameter with values from default options and from ApifyClient instance options
     * - adds options.baseUrl
     * - passes preconfigured utils.requestPromise with Promises dependency set
     * - allows to use method with both callbacks and promises
     */
    const methodDecorator = (method) => {
        return (callOpts, callback) => {
            const mergedOpts = Object.assign({}, instanceOpts, callOpts);

            // Check that all required parameters are set.
            if (!instanceOpts.baseUrl) throw new ApifyError(INVALID_PARAMETER_ERROR_TYPE, 'The "options.baseUrl" parameter is required');

            const promise = method(preconfiguredRequest, mergedOpts);

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

    // Add setOptions(options) method to allow setOptions overriding.
    this.setOptions = (newOptions) => {
        _.forEach(newOptions, (val, key) => {
            instanceOpts[key] = val;
        });
    };

    // Add getOptions() method to enable users to fetch current settings.
    this.getOptions = () => {
        return _.clone(instanceOpts);
    };

    // This helper function is used in unit tests.
    this.getDefaultOptions = getDefaultOptions;
};

export default ApifyClient;
