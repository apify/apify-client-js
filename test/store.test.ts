import type { StoreCollectionListOptions } from 'apify-client';
import { ApifyClient } from 'apify-client';

import type { ApifyResponse } from '../src/http_client';
import { Browser, DEFAULT_OPTIONS, validateRequest } from './_helper';
import { mockServer } from './mock_server/server';

describe('Store', () => {
    let baseUrl: string | undefined;
    const browser = new Browser();

    beforeAll(async () => {
        const server = await mockServer.start();
        await browser.start();
        baseUrl = `http://localhost:${server.address().port}`;
    });

    afterAll(async () => {
        await Promise.all([mockServer.close(), browser.cleanUpBrowser()]);
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
        const res: any = client && (await client.store().list(opts));
        expect(res.id).toEqual('store-list');
        validateRequest(opts);

        const browserRes: any = await page.evaluate(
            async (options: StoreCollectionListOptions) => client && client.store().list(options),
            opts,
        );
        expect(browserRes.id).toEqual('store-list');
        const { [Symbol.asyncIterator]: _, ...expectedResponse } = res;
        expect(browserRes).toEqual(expectedResponse);
        validateRequest(opts);
    });
});

describe('actor.store.list as async iterable', () => {
    // Test using store().list() as an async iterable
    const client: ApifyClient = new ApifyClient();

    const createItems = (count: number) => {
        return new Array(count).fill('some actor details');
    };

    const exampleResponseData = {
        total: 2500,
        count: 0,
        offset: 0,
        limit: 0,
        desc: false,
        items: createItems(1000),
    };

    const testCases = [
        {
            testName: 'Known total items, no offset, no limit',
            options: {},
            responseDataOverrides: [
                { count: 1000, limit: 1000 },
                { count: 1000, limit: 1000, offset: 1000 },
                { count: 500, limit: 1000, offset: 2000, items: createItems(500) },
            ],
            expectedItems: 2500,
        },
        {
            testName: 'Known total items, user offset, no limit',
            options: { offset: 1000 },
            responseDataOverrides: [
                { count: 1000, limit: 1000, offset: 1000 },
                { count: 500, limit: 1000, offset: 2000, items: createItems(500) },
            ],
            expectedItems: 1500,
        },
        {
            testName: 'Known total items, no offset, user limit',
            options: { limit: 1100 },
            responseDataOverrides: [
                { count: 1000, limit: 1000 },
                { count: 100, limit: 100, offset: 1000, items: createItems(100) },
            ],
            expectedItems: 1100,
        },
        {
            testName: 'Known total items, user offset, user limit',
            options: { offset: 1000, limit: 1100 },
            responseDataOverrides: [
                { count: 1000, limit: 1000, offset: 1000 },
                { count: 100, limit: 100, offset: 2000, items: createItems(100) },
            ],
            expectedItems: 1100,
        },
        {
            testName: 'Unknown total items, no offset, no limit',
            options: {},
            responseDataOverrides: [
                { total: undefined, count: 1000, limit: 1000 },
                { total: undefined, count: 1000, limit: 1000, offset: 1000 },
                { total: undefined, count: 500, limit: 1000, offset: 2000, items: createItems(500) },
                { total: undefined, count: 0, limit: 1000, offset: 2500, items: [] }, // In this case, iterator had to try as it does not know if there is more or not and there is no user limit.
            ],
            expectedItems: 2500,
        },
        {
            testName: 'Unknown total items, user offset, no limit',
            options: { offset: 1000 },
            responseDataOverrides: [
                { total: undefined, count: 1000, limit: 1000, offset: 1000 },
                { total: undefined, count: 500, limit: 1000, offset: 2000, items: createItems(500) },
                { total: undefined, count: 0, limit: 1000, offset: 2500, items: [] }, // In this case, iterator had to try as it does not know if there is more or not and there is no user limit.
            ],
            expectedItems: 1500,
        },
        {
            testName: 'Unknown total items, no offset, user limit',
            options: { limit: 1100 },
            responseDataOverrides: [
                { total: undefined, count: 1000, limit: 1000 },
                { total: undefined, count: 100, limit: 100, offset: 1000, items: createItems(100) },
            ],
            expectedItems: 1100,
        },
        {
            testName: 'Unknown total items, user offset, user limit',
            options: { offset: 1000, limit: 1100 },
            responseDataOverrides: [
                { total: undefined, count: 1000, limit: 1000, offset: 1000 },
                { total: undefined, count: 100, limit: 100, offset: 2000, items: createItems(100) },
            ],
            expectedItems: 1100,
        },
    ];

    test.each(testCases)('$testName', async ({ options, responseDataOverrides, expectedItems }) => {
        // Simulate 2500 actors in store and 8 possible combinations of user options and API responses.

        function* mockedResponsesGenerator() {
            for (const responseDataOverride of responseDataOverrides) {
                yield { data: { data: { ...exampleResponseData, ...responseDataOverride } } } as ApifyResponse;
            }
        }

        const mockedResponses = mockedResponsesGenerator();

        const storeClient = client.store();
        const mockedClient = jest.spyOn(storeClient.httpClient, 'call').mockImplementation(async () => {
            const next = mockedResponses.next();
            if (next.done) {
                // Return a default or dummy ApifyResponse here
                return { data: {} } as ApifyResponse<unknown>;
            }
            return next.value;
        });

        const pages = await client.store().list(options);

        const totalItems: any[] = [];
        for await (const page of pages) {
            totalItems.push(...page.items);
        }
        mockedClient.mockRestore();
        expect(totalItems.length).toBe(expectedItems);
    });
});
