import _ from 'underscore';

export const BASE_PATH = '/v1';

export default {
    listCrawlers: (requestPromise, options) => {
        if (!options.userId) {
            throw new Error('Missing required parameter: userId');
        }
        if (!options.token) {
            throw new Error('Missing required parameter: token');
        }

        const queryString = _.pick(options, 'token', 'offset', 'query', 'desc');

        return requestPromise({
            url: `${options.baseUrl}${BASE_PATH}/${options.userId}/crawlers`,
            json: true,
            method: 'GET',
            qs: queryString,
        });
    },

    startCrawler: (requestPromise, options) => {
        if (!options.crawler) {
            throw new Error('Missing required parameter: crawler');
        }
        if (!options.token) {
            throw new Error('Missing required parameter: token');
        }

        const bodyAttributes = ['customId',
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

        const body = _.pick(options, bodyAttributes);
        const queryString = _.pick(options, 'token', 'tag', 'wait');

        const requestParams = {
            json: true,
            method: 'POST',
            url: `${options.baseUrl}${BASE_PATH}/${options.userId}/crawlers/${options.crawler}/execute`,
            qs: queryString,
        };
        if (!_.isEmpty(body)) {
            requestParams.body = body;
        }

        return requestPromise(requestParams);
    },
};
