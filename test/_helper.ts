import { launchPuppeteer, puppeteerUtils } from '@crawlee/puppeteer';
import { expect } from 'vitest';

import { mockServer } from './mock_server/server';

export class Browser {
    async start() {
        this.browser = await launchPuppeteer({
            launchOptions: { headless: true, args: ['--disable-web-security', '--no-sandbox'] },
        });
        return this.browser;
    }

    async getInjectedPage(baseUrl, DEFAULT_OPTIONS, gotoUrl = null) {
        const page = await this.browser.newPage();
        if (gotoUrl) await page.goto(gotoUrl);

        await puppeteerUtils.injectFile(page, `${__dirname}/../dist/bundle.js`);

        page.on('console', (msg) => console.log(msg.text()));
        await page.evaluate(
            (url, defaultQuery) => {
                window.client = new window.Apify.ApifyClient({
                    baseUrl: url,
                    maxRetries: 0,
                    ...defaultQuery,
                });
            },
            baseUrl,
            DEFAULT_OPTIONS,
        );

        return page;
    }

    async cleanUpBrowser() {
        return this.browser.close.call(this.browser);
    }
}

export const DEFAULT_OPTIONS = {
    token: 'default-token',
};

const getExpectedQuery = (callQuery = {}) => {
    const query = optsToQuery(callQuery);
    return {
        ...query,
    };
};

function optsToQuery(params) {
    return Object.entries(params)
        .filter(([k, v]) => v !== false)
        .map(([k, v]) => {
            if (v === true) v = '1';
            else if (Array.isArray(v)) v = v.join(',');
            else if (typeof v === 'number') v = v.toString();
            return [k, v];
        })
        .reduce((newObj, [k, v]) => {
            newObj[k] = v;
            return newObj;
        }, {});
}

export const validateRequest = (query = {}, params = {}, body = {}, additionalHeaders = {}) => {
    const headers = {
        authorization: `Bearer ${DEFAULT_OPTIONS.token}`,
        ...additionalHeaders,
    };
    const request = mockServer.getLastRequest();
    const expectedQuery = getExpectedQuery(query);
    if (query !== false) expect(request.query).toEqual(expectedQuery);
    if (params !== false) expect(request.params).toEqual(params);
    if (body !== false) expect(request.body).toEqual(body);
    Object.entries(headers).forEach(([key, value]) => {
        // Browsers tend to send headers "a bit differently".
        expect(request.headers).toHaveProperty(key);
        const expectedHeaderValue = value.toLowerCase().replace(/\s/g, '');
        const actualHeaderValue = request.headers[key].toLowerCase().replace(/\s/g, '');
        expect(actualHeaderValue).toBe(expectedHeaderValue);
    });
};
