import { ApifyClient } from 'apify-client';
import { describe, expect, test, vi } from 'vitest';
import { HttpClient } from '../src/http_client';

const range = (start: number, end: number, step: number = 1) => {
    // Inclusive range, ordered based on start and end values
    return Array.from(
        {
            length: Math.abs(end - start),
        },
        (_, i) => {
            const number = start + Math.sign(end - start) * step * i;
            return { id: number.toString(), key: number.toString() };
        },
    );
};

const noOptions = [
    {
        testName: 'No options',
        userDefinedOptions: {},
        expectedItems: range(0, 2500),
    },
];

const limitPaginationOptions = [
    {
        testName: 'User limit',
        userDefinedOptions: { limit: 1100 },
        expectedItems: range(0, 1100),
    },
    {
        testName: 'Out of range limit',
        userDefinedOptions: { limit: 3000 },
        expectedItems: range(0, 2500),
    },
];

const offsetPaginationOptions = [
    {
        testName: 'User offset',
        userDefinedOptions: { offset: 1000 },
        expectedItems: range(1000, 2500),
    },
    {
        testName: 'User offset, user limit',
        userDefinedOptions: { offset: 1000, limit: 1100 },
        expectedItems: range(1000, 2100),
    },
    {
        testName: 'User out of range offset',
        userDefinedOptions: { offset: 3000 },
        expectedItems: [],
    },
];

const descPaginationOptions = [
    {
        testName: 'User offset, user limit, descending',
        userDefinedOptions: { offset: 1000, limit: 1100, desc: true },
        expectedItems: range(1500, 400),
    },
];

function generateTestCases(resourceClients, testOptions) {
    return resourceClients.flatMap((resourceClient) =>
        testOptions.map((testOption) => ({
            resourceClient,
            clientName: resourceClient.constructor.name,
            ...testOption,
        })),
    );
}

describe('Collection clients list method as async iterable', () => {
    const client = new ApifyClient();
    const maxItemsPerPage = 1000;

    const allCollectionClients = [
        client.actor('some-id').version('some-version').envVars(), // Does not support options
        client.actor('some-id').versions(), // Does not support options
        client.store(), // Does not support desc
        client.actor('some-id').builds(),
        client.actor('some-id').runs(),
        client.actors(),
        client.datasets(), // Supports unnamed
        client.keyValueStores(), // Supports unnamed
        client.requestQueues(), // Supports unnamed
        client.schedules(),
        client.tasks(),
        client.webhooks(),
        client.webhookDispatches(),
    ];

    const unnamedPaginationOptions = [
        {
            testName: 'User offset, user limit, descending, unnamed included',
            userDefinedOptions: { offset: 50, limit: 1100, desc: true, unnamed: true },
            expectedItems: range(2550, 1450),
        },
    ];

    // Create valid tests cases for each client based on the pagination options it is supporting.
    const noOptionsTestCases = generateTestCases(allCollectionClients, noOptions);

    const commonTestCases = generateTestCases(
        allCollectionClients.slice(2), // without envVars and versions
        [...limitPaginationOptions, ...offsetPaginationOptions],
    );
    const unnamedTestCases = generateTestCases(
        [client.datasets(), client.keyValueStores(), client.requestQueues()],
        unnamedPaginationOptions,
    );
    const descTestCases = generateTestCases(
        allCollectionClients.slice(3), // without envVars, versions and store
        descPaginationOptions,
    );

    test.each([...noOptionsTestCases, ...commonTestCases, ...unnamedTestCases, ...descTestCases])(
        '$clientName: $testName',
        async ({ resourceClient, userDefinedOptions, expectedItems }) => {
            const mockedPlatformLogic: HttpClient['call'] = async (request) => {
                // Simulated platform logic for pagination.
                // There are 2500 normal items in the collection and additional 100 extra items.
                // Items are simple objects with incrementing attributes for easy verification.

                const normalItems = 2500;
                const extraItems = 100; // additional items, for example unnamed

                const totalItems = request.params.unnamed ? normalItems + extraItems : normalItems;

                const offset = request.params.offset ?? 0;
                const limit = request.params.limit ?? 0;
                const desc = request.params.desc ?? false;

                const items = desc ? range(totalItems, 0) : range(0, totalItems);

                if (offset < 0 || limit < 0) {
                    throw new Error('Offset and limit must be non-negative');
                }

                const lowerIndex = Math.min(offset, totalItems);
                const upperIndex = Math.min(offset + (limit || totalItems), totalItems);
                const returnedItemsCount = Math.min(upperIndex - lowerIndex, maxItemsPerPage);

                return {
                    data: {
                        data: {
                            total: totalItems,
                            count: returnedItemsCount,
                            offset,
                            limit: returnedItemsCount,
                            desc: false,
                            items: items.slice(lowerIndex, Math.min(upperIndex, lowerIndex + maxItemsPerPage)),
                        },
                    },
                };
            };

            const mockedClient = vi.spyOn(client.httpClient, 'call').mockImplementation(mockedPlatformLogic);

            try {
                const items = [];
                for await (const page of resourceClient.list(userDefinedOptions)) {
                    items.push(page);
                }
                expect(items).toEqual(expectedItems);
                expect(mockedClient).toHaveBeenCalledTimes(
                    Math.max(Math.ceil(expectedItems.length / maxItemsPerPage), 1),
                );
            } finally {
                mockedClient.mockRestore();
            }
        },
    );
});

describe('DatasetClient.listItems as async iterable', () => {
    const client = new ApifyClient();
    const maxItemsPerPage = 2500;

    const chunkSizePaginationOptions = [
        {
            testName: 'User offset, user limit, descending, user chunkSize',
            userDefinedOptions: { offset: 1000, limit: 1100, desc: true, chunkSize: 100 },
            expectedItems: range(1500, 400),
        },
    ];

    const testCases = generateTestCases(
        [client.dataset('some-id')],
        [
            ...limitPaginationOptions,
            ...offsetPaginationOptions,
            ...descPaginationOptions,
            ...chunkSizePaginationOptions,
        ],
    );
    test.each(testCases)('$testName', async ({ resourceClient, userDefinedOptions, expectedItems }) => {
        const mockedPlatformLogic = async (request) => {
            // Simulated platform logic for pagination.
            // There are 2500 items in the collection.
            // Items are simple objects with incrementing attributes for easy verification.
            const totalItems = 2500;

            const offset = request.params.offset ? request.params.offset : 0;
            const limit = request.params.limit ? request.params.limit : 0;
            const desc = request.params.desc ? request.params.desc : false;

            const items = range(desc ? totalItems : 0, desc ? 0 : totalItems);

            if (offset < 0 || limit < 0) {
                throw new Error('Offset and limit must be non-negative');
            }

            const lowerIndex = Math.min(offset, totalItems);
            const upperIndex = Math.min(offset + (limit || totalItems), totalItems);
            const returnedItemsCount = Math.min(upperIndex - lowerIndex, maxItemsPerPage);

            return {
                data: items.slice(lowerIndex, Math.min(upperIndex, lowerIndex + maxItemsPerPage)),
                // Only mock pagination related headers
                headers: {
                    'x-apify-pagination-total': totalItems,
                    'x-apify-pagination-offset': offset,
                    'x-apify-pagination-count': returnedItemsCount,
                    'x-apify-pagination-limit': returnedItemsCount,
                    'x-apify-pagination-desc': desc,
                },
            };
        };

        const mockedClient = vi.spyOn(client.httpClient, 'call').mockImplementation(mockedPlatformLogic);

        try {
            const items = [];
            for await (const page of resourceClient.listItems(userDefinedOptions)) {
                items.push(page);
            }
            expect(items).toEqual(expectedItems);
            expect(mockedClient).toHaveBeenCalledTimes(
                Math.max(Math.ceil(expectedItems.length / (userDefinedOptions.chunkSize || maxItemsPerPage)), 1),
            );
        } finally {
            mockedClient.mockRestore();
        }
    });
});

describe('KeyValueStoreClient.listKeys as async iterable', () => {
    const client = new ApifyClient();
    const maxItemsPerPage = 1000;

    const exclusiveStartKeyPaginationOptions = [
        {
            testName: 'exclusiveStartKey',
            userDefinedOptions: { exclusiveStartKey: '1000' },
            expectedItems: range(1001, 2500),
        },
    ];

    const testCases = generateTestCases(
        [client.keyValueStore('some-id')],
        [...limitPaginationOptions, ...exclusiveStartKeyPaginationOptions],
    );
    test.each(testCases)('$testName', async ({ resourceClient, userDefinedOptions, expectedItems }) => {
        const mockedPlatformLogic = async (request) => {
            // Simulated platform logic for pagination.
            // There are 2500 items in the collection.
            // Items are simple objects with incrementing attributes for easy verification.
            const totalItems = 2500;

            const exclusiveStartKey = request.params.exclusiveStartKey ? request.params.exclusiveStartKey : null;
            const limit = request.params.limit ? request.params.limit : 0;

            if (limit < 0) {
                throw new Error('Limit must be non-negative');
            }

            const lowerIndex = Math.min(
                request.params.exclusiveStartKey ? Number(request.params.exclusiveStartKey) + 1 : 0,
                totalItems,
            );
            const upperIndex = Math.min(lowerIndex + (limit || totalItems), totalItems, lowerIndex + maxItemsPerPage);
            const items = range(lowerIndex, upperIndex);

            return {
                data: {
                    data: {
                        items,
                        count: items.length,
                        limit: limit || maxItemsPerPage,
                        exclusiveStartKey,
                        isTruncated: false,
                        nextExclusiveStartKey: upperIndex < totalItems ? upperIndex - 1 : null,
                    },
                },
            };
        };

        const mockedClient = vi.spyOn(client.httpClient, 'call').mockImplementation(mockedPlatformLogic);

        try {
            const items = [];
            for await (const page of resourceClient.listKeys(userDefinedOptions)) {
                items.push(page);
            }
            expect(items).toEqual(expectedItems);
            expect(mockedClient).toHaveBeenCalledTimes(
                Math.max(Math.ceil(expectedItems.length / (userDefinedOptions.chunkSize || maxItemsPerPage)), 1),
            );
        } finally {
            mockedClient.mockRestore();
        }
    });
});

describe('RequestQueueClient.listKeys as async iterable', () => {
    const client = new ApifyClient();
    const maxItemsPerPage = 10000;

    const exclusiveStartIdPaginationOptions = [
        {
            testName: 'exclusiveStartId',
            userDefinedOptions: { exclusiveStartId: '1000' },
            expectedItems: range(1001, 2500),
        },
    ];

    const testCases = generateTestCases(
        [client.requestQueue('some-id')],
        [...limitPaginationOptions, ...exclusiveStartIdPaginationOptions],
    );
    test.each(testCases)('$testName', async ({ resourceClient, userDefinedOptions, expectedItems }) => {
        const totalItems = 2500;
        const mockedPlatformLogic = async (request) => {
            // Simulated platform logic for pagination.
            // There are 2500 items in the collection.
            // Items are simple objects with incrementing attributes for easy verification.

            const exclusiveStartId = request.params.exclusiveStartId ? request.params.exclusiveStartId : null;
            const limit = request.params.limit ? request.params.limit : 0;

            if (limit < 0) {
                throw new Error('Limit must be non-negative');
            }

            const lowerIndex = Math.min(
                request.params.exclusiveStartId ? Number(request.params.exclusiveStartId) + 1 : 0,
                totalItems,
            );
            const upperIndex = Math.min(lowerIndex + (limit || totalItems), totalItems, lowerIndex + maxItemsPerPage);
            const items = range(lowerIndex, upperIndex);

            return {
                data: {
                    data: {
                        items,
                        count: items.length,
                        limit: limit || maxItemsPerPage,
                        exclusiveStartId,
                    },
                },
            };
        };

        const mockedClient = vi.spyOn(client.httpClient, 'call').mockImplementation(mockedPlatformLogic);

        try {
            const items = [];
            for await (const page of resourceClient.listRequests(userDefinedOptions)) {
                items.push(page);
            }

            let expectedAPIcalls = Math.max(Math.ceil(expectedItems.length / maxItemsPerPage), 1);
            if (userDefinedOptions.limit === undefined || userDefinedOptions.limit > totalItems) {
                // One extra call to confirm there are no more items due RQ API design.
                expectedAPIcalls += 1;
            }

            expect(items).toEqual(expectedItems);
            expect(mockedClient).toHaveBeenCalledTimes(expectedAPIcalls);
        } finally {
            mockedClient.mockRestore();
        }
    });
});
