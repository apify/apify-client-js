import _ from 'underscore';

import { checkParamOrThrow } from './utils';

export const BASE_PATH = '/v1';
export const CRAWLER_ATTRIBUTES = [
    'customId',
    '_id',
    'comments',
    'startUrls',
    'crawlPurls',
    'pageFunction',
    'clickableElementsSelector',
    'interceptRequest',
    'considerUrlFragment',
    'loadImages',
    'loadCss',
    'injectJQuery',
    'injectUnderscoreJs',
    'ignoreRobotsTxt',
    'skipLoadingFrames',
    'verboseLog',
    'disableWebSecurity',
    'maxCrawledPages',
    'maxOutputPages',
    'maxCrawlDepth',
    'timeout',
    'resourceTimeout',
    'pageLoadTimeout',
    'pageFunctionTimeout',
    'maxInfiniteScrollHeight',
    'randomWaitBetweenRequests',
    'maxCrawledPagesPerSlave',
    'maxParallelRequests',
    'customHttpHeaders',
    'customProxies',
    'cookies',
    'cookiesPersistence',
    'customData',
    'finishWebhookUrl',
];

export default {
    listCrawlers: (requestPromise, options) => {
        const { userId, token } = options;

        checkParamOrThrow('String', userId, 'userId');
        checkParamOrThrow('String', token, 'token');

        const queryString = _.pick(options, 'token', 'offset', 'query', 'desc');

        return requestPromise({
            url: `${options.baseUrl}${BASE_PATH}/${userId}/crawlers`,
            json: true,
            method: 'GET',
            qs: queryString,
        });
    },

    getCrawlerSettings: (requestPromise, options) => {
        const { userId, token, crawler } = options;

        checkParamOrThrow('String', userId, 'userId');
        checkParamOrThrow('String', token, 'token');
        checkParamOrThrow('String', crawler, 'crawler');

        const queryString = _.pick(options, 'token', 'nosecrets');
        return requestPromise({
            url: `${options.baseUrl}${BASE_PATH}/${userId}/crawlers/${crawler}`,
            json: true,
            method: 'GET',
            qs: queryString,
        });
    },

    deleteCrawler: (requestPromise, options) => {
        const { userId, token, crawler } = options;

        checkParamOrThrow('String', userId, 'userId');
        checkParamOrThrow('String', token, 'token');
        checkParamOrThrow('String', crawler, 'crawler');

        return requestPromise({
            url: `${options.baseUrl}${BASE_PATH}/${userId}/crawlers/${crawler}`,
            json: true,
            method: 'DELETE',
            qs: { token },
        });
    },

    startCrawler: (requestPromise, options) => {
        const { crawler, token, userId } = options;

        checkParamOrThrow('String', userId, 'userId');
        checkParamOrThrow('String', crawler, 'crawler');
        checkParamOrThrow('String', token, 'token');

        const body = _.pick(options, CRAWLER_ATTRIBUTES);
        const queryString = _.pick(options, 'token', 'tag', 'wait');

        const requestParams = {
            json: true,
            method: 'POST',
            url: `${options.baseUrl}${BASE_PATH}/${userId}/crawlers/${crawler}/execute`,
            qs: queryString,
        };
        if (!_.isEmpty(body)) {
            requestParams.body = body;
        }

        return requestPromise(requestParams);
    },

    stopExecution: (requestPromise, options) => {
        const { executionId, token } = options;

        checkParamOrThrow('String', executionId, 'executionId');
        checkParamOrThrow('String', token, 'token');

        const requestParams = {
            json: true,
            method: 'POST',
            url: `${options.baseUrl}${BASE_PATH}/execs/${executionId}/stop`,
            qs: { token },
        };

        return requestPromise(requestParams);
    },

    getListOfExecutions: (requestPromise, options) => {
        const { userId, crawler, token } = options;

        checkParamOrThrow('String', userId, 'userId');
        checkParamOrThrow('String', crawler, 'crawler');
        checkParamOrThrow('String', token, 'token');

        const queryString = _.pick(options, 'token', 'status', 'offset', 'limit', 'desc');

        return requestPromise({
            url: `${options.baseUrl}${BASE_PATH}/${userId}/crawlers/${crawler}/execs`,
            json: true,
            method: 'GET',
            qs: queryString,
        });
    },

    getExecutionDetails: (requestPromise, options) => {
        const { executionId } = options;

        checkParamOrThrow('String', executionId, 'executionId');

        return requestPromise({
            url: `${options.baseUrl}${BASE_PATH}/execs/${executionId}`,
            json: true,
            method: 'GET',
        });
    },

    getLastExecution: (requestPromise, options) => {
        const { userId, crawler, token } = options;

        checkParamOrThrow('String', userId, 'userId');
        checkParamOrThrow('String', crawler, 'crawler');
        checkParamOrThrow('String', token, 'token');

        const queryString = _.pick(options, 'token', 'status');

        return requestPromise({
            url: `${options.baseUrl}${BASE_PATH}/${userId}/crawlers/${crawler}/lastExecution`,
            json: true,
            method: 'GET',
            qs: queryString,
        });
    },

    getExecutionResults: (requestPromise, options) => {
        const { executionId } = options;

        checkParamOrThrow('String', executionId, 'executionId');

        const requestParams = {
            url: `${options.baseUrl}${BASE_PATH}/execs/${executionId}/results`,
            json: true,
            method: 'GET',
        };
        const queryString = _.pick(options, 'format', 'simplified', 'offset', 'limit', 'desc', 'attachment', 'delimiter', 'bom');
        if (!_.isEmpty(queryString)) {
            requestParams.qs = queryString;
        }

        return requestPromise(requestParams);
    },

    getLastExecutionResults: (requestPromise, options) => {
        const { userId, token, crawler } = options;

        checkParamOrThrow('String', userId, 'userId');
        checkParamOrThrow('String', token, 'token');
        checkParamOrThrow('String', crawler, 'crawler');

        const requestParams = {
            url: `${options.baseUrl}${BASE_PATH}/${userId}/crawlers/${crawler}/lastExecution/results`,
            json: true,
            method: 'GET',
        };
        const queryString = _.pick(options, 'status', 'token', 'format', 'simplified', 'offset', 'limit', 'desc', 'attachment', 'delimiter', 'bom');
        if (!_.isEmpty(queryString)) {
            requestParams.qs = queryString;
        }

        return requestPromise(requestParams);
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
