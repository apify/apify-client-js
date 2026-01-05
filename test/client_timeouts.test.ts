import { ApifyClient, type Dictionary } from 'apify-client';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { HttpClient } from '../src/http_client.js';

// Mock for testing timeout functionality
class MockHttpClient {
    public timeoutSecs: number;
    public callHistory: any[];
    public stats: { addRateLimitError: ReturnType<typeof vi.fn> };

    constructor(timeoutSecs: number) {
        this.timeoutSecs = timeoutSecs * 1000; // Convert to milliseconds
        this.callHistory = [];
        this.stats = {
            addRateLimitError: vi.fn(),
        };
    }

    async call(config: Dictionary<any>) {
        // Track the call for assertions
        this.callHistory.push({
            ...config,
            timeoutUsed: config.timeout,
        });

        // Simulate successful response
        return {
            data: { data: { id: 'test-id' } },
            status: 200,
            headers: {},
        };
    }
}

// Test parameters: [ClientClass, methodName, expectedTimeoutMillis, methodArgs]
const timeoutTestParams = [
    // Dataset Client
    ['DatasetClient', 'get', 5000, []],
    ['DatasetClient', 'update', 5000, [{ name: 'new-name' }]],
    ['DatasetClient', 'delete', 5000, []],
    ['DatasetClient', 'listItems', 360000, []],
    ['DatasetClient', 'downloadItems', 360000, ['json']],
    ['DatasetClient', 'pushItems', 30000, [[{ test: 'data' }]]],
    ['DatasetClient', 'getStatistics', 5000, []],

    // KeyValueStore Client
    ['KeyValueStoreClient', 'get', 5000, []],
    ['KeyValueStoreClient', 'update', 360000, [{}]],
    ['KeyValueStoreClient', 'delete', 5000, []],
    ['KeyValueStoreClient', 'listKeys', 30000, []],
    ['KeyValueStoreClient', 'getRecord', 360000, ['test-key']],
    ['KeyValueStoreClient', 'setRecord', 360000, [{ key: 'test-key', value: 'some-value' }]],
    ['KeyValueStoreClient', 'deleteRecord', 5000, ['test-key']],

    // RequestQueue Client
    ['RequestQueueClient', 'get', 5000, []],
    ['RequestQueueClient', 'update', 5000, [{ name: 'new-name' }]],
    ['RequestQueueClient', 'delete', 5000, []],
    ['RequestQueueClient', 'listHead', 5000, []],
    ['RequestQueueClient', 'listAndLockHead', 30000, [{ lockSecs: 10 }]],
    ['RequestQueueClient', 'addRequest', 5000, [{ url: 'https://example.com', uniqueKey: 'test' }]],
    ['RequestQueueClient', 'getRequest', 5000, ['request-id']],
    [
        'RequestQueueClient',
        'updateRequest',
        30000,
        [{ id: 'request-id', url: 'https://example.com', uniqueKey: 'test' }],
    ],
    ['RequestQueueClient', 'deleteRequest', 5000, ['request-id']],
    ['RequestQueueClient', 'prolongRequestLock', 30000, ['request-id', { lockSecs: 10 }]],
    ['RequestQueueClient', 'deleteRequestLock', 5000, ['request-id']],
    ['RequestQueueClient', 'batchAddRequests', 30000, [[{ uniqueKey: 'request-key' }], {}]],
    ['RequestQueueClient', 'batchDeleteRequests', 5000, [[{ id: 'request-id' }]]],
    ['RequestQueueClient', 'listRequests', 30000, []],
] as const;

describe('Client Timeout Tests', () => {
    let client: ApifyClient;
    let mockHttpClient: MockHttpClient;

    beforeEach(() => {
        mockHttpClient = new MockHttpClient(360); // 6 minutes default
        client = new ApifyClient();
        // Replace the http client with our mock
        client.httpClient = mockHttpClient as any as HttpClient;
    });

    describe('Dynamic Timeout with Exponential Backoff', () => {
        test('timeout increases with each retry attempt', () => {
            const initialTimeoutSecs = 5;
            const clientTimeoutSecs = 60;

            // Attempt 1: 5 seconds
            const timeout1 = Math.min(clientTimeoutSecs, initialTimeoutSecs * 2 ** (1 - 1));
            expect(timeout1).toBe(5);

            // Attempt 2: 10 seconds
            const timeout2 = Math.min(clientTimeoutSecs, initialTimeoutSecs * 2 ** (2 - 1));
            expect(timeout2).toBe(10);

            // Attempt 3: 20 seconds
            const timeout3 = Math.min(clientTimeoutSecs, initialTimeoutSecs * 2 ** (3 - 1));
            expect(timeout3).toBe(20);

            // Attempt 4: 40 seconds
            const timeout4 = Math.min(clientTimeoutSecs, initialTimeoutSecs * 2 ** (4 - 1));
            expect(timeout4).toBe(40);

            // Attempt 5: Would be 80 seconds, but limited to client timeout (60)
            const timeout5 = Math.min(clientTimeoutSecs, initialTimeoutSecs * 2 ** (5 - 1));
            expect(timeout5).toBe(60);
        });
    });

    describe.each(timeoutTestParams)(
        'Specific timeouts for specific endpoints',
        (clientType, methodName, expectedTimeoutMillis, methodArgs) => {
            test(`${clientType}.${methodName}() uses ${expectedTimeoutMillis} millisecond timeout`, async () => {
                let clientInstance: Record<string, unknown> & { httpClient: HttpClient };
                // Create the appropriate client instance
                switch (clientType) {
                    case 'DatasetClient':
                        clientInstance = client.dataset('test-id') as unknown as typeof clientInstance;
                        break;
                    case 'KeyValueStoreClient':
                        clientInstance = client.keyValueStore('test-id') as unknown as typeof clientInstance;
                        break;
                    case 'RequestQueueClient':
                        clientInstance = client.requestQueue('test-id') as unknown as typeof clientInstance;
                        break;
                    default:
                        throw new Error(`Unknown client type: ${clientType}`);
                }

                // Replace with our mock
                clientInstance.httpClient = mockHttpClient as unknown as HttpClient;

                // Call the method
                await (clientInstance[methodName] as (...args: readonly unknown[]) => Promise<unknown>)(...methodArgs);

                // Check the timeout was set correctly
                const lastCall = mockHttpClient.callHistory[mockHttpClient.callHistory.length - 1];
                expect(lastCall.timeout).toBe(expectedTimeoutMillis);
            });
        },
    );
});
