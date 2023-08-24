import { Browser, DEFAULT_OPTIONS, validateRequest } from './_helper';
import mockServer from './mock_server/server';
import { ApifyClient, StoreCollectionListOptions } from '../src';

describe('Store', () => {
    let baseUrl: string | undefined;
    const browser = new Browser();

    beforeAll(async () => {
        const server = await mockServer.start();
        await browser.start();
        baseUrl = `http://localhost:${server.address().port}`;
    });

    afterAll(async () => {
        await Promise.all([
            mockServer.close(),
            browser.cleanUpBrowser(),
        ]);
    });

    let client: ApifyClient | undefined;
    let page: any;
    beforeEach(async () => {
        page = await browser.getInjectedPage(baseUrl, DEFAULT_OPTIONS);
        client = new ApifyClient({
            baseUrl,
            maxRetries: 0,
            ...DEFAULT_OPTIONS,
        });
    });
    afterEach(async () => {
        client = undefined;
        page.close().catch(() => {});
    });

    test('list() works', async () => {
        const opts = {
            limit: 5,
            offset: 3,
            search: 'my search',
            sortBy: 'my sort',
            category: 'my category',
            username: 'my username',
            pricingModel: 'my pricing model',
        };

        const res: any = client && await client.store().list(opts);
        expect(res.id).toEqual('store-list');
        validateRequest(opts);

        const browserRes: any = await page.evaluate((options: StoreCollectionListOptions) => client && client.store().list(options), opts);
        expect(browserRes.id).toEqual('store-list');
        expect(browserRes).toEqual(res);
        validateRequest(opts);
    });
});
