const Apify = require('apify');
const httpClient = require('../src/http-client');
const { REQUEST_ENDPOINTS_EXP_BACKOFF_MAX_REPEATS } = require('../src/request_queues');
const mockServer = require('./mock_server/server');

class Browser {
    async start() {
        this.browser = await Apify.launchPuppeteer({ headless: true, args: ['--disable-web-security'] });
        return this.browser;
    }

    async getInjectedPage(baseUrl, DEFAULT_QUERY) {
        const page = await this.browser.newPage();
        await Apify.utils.puppeteer.injectFile(page, `${__dirname}/../dist/bundle.js`);

        await page.evaluate((url, defaultQuery) => {
            window.client = new window.ApifyClient({
                baseUrl: url,
                maxRetries: 0,
                ...defaultQuery,
            });
        }, baseUrl, DEFAULT_QUERY);
        return page;
    }

    async cleanUpBrowser() {
        return this.browser.close();
    }
}


const DEFAULT_RATE_LIMIT_ERRORS = new Array(
    Math.max(REQUEST_ENDPOINTS_EXP_BACKOFF_MAX_REPEATS, httpClient.EXP_BACKOFF_MAX_REPEATS),
).fill(0);


const newEmptyStats = () => {
    return {
        calls: 0,
        requests: 0,
        rateLimitErrors: [...DEFAULT_RATE_LIMIT_ERRORS],
    };
};

const DEFAULT_QUERY = {
    token: 'default-token',
};

const getExpectedQuery = (callQuery = {}) => {
    const query = optsToQuery(callQuery);
    return {
        ...DEFAULT_QUERY,
        ...query,
    };
};

function optsToQuery(params) {
    return Object
        .entries(params)
        .filter(([k, v]) => v !== false) // eslint-disable-line no-unused-vars
        .map(([k, v]) => {
            if (v === true) v = '1';
            else if (typeof v === 'number') v = v.toString();
            return [k, v];
        })
        .reduce((newObj, [k, v]) => {
            newObj[k] = v;
            return newObj;
        }, {});
}

const validateRequest = (query = {}, params = {}, body = {}, headers = {}) => {
    const request = mockServer.getLastRequest();
    const expectedQuery = getExpectedQuery(query);
    expect(request.query).toEqual(expectedQuery);
    expect(request.params).toEqual(params);
    expect(request.body).toEqual(body);
    Object.entries(headers).forEach(([key, value]) => {
        // Browsers tend to send headers "a bit differently".
        const expectedHeaderValue = value.toLowerCase().replace(/\s/g, '');
        const actualHeaderValue = request.headers[key].toLowerCase().replace(/\s/g, '');
        expect(actualHeaderValue).toBe(expectedHeaderValue);
    });
};

module.exports = {
    validateRequest,
    DEFAULT_QUERY,
    DEFAULT_RATE_LIMIT_ERRORS,
    newEmptyStats,
    Browser,
};
