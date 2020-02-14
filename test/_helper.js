import retry from 'async-retry';
import log from 'apify-shared/log';
import Apify from 'apify';
import * as httpClient from '../build/http-client';
import { REQUEST_ENDPOINTS_EXP_BACKOFF_MAX_REPEATS } from '../build/request_queues';


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
        client = new ApifyClient({
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
