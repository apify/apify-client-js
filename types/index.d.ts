// TODO yin: Typescript declarations should be testable.
//  One way would be to add typescript as devDependency to this project and write typescript tests right here.
//  The other way would be similar to contributing typings to github.com/DefinitelyTyped: separate the declarations into
//  a different project, run the tests there and have this project untouched by typescript.
import acts from './acts';
import tasks from './tasks';
import crawlers from './crawlers';
import keyValueStores from './key_value_stores';
import datasets from './datasets';
import logs from './logs';
import users from './users';
import webhooks from './webhooks';
import webhookDispatches from './webhook_dispatches';
import requestQueues from './request_queues';
import ApifyClientError from './apify_error';

export default ApifyClient;
export {
    acts,
    tasks,
    crawlers,
    keyValueStores,
    datasets,
    requestQueues,
    logs,
    users,
    webhooks,
    webhookDispatches,
    ApifyClientError
}

/**
 * @param {string} [userId] - Your user ID at apify.com
 * @param {string} [token] - Your API token at apify.com
 * @param {number} [expBackOffMillis=500] - Wait time in milliseconds before repeating request to Apify API in a case of server
 or rate limit error
 * @param {number} [expBackOffMaxRepeats=8] - Maximum number of repeats in a case of error
 * @param {Array<number>} [retryOnStatusCodes=[429]] - An array of status codes on which request gets retried. By default requests are retried
 *                                                             only in a case of limit error (status code 429).
 */
declare interface ApifyClientOptions {
    userId?: string
    token?: string
    expBackOffMillis?: number
    expBackOffMaxRepeats?: number
    retryOnStatusCodes?: Array<number>
}

/**
 * @class ApifyClient
 * @param {ApifyClientOptions} [options] - Global options for ApifyClient. You can globally configure here any method option from any namespace. For example
 *                             if you are working with just one crawler then you can preset it's crawlerId here instead of passing it to each
 *                             crawler's method.
 * @description Basic usage of ApifyClient:
 * ```javascript
 * const ApifyClient = require('apify-client');
 *
 * const apifyClient = new ApifyClient({
 *   userId: 'jklnDMNKLekk',
 *   token: 'SNjkeiuoeD443lpod68dk',
 * });
 * ```
 */
declare class ApifyClient {
    constructor(options: ApifyClientOptions);

    /**
     * Overrides options of ApifyClient instance.
     * @param {ApifyClientOptions} options - See {@link ApifyClient} options object
     */
    setOptions(options: ApifyClientOptions);

    /**
     * Returns options of ApifyClient instance.
     * @return {ApifyClientOptions} See {@link ApifyClient} constructor options
     */
    getOptions(): ApifyClientOptions;

    /**
     * An object that contains various statistics about the API operations.
     */
    stats: {
        /**
         * Number of Apify client function calls.
         */
        calls: number

        /**
         * Number of Apify API requests.
         */
        requests: number

        /**
         * Number of times the API returned 429 error. Spread based on number of retries.
         */
        rateLimitErrors: number
    };
}
