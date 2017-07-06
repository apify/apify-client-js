import _ from 'underscore';

import { checkParamOrThrow, catchNotFoundOrThrow } from './utils';

/**
 * Crawlers
 * @memberof ApifyClient
 * @namespace crawlers
 */

export const BASE_PATH = '/v1';

function wrapArray(response) {
    return {
        items: response.body,
        total: response.headers['x-apifier-pagination-total'],
        offset: response.headers['x-apifier-pagination-offset'],
        count: response.headers['x-apifier-pagination-count'],
        limit: response.headers['x-apifier-pagination-limit'],
    };
}

export default {
    /**
     * Get all crawlers
     *
     * @memberof ApifyClient.crawlers
     * @param requestPromise
     * @param options
     * @returns {Promise.<TResult>|*}
     */
    listCrawlers: (requestPromise, options) => {
        const { userId, token } = options;

        checkParamOrThrow(userId, 'userId', 'String');
        checkParamOrThrow(token, 'token', 'String');

        const queryString = _.pick(options, 'token', 'offset', 'limit', 'desc');

        return requestPromise({
            url: `${options.baseUrl}${BASE_PATH}/${userId}/crawlers`,
            json: true,
            method: 'GET',
            qs: queryString,
            resolveWithResponse: true,
        }).then(wrapArray);
    },

    /**
     * Create crawler
     * @memberof ApifyClient.crawlers
     * @param requestPromise
     * @param options
     * @returns {*}
     */
    createCrawler: (requestPromise, options) => {
        const { userId, token, settings } = options;

        checkParamOrThrow(userId, 'userId', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(settings, 'settings', 'Object');
        checkParamOrThrow(settings.customId, 'settings.customId', 'String');

        const requestParams = {
            json: true,
            method: 'POST',
            url: `${options.baseUrl}${BASE_PATH}/${userId}/crawlers`,
            qs: { token },
            body: settings,
        };

        return requestPromise(requestParams);
    },

    /**
     * @memberof ApifyClient.crawlers
     * @param requestPromise
     * @param options
     * @returns {*}
     */
    updateCrawler: (requestPromise, options) => {
        const { userId, token, settings, crawlerId } = options;

        checkParamOrThrow(userId, 'userId', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(crawlerId, 'crawlerId', 'String');
        checkParamOrThrow(settings, 'settings', 'Object');

        const requestParams = {
            json: true,
            method: 'PUT',
            url: `${options.baseUrl}${BASE_PATH}/${userId}/crawlers/${crawlerId}`,
            qs: { token },
            body: settings,
        };

        return requestPromise(requestParams);
    },

    /**
     * @memberof ApifyClient.crawlers
     * @param requestPromise
     * @param options
     * @returns {Promise.<T>}
     */
    getCrawlerSettings: (requestPromise, options) => {
        const { userId, token, crawlerId } = options;

        checkParamOrThrow(userId, 'userId', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(crawlerId, 'crawlerId', 'String');

        const queryString = _.pick(options, 'token', 'nosecrets');

        return requestPromise({
            url: `${options.baseUrl}${BASE_PATH}/${userId}/crawlers/${crawlerId}`,
            json: true,
            method: 'GET',
            qs: queryString,
        }).catch(catchNotFoundOrThrow);
    },

    /**
     * @memberof ApifyClient.crawlers
     * @param requestPromise
     * @param options
     * @returns {*}
     */
    deleteCrawler: (requestPromise, options) => {
        const { userId, token, crawlerId } = options;

        checkParamOrThrow(userId, 'userId', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(crawlerId, 'crawlerId', 'String');

        return requestPromise({
            url: `${options.baseUrl}${BASE_PATH}/${userId}/crawlers/${crawlerId}`,
            json: true,
            method: 'DELETE',
            qs: { token },
        });
    },

    /**
     * @memberof ApifyClient.crawlers
     * @param requestPromise
     * @param options
     * @returns {*}
     */
    startExecution: (requestPromise, options) => {
        const { crawlerId, userId, token, settings } = options;

        checkParamOrThrow(userId, 'userId', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(crawlerId, 'crawlerId', 'String');
        checkParamOrThrow(settings, 'settings', 'Maybe Object');

        const queryString = _.pick(options, 'token', 'tag', 'wait');

        const requestParams = {
            json: true,
            method: 'POST',
            url: `${options.baseUrl}${BASE_PATH}/${userId}/crawlers/${crawlerId}/execute`,
            qs: queryString,
        };
        if (!_.isEmpty(settings)) {
            requestParams.body = settings;
        }

        return requestPromise(requestParams);
    },

    /**
     * @memberof ApifyClient.crawlers
     * @param requestPromise
     * @param options
     * @returns {*}
     */
    stopExecution: (requestPromise, options) => {
        const { executionId, token } = options;

        checkParamOrThrow(executionId, 'executionId', 'String');
        checkParamOrThrow(token, 'token', 'String');

        const requestParams = {
            json: true,
            method: 'POST',
            url: `${options.baseUrl}${BASE_PATH}/execs/${executionId}/stop`,
            qs: { token },
        };

        return requestPromise(requestParams);
    },

    /**
     * @memberof ApifyClient.crawlers
     * @param requestPromise
     * @param options
     * @returns {Promise.<TResult>|*}
     */
    getListOfExecutions: (requestPromise, options) => {
        const { userId, crawlerId, token } = options;

        checkParamOrThrow(userId, 'userId', 'String');
        checkParamOrThrow(crawlerId, 'crawlerId', 'String');
        checkParamOrThrow(token, 'token', 'String');

        const queryString = _.pick(options, 'token', 'status', 'offset', 'limit', 'desc');

        return requestPromise({
            url: `${options.baseUrl}${BASE_PATH}/${userId}/crawlers/${crawlerId}/execs`,
            json: true,
            method: 'GET',
            qs: queryString,
            resolveWithResponse: true,
        }).then(wrapArray);
    },

    /**
     * @memberof ApifyClient.crawlers
     * @param requestPromise
     * @param options
     * @returns {Promise.<T>}
     */
    getExecutionDetails: (requestPromise, options) => {
        const { executionId } = options;

        checkParamOrThrow(executionId, 'executionId', 'String');

        return requestPromise({
            url: `${options.baseUrl}${BASE_PATH}/execs/${executionId}`,
            json: true,
            method: 'GET',
        }).catch(catchNotFoundOrThrow);
    },

    /**
     * @memberof ApifyClient.crawlers
     * @param requestPromise
     * @param options
     * @returns {*}
     */
    getLastExecution: (requestPromise, options) => {
        const { userId, crawlerId, token } = options;

        checkParamOrThrow(userId, 'userId', 'String');
        checkParamOrThrow(crawlerId, 'crawlerId', 'String');
        checkParamOrThrow(token, 'token', 'String');

        const queryString = _.pick(options, 'token', 'status');

        return requestPromise({
            url: `${options.baseUrl}${BASE_PATH}/${userId}/crawlers/${crawlerId}/lastExec`,
            json: true,
            method: 'GET',
            qs: queryString,
        });
    },

    /**
     * @memberof ApifyClient.crawlers
     * @param requestPromise
     * @param options
     * @returns {Promise.<TResult>|*}
     */
    getExecutionResults: (requestPromise, options) => {
        const { executionId } = options;

        checkParamOrThrow(executionId, 'executionId', 'String');

        const requestParams = {
            url: `${options.baseUrl}${BASE_PATH}/execs/${executionId}/results`,
            json: true,
            method: 'GET',
            resolveWithResponse: true,
        };
        const queryString = _.pick(options, 'format', 'simplified', 'offset', 'limit', 'desc', 'attachment', 'delimiter', 'bom');
        if (!_.isEmpty(queryString)) {
            requestParams.qs = queryString;
        }

        return requestPromise(requestParams).then(wrapArray);
    },

    /**
     * @memberof ApifyClient.crawlers
     * @param requestPromise
     * @param options
     * @returns {Promise.<TResult>|*}
     */
    getLastExecutionResults: (requestPromise, options) => {
        const { userId, token, crawlerId } = options;

        checkParamOrThrow(userId, 'userId', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(crawlerId, 'crawlerId', 'String');

        const requestParams = {
            url: `${options.baseUrl}${BASE_PATH}/${userId}/crawlers/${crawlerId}/lastExec/results`,
            json: true,
            method: 'GET',
            resolveWithResponse: true,
        };
        const queryString = _.pick(options, 'status', 'token', 'format', 'simplified', 'offset', 'limit', 'desc', 'attachment', 'delimiter', 'bom');
        if (!_.isEmpty(queryString)) {
            requestParams.qs = queryString;
        }

        return requestPromise(requestParams).then(wrapArray);
    },

    _resurrectExecution: (requestPromise, { baseUrl, executionId }) => requestPromise({
        url: `${baseUrl}${BASE_PATH}/execs/${executionId}/resurrect`,
        json: true,
        method: 'POST',
    }),

    _enqueuePage: (requestPromise, { baseUrl, executionId, urls }) => requestPromise({
        url: `${baseUrl}${BASE_PATH}/execs/${executionId}/enqueue`,
        json: true,
        method: 'POST',
        body: urls,
    }),
};
