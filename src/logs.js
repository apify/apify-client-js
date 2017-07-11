import { checkParamOrThrow } from './utils';

/**
 * Logs
 * @memberOf ApifyClient
 * @namespace logs
 */

export const BASE_PATH = '/v2/logs';

export default {
    /**
     * @memberof ApifyClient.logs
     * @param requestPromise
     * @param options
     * @returns {Promise.<TResult>|*}
     */
    getLog: (requestPromise, options) => {
        const { baseUrl, logId } = options;

        checkParamOrThrow(logId, 'logId', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${logId}`,
            method: 'GET',
            gzip: true,
        });
    },
};
