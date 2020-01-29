import { expect } from 'chai';
import Apify from 'Apify';
import mockServer from './mock_server/server';

const DEFAULT_QUERY = {
    token: 'default-token',
};

function validateRequest(query = {}, params = {}, body = {}, headers = {}) {
    const request = mockServer.getLastRequest();
    const expectedQuery = getExpectedQuery(query);
    expect(request.query).to.be.eql(expectedQuery);
    expect(request.params).to.be.eql(params);
    expect(request.body).to.be.eql(body);
    expect(request.headers).to.include(headers);
}

function getExpectedQuery(callQuery = {}) {
    const query = optsToQuery(callQuery);
    return {
        ...DEFAULT_QUERY,
        ...query,
    };
}

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
describe('Actor methods', () => {
    let baseUrl = null;
    let page = null;
    let browser = null;
    const getBrowserResponse = (func, opts) => {
        return page.evaluate(() => {
            return eval(`$${func}(${opts})`);
        });
    };
    before(async () => {
        const server = await mockServer.start(3333);
        baseUrl = `http://localhost:${server.address().port}`;
    });
    after(() => mockServer.close());

    let client = null;
    beforeEach(async () => {
        browser = await Apify.launchPuppeteer({ headless: true, args: ['--disable-web-security'] });
        page = await browser.newPage();
        await Apify.utils.puppeteer.injectFile(page, `${__dirname}/../dist/bundle.js`);

        await page.evaluate((url, defaultQuery) => {
            client = new ApifyClient({
                baseUrl: url,
                expBackoffMaxRepeats: 0,
                expBackoffMillis: 1,
                ...defaultQuery,
            });
        }, baseUrl, DEFAULT_QUERY);
    });
    afterEach(async () => {
        await page.close();
        await browser.close();
        client = null;
    });
    it('listActs() works', async () => {
        const opts = {
            limit: 5,
            offset: 3,
            desc: true,
        };
        await getBrowserResponse()

        const res = await page.evaluate(async () => client.acts.listActs({
            limit: 5,
            offset: 3,
            desc: true,
        }));
        expect(res.id).to.be.eql('list-actors');
        validateRequest(opts);
    });
});
