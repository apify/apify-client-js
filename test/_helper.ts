import { launchPuppeteer, puppeteerUtils } from '@crawlee/puppeteer';
import { expect } from 'vitest';

import { mockServer } from './mock_server/server';
import { Dictionary } from 'apify-client';
import { Browser as PuppeteerBrowser } from 'puppeteer';
import { Request } from 'express';

export class Browser {
    private browser: PuppeteerBrowser | undefined;

    async start() {
        this.browser = await launchPuppeteer({
            launchOptions: { headless: true, args: ['--disable-web-security', '--no-sandbox'] },
        });
        return this.browser;
    }

    async getInjectedPage(baseUrl?: string, DEFAULT_OPTIONS?: Dictionary<any>, gotoUrl?: string) {
        if (!this.browser) throw new Error('Browser is not started. Call start() first.');

        const page = await this.browser.newPage();
        if (gotoUrl) await page.goto(gotoUrl);

        await puppeteerUtils.injectFile(page, `${__dirname}/../dist/bundle.js`);

        page.on('console', (msg) => console.log(msg.text()));
        await page.evaluate(
            (url, defaultQuery) => {
                (window as any).client = new (window as any).Apify.ApifyClient({
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
        return this.browser?.close.call(this.browser);
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

function optsToQuery(params: Dictionary<any>) {
    return Object.entries(params)
        .filter(([_, v]) => v !== false)
        .map(([k, v]) => {
            if (v === true) v = '1';
            else if (Array.isArray(v)) v = v.join(',');
            else if (typeof v === 'number') v = v.toString();
            return [k, v];
        })
        .reduce((newObj, [k, v]) => {
            newObj[k] = v;
            return newObj;
        }, {} as Dictionary<string>);
}

export const validateRequest = ({
    query = {},
    params = {},
    body = {},
    additionalHeaders = {},
    path,
}: {
    query?: Dictionary<string | number | boolean | undefined | string[]>;
    params?: Request['params'];
    body?: Request['body'];
    additionalHeaders?: Request['headers'];
    path?: Request['path'];
} = {}) => {
    const headers = {
        authorization: `Bearer ${DEFAULT_OPTIONS.token}`,
        ...additionalHeaders,
    };
    const request = mockServer.getLastRequest();
    if (path) {
        expect(`${request?.baseUrl}${request?.path}`).toEqual(path);
    }

    const expectedQuery = getExpectedQuery(query);
    if (query) expect(request?.query).toEqual(expectedQuery);
    if (params) expect(request?.params).toEqual(params);
    if (body) expect(request?.body).toEqual(body);
    Object.entries(headers).forEach(([key, value]) => {
        // Browsers tend to send headers "a bit differently".
        expect(request?.headers).toHaveProperty(key);
        const expectedHeaderValue = Array.isArray(value)
            ? value.join('').toLowerCase().replace(/\s/g, '')
            : value.toLowerCase().replace(/\s/g, '');

        const actualHeaderValue = Array.isArray(request?.headers[key])
            ? request?.headers[key].join('').toLowerCase().replace(/\s/g, '')
            : request?.headers[key]?.toLowerCase().replace(/\s/g, '');

        expect(actualHeaderValue).toBe(expectedHeaderValue);
    });
};
