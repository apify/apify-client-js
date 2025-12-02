const { ApifyClient } = require('apify-client');

const range = (start, end, step = 1) => {
    // Inclusive range, ordered based on start and end values
    return Array.from(
        {
            length: Math.abs(end - start) + 1,
        },
        (_, i) => start + Math.sign(end - start) * step * i,
    );
};

const commonPaginationOptions = [
    {
        testName: 'No offset, no limit',
        userDefinedOptions: {},
        expectedItems: range(0, 2499),
    },
    {
        testName: 'No offset, user limit',
        userDefinedOptions: { limit: 1100 },
        expectedItems: range(0, 1099),
    },
    {
        testName: 'User offset, no limit',
        userDefinedOptions: { offset: 1000 },
        expectedItems: range(1000, 2499),
    },
    {
        testName: 'User offset, user limit',
        userDefinedOptions: { offset: 1000, limit: 1100 },
        expectedItems: range(1000, 2099),
    },
    {
        testName: 'User out of range offset, no limit',
        userDefinedOptions: { offset: 3000 },
        expectedItems: [],
    },
    {
        testName: 'User no offset, out of range limit',
        userDefinedOptions: { limit: 3000 },
        expectedItems: range(0, 2499),
    },
    {
        testName: 'User no offset, out of range limit',
        userDefinedOptions: { limit: 3000 },
        expectedItems: range(0, 2499),
    },
];

const unnamedPaginationOptions =  [{
    testName: 'User offset, user limit, descending, unnamed included',
    userDefinedOptions: { offset: 50, limit: 1100, desc: true, unnamed: true },
    expectedItems: range(2550, 1451),},
];

const descPaginationOptions =  [{
    testName: 'User offset, user limit, descending',
        userDefinedOptions: { offset: 1000, limit: 1100, desc: true },
    expectedItems: range(1500, 401),},
];

function generateTestCases(resourceClients, testOptions){
    return resourceClients.flatMap(resourceClient =>
        testOptions.map(testOption => ({ resourceClient, clientName: resourceClient.constructor.name, ...testOption }))
    );
}

describe('Collection clients list method as async iterable', () => {
    const client = new ApifyClient();
    const maxItemsPerPage = 1000;

    const allCollectionClients = [
        client.store(),  // Does not support desc
        client.actors(),
        client.actor("some-id").version("some-version").envVars(),
        client.actor("some-id").versions(),
        client.actor("some-id").builds(),
        client.datasets(),  // Supports unnamed
        client.keyValueStores(),  // Supports unnamed
        client.requestQueues(),  // Supports unnamed
        client.schedules(),
        client.tasks(),
        client.webhooks(),
        client.webhookDispatches(),
    ]

    // Create valid tests cases for each client based on the pagination options it is supporting.
    const commonTestCases = generateTestCases(allCollectionClients, commonPaginationOptions);
    const unnamedTestCases = generateTestCases(
        [client.datasets(),client.keyValueStores(),client.requestQueues(),], unnamedPaginationOptions);
    const descTestCases = generateTestCases(allCollectionClients.slice(1), descPaginationOptions);


    test.each([...commonTestCases,...unnamedTestCases, ...descTestCases])('$clientName: $testName', async ({ resourceClient, userDefinedOptions, expectedItems }) => {
        const mockedPlatformLogic = async (request) => {
            // Simulated platform logic for pagination.
            // There are 2500 normal items in the collection and additional 100 extra items.
            // Items are simple number for easy verification 0..2499 -> normal, 2500..2599 -> extra

            const normalItems = 2500;
            const extraItems = 100; // additional items, for example unnamed

            const totalItems = request.params.unnamed ? normalItems + extraItems : normalItems;

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

        const mockedClient = jest.spyOn(client.httpClient, 'call').mockImplementation(mockedPlatformLogic);

        try {
            const totalItems = [];
            for await (const page of resourceClient.list(userDefinedOptions)) {
                totalItems.push(page);
            }
            expect(totalItems).toEqual(expectedItems);
            expect(mockedClient).toHaveBeenCalledTimes(Math.max(Math.ceil(expectedItems.length / maxItemsPerPage), 1));
        } finally {
            mockedClient.mockRestore();
        }
    });
});



describe('actor.dataset.listItems as async iterable', () => {
    const client = new ApifyClient();
    const maxItemsPerPage = 2500;

    const chunkSizePaginationOptions =  [{
        testName: 'User offset, user limit, descending',
        userDefinedOptions: { offset: 1000, limit: 1100, desc: true , chunkSize: 100},
        expectedItems: range(1500, 401),},
    ];

    const testCases = generateTestCases([client.dataset("some-id")],
        [...commonPaginationOptions, ...descPaginationOptions, ...chunkSizePaginationOptions])
    test.each(testCases)
        ('$testName', async ({ userDefinedOptions, expectedItems }) => {
        const mockedPlatformLogic = async (request) => {
            // Simulated platform logic for pagination.
            // There are 2500 items in the collection
            // Items are simple number for easy verification 0..2499
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
                headers : {
                    "x-apify-pagination-total": totalItems,
                    "x-apify-pagination-offset": offset,
                    "x-apify-pagination-count": returnedItemsCount,
                    "x-apify-pagination-limit": returnedItemsCount,
                    "x-apify-pagination-desc": desc,
                }
            };
        };

        const datasetClient = client.dataset('some-id');

        const mockedClient = jest.spyOn(
            datasetClient.httpClient, 'call').mockImplementation(mockedPlatformLogic);

        try {
            const totalItems = [];
            for await (const page of datasetClient.listItems(userDefinedOptions)) {
                totalItems.push(page);
            }
            expect(totalItems).toEqual(expectedItems);
            expect(mockedClient).toHaveBeenCalledTimes(
                Math.max(Math.ceil(expectedItems.length / (userDefinedOptions.chunkSize || maxItemsPerPage)), 1));
        } finally {
            mockedClient.mockRestore();
        }
    });
});

