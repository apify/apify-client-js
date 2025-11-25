import type { StoreCollectionListOptions } from 'apify-client';
import { ApifyClient } from 'apify-client';

import type { ApifyRequestConfig, ApifyResponse } from '../src/http_client';
import { PaginationOptions } from '../src/utils';
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

    const testCases = [
        {
            testName: 'User offset, no limit',
            userDefinedOptions: { offset: 1000 },
            expectedItems: 1500,
        },
        {
            testName: 'No offset, no limit',
            userDefinedOptions: {},
            expectedItems: 2500,
        },
        {
            testName: 'No offset, user limit',
            userDefinedOptions: { limit: 1100 },
            expectedItems: 1100,
        },
        {
            testName: 'User offset, user limit',
            userDefinedOptions: { offset: 1000, limit: 1100 },
            expectedItems: 1100,
        },
        {
            testName: 'User out of range offset, no limit',
            userDefinedOptions: { offset: 3000 },
            expectedItems: 0,
        },
        {
            testName: 'User no offset, out of range limit',
            userDefinedOptions: { limit: 3000 },
            expectedItems: 2500,
        },
    ];

    test.each(testCases)('$testName', async ({ userDefinedOptions, expectedItems }) => {
        const mockedPlatformLogic = async (request: ApifyRequestConfig) => {
            // Simulated platform logic for pagination when there are 2500 actors in store.
            const maxItems = 2500;
            const maxItemsPerPage = 1000;
            const offset = request.params.offset ? request.params.offset : 0;
            const limit = request.params.limit ? request.params.limit : 0;
            if (offset < 0 || limit < 0) {
                throw new Error('Offset and limit must be non-negative');
            }

            const lowerIndex = Math.min(offset, maxItems);
            const upperIndex = Math.min(offset + (limit || maxItems), maxItems);
            const returnedItemsCount = Math.min(upperIndex - lowerIndex, maxItemsPerPage);

            return {
                data: {
                    data: {
                        total: maxItems,
                        count: returnedItemsCount,
                        offset,
                        limit: returnedItemsCount,
                        desc: false,
                        items: new Array(returnedItemsCount).fill('some actor details'),
                    },
                },
            } as ApifyResponse;
        };

        const storeClient = client.store();
        const mockedClient = jest.spyOn(storeClient.httpClient, 'call').mockImplementation(mockedPlatformLogic);

        const totalItems: any[] = [];
        for await (const page of client.store().list(userDefinedOptions)) {
            totalItems.push(page);
        }
        mockedClient.mockRestore();
        expect(totalItems.length).toBe(expectedItems);
    });
});
