import _ from 'underscore';
import { requestPromise } from './utils';
import * as acts from './acts';
import crawlers from './crawlers';
import keyValueStores from './key-value-stores';

const getDefaultOptions = () => ({
    protocol: 'https',
    host: 'api.apifier.com',
    basePath: '',
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
            throw new Error('The "options.promise" parameter is required when native Promise is not available.');
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
            ['protocol', 'host', 'promise'].forEach((key) => {
                if (!instanceOpts[key]) throw new Error(`"options.${key}" parameter is required`);
            });

            // TODO: what's the point of having separate protocol/host/port/basePath?
            //       IMHO it's too complicated. The only relevant use case is it to enable testing on dev/staging,
            //       but this complicates config files or I need to parse the base URL before passing it to ApifyClient.
            //       please use simple 'baseUrl' in options, that's it
            //       (see https://github.com/Apifier/apifier-sdk-js/commit/b5d7db11954207c0f0adbfa668488312a44398a2)
            // eslint-disable-next-line prefer-template
            mergedOpts.baseUrl = mergedOpts.protocol
                               + '://'
                               + mergedOpts.host
                               + (mergedOpts.port ? `:${mergedOpts.port}` : '')
                               + mergedOpts.basePath;

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

    // This helper function is used in unit tests.
    this.getDefaultOptions = getDefaultOptions;
};

export default ApifyClient;
