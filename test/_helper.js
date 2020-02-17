import Apify from 'apify';
import * as httpClient from '../build/http-client';
import { REQUEST_ENDPOINTS_EXP_BACKOFF_MAX_REPEATS } from '../build/request_queues';
import mockServer from './mock_server/server';


export const DEFAULT_RATE_LIMIT_ERRORS = new Array(
    Math.max(REQUEST_ENDPOINTS_EXP_BACKOFF_MAX_REPEATS, httpClient.EXP_BACKOFF_MAX_REPEATS),
).fill(0);


export const newEmptyStats = () => {
    return {
        calls: 0,
        requests: 0,
        rateLimitErrors: [...DEFAULT_RATE_LIMIT_ERRORS],
    };
};
export const getInjectedPage = async (baseUrl, DEFAULT_QUERY) => {
    const browser = await Apify.launchPuppeteer({ headless: true, args: ['--disable-web-security'] });
    const page = await browser.newPage();
    await Apify.utils.puppeteer.injectFile(page, `${__dirname}/../dist/bundle.js`);

    await page.evaluate((url, defaultQuery) => {
        window.client = new window.ApifyClient({
            baseUrl: url,
            expBackoffMaxRepeats: 0,
            expBackoffMillis: 1,
            ...defaultQuery,
        });
    }, baseUrl, DEFAULT_QUERY);
    return page;
};
export const cleanUpBrowser = async (page) => {
    const browser = await page.browser();
    await page.close();
    return browser.close();
};

export const DEFAULT_QUERY = {
    token: 'default-token',
};

export const getExpectedQuery = (callQuery = {}) => {
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

export const validateRequest = (query = {}, params = {}, body = {}, headers = {}) => {
    const request = mockServer.getLastRequest();
    const expectedQuery = getExpectedQuery(query);
    expect(request.query).toEqual(expectedQuery);
    expect(request.params).toEqual(params);
    expect(request.body).toEqual(body);
    Object.entries(headers).forEach(([key, value]) => {
        expect(request.headers).toHaveProperty(key, value);
    });
};
