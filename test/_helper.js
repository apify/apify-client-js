const Apify = require('apify');
const mockServer = require('./mock_server/server');

class Browser {
    async start() {
        this.browser = await Apify.launchPuppeteer({
            launchOptions: { headless: true, args: ['--disable-web-security'] },
        });
        return this.browser;
    }

    async getInjectedPage(baseUrl, DEFAULT_OPTIONS) {
        const page = await this.browser.newPage();
        await Apify.utils.puppeteer.injectFile(page, `${__dirname}/../dist/bundle.js`);

        page.on('console', (msg) => console.log(msg.text()));
        await page.evaluate((url, defaultQuery) => {
            window.client = new window.Apify.ApifyClient({
                baseUrl: url,
                maxRetries: 0,
                ...defaultQuery,
            });
        }, baseUrl, DEFAULT_OPTIONS);
        return page;
    }

    async cleanUpBrowser() {
        return this.browser.close();
    }
}

const DEFAULT_OPTIONS = {
    token: 'default-token',
};

const getExpectedQuery = (callQuery = {}) => {
    const query = optsToQuery(callQuery);
    return {
        ...query,
    };
};

function optsToQuery(params) {
    return Object
        .entries(params)
        .filter(([k, v]) => v !== false) // eslint-disable-line no-unused-vars
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

const validateRequest = (query = {}, params = {}, body = {}, additionalHeaders = {}) => {
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

module.exports = {
    validateRequest,
    DEFAULT_OPTIONS,
    Browser,
};
