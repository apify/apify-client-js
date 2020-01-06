import Actors from './actors';
import Tasks from './tasks';
import crawlers from './crawlers';
import KeyValueStores from './key_value_stores';
import Logs from './logs';
import Users from './users';
import Datasets from './datasets';
import webhooks from './webhooks';
import webhookDispatches from './webhook_dispatches';
import RequestQueues, {REQUEST_ENDPOINTS_EXP_BACKOFF_MAX_REPEATS} from './request_queues';
import { HttpClient, EXP_BACKOFF_MAX_REPEATS } from './http-client';

/** @ignore */
const DEFAULT_CLIENT_OPTIONS = {
    baseUrl: 'https://api.apify.com',
};

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
const endpointClasses = {
    actors: Actors,
    acts: Actors,
    tasks: Tasks,
    // crawlers,
    keyValueStores: KeyValueStores,
    datasets: Datasets,
    requestQueues: RequestQueues,
    logs: Logs,
    users: Users,
    // webhooks,
    // webhookDispatches,
};

/**
 * @type package
 * @class ApifyClient
 * @param {Object} [options] - Global options for ApifyClient. You can globally configure here any method option from any namespace. For example
 *                             if you are working with just one crawler then you can preset it's crawlerId here instead of passing it to each
 *                             crawler's method.
 * @param {String} [options.userId] - Your user ID at apify.com
 * @param {String} [options.token] - Your API token at apify.com
 * @param {Number} [options.expBackoffMillis=500] - Wait time in milliseconds before repeating request to Apify API in a case of server
                                                    or rate limit error
 * @param {Number} [options.expBackoffMaxRepeats=8] - Maximum number of repeats in a case of error
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
class ApifyClient {
    constructor(options = {}) {
        this.options = {
            ...this.getDefaultOptions(),
            ...options,
        };

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

        this.httpClient = new HttpClient({ ...this.options }, this.stats);

        // Create instances of individual endpoint groups
        Object.entries(endpointClasses).forEach(([name, EndpointClass]) => {
            this[name] = new EndpointClass(this.httpClient);
        });
    }

    /**
     * Overrides options of ApifyClient instance.
     * @memberof ApifyClient
     * @function setOptions
     * @instance
     * @param {Object} newOptions - See {@link ApifyClient} options object
     */
    setOptions(newOptions) {
        this.options = {
            ...this.options,
            ...newOptions,
        };
    }

    /**
     * Returns options of ApifyClient instance.
     * @memberof ApifyClient
     * @function getOptions
     * @instance
     * @return {Object} See {@link ApifyClient} constructor options
     */
    getOptions() {
        return { ...this.options };
    }

    /**
     * This helper function is used in unit tests.
     * @ignore
     */
    getDefaultOptions() {
        return DEFAULT_CLIENT_OPTIONS;
    }
}

export default ApifyClient;
