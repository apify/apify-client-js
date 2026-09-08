import type { Timeout, TimeoutTier } from 'apify-client';
import { ApifyClient, ArgumentValidationError } from 'apify-client';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { ApifyRequestConfig, HttpClient } from '../src/http_client.js';

import type * as utils from '../src/utils.js';

// These tests drive the client with synthetic response bodies, so the schema check the resource clients run on
// every response is skipped: the bodies are shaped for the mechanics under test, not for the API's schemas.
vi.mock('../src/utils', async (importOriginal) => {
    const actual = await importOriginal<typeof utils>();
    return {
        ...actual,
        parseResponse: (response: { data: unknown }, _schema: unknown, shouldParseField = null) =>
            actual.parseDateFields(actual.pluckData(response.data as never), shouldParseField),
    };
});

// A terminal `status` keeps `call()` and `waitForFinish()` from polling forever.
const DEFAULT_RESPONSE_DATA = { id: 'test-id', status: 'SUCCEEDED' };

/**
 * Stands in for `HttpClient`: records every request config and answers with a canned body, so the tests can
 * read the `timeout` each method asks for without a server.
 */
class MockHttpClient {
    public timeoutMillis: Record<TimeoutTier, number>;
    public callHistory: ApifyRequestConfig[] = [];
    public stats = { addRateLimitError: vi.fn() };
    public responseData: unknown = DEFAULT_RESPONSE_DATA;

    constructor(httpClient: HttpClient) {
        this.timeoutMillis = httpClient.timeoutMillis;
    }

    async call(config: ApifyRequestConfig) {
        this.callHistory.push(config);

        return {
            data: { data: this.responseData },
            status: 200,
            headers: {},
        };
    }

    get lastCall() {
        return this.callHistory[this.callHistory.length - 1];
    }
}

type ClientFactory = (client: ApifyClient) => object;

const CLIENTS: Record<string, ClientFactory> = {
    ActorClient: (client) => client.actor('test-id'),
    ActorCollectionClient: (client) => client.actors(),
    ActorEnvVarClient: (client) => client.actor('test-id').version('0.0').envVar('VAR'),
    ActorEnvVarCollectionClient: (client) => client.actor('test-id').version('0.0').envVars(),
    ActorVersionClient: (client) => client.actor('test-id').version('0.0'),
    ActorVersionCollectionClient: (client) => client.actor('test-id').versions(),
    BuildClient: (client) => client.build('test-id'),
    BuildCollectionClient: (client) => client.builds(),
    DatasetClient: (client) => client.dataset('test-id'),
    DatasetCollectionClient: (client) => client.datasets(),
    KeyValueStoreClient: (client) => client.keyValueStore('test-id'),
    KeyValueStoreCollectionClient: (client) => client.keyValueStores(),
    LogClient: (client) => client.log('test-id'),
    RequestQueueClient: (client) => client.requestQueue('test-id'),
    RequestQueueCollectionClient: (client) => client.requestQueues(),
    RunClient: (client) => client.run('test-id'),
    RunCollectionClient: (client) => client.runs(),
    ScheduleClient: (client) => client.schedule('test-id'),
    ScheduleCollectionClient: (client) => client.schedules(),
    StoreCollectionClient: (client) => client.store(),
    TaskClient: (client) => client.task('test-id'),
    TaskCollectionClient: (client) => client.tasks(),
    UserClient: (client) => client.user('test-id'),
    WebhookClient: (client) => client.webhook('test-id'),
    WebhookCollectionClient: (client) => client.webhooks(),
    WebhookDispatchClient: (client) => client.webhookDispatch('test-id'),
    WebhookDispatchCollectionClient: (client) => client.webhookDispatches(),
};

interface TimeoutCase {
    client: keyof typeof CLIENTS;
    method: string;
    /** The tier the method is assigned, and so the `timeout` it asks the HTTP client for. */
    tier: Timeout;
    /** Arguments of the call ahead of its options object. */
    args?: unknown[];
    /** The options object the call needs, when the defaults do not do; a `timeout` override is merged into it. */
    options?: object;
    /** A response body the method needs to complete, when the default one does not fit its shape. */
    responseData?: unknown;
}

// One entry per method that sends a request, with the default tier each is assigned. The tiers mirror the
// Python client, which is what makes the two clients interchangeable in this respect.
const TIMEOUT_CASES: TimeoutCase[] = [
    { client: 'ActorClient', method: 'get', tier: 'short' },
    { client: 'ActorClient', method: 'update', tier: 'short', args: [{ name: 'x' }] },
    { client: 'ActorClient', method: 'delete', tier: 'short' },
    { client: 'ActorClient', method: 'start', tier: 'medium', args: [undefined] },
    { client: 'ActorClient', method: 'call', tier: 'noTimeout', args: [undefined], options: { log: null } },
    { client: 'ActorClient', method: 'build', tier: 'medium', args: ['0.0'] },
    { client: 'ActorClient', method: 'defaultBuild', tier: 'short' },
    { client: 'ActorClient', method: 'validateInput', tier: 'short', args: [{}] },
    { client: 'ActorCollectionClient', method: 'list', tier: 'medium' },
    { client: 'ActorCollectionClient', method: 'create', tier: 'medium', args: [{ name: 'x' }] },
    { client: 'ActorEnvVarClient', method: 'get', tier: 'short' },
    { client: 'ActorEnvVarClient', method: 'update', tier: 'short', args: [{ name: 'VAR', value: 'x' }] },
    { client: 'ActorEnvVarClient', method: 'delete', tier: 'short' },
    { client: 'ActorEnvVarCollectionClient', method: 'list', tier: 'short' },
    { client: 'ActorEnvVarCollectionClient', method: 'create', tier: 'short', args: [{ name: 'VAR', value: 'x' }] },
    { client: 'ActorVersionClient', method: 'get', tier: 'short' },
    { client: 'ActorVersionClient', method: 'update', tier: 'short', args: [{ versionNumber: '0.0' }] },
    { client: 'ActorVersionClient', method: 'delete', tier: 'short' },
    { client: 'ActorVersionCollectionClient', method: 'list', tier: 'short' },
    { client: 'ActorVersionCollectionClient', method: 'create', tier: 'short', args: [{ versionNumber: '0.0' }] },
    { client: 'BuildClient', method: 'get', tier: 'short' },
    { client: 'BuildClient', method: 'abort', tier: 'short' },
    { client: 'BuildClient', method: 'delete', tier: 'short' },
    { client: 'BuildClient', method: 'getOpenApiDefinition', tier: 'medium' },
    { client: 'BuildClient', method: 'waitForFinish', tier: 'noTimeout' },
    { client: 'BuildCollectionClient', method: 'list', tier: 'medium' },
    { client: 'DatasetClient', method: 'get', tier: 'short' },
    { client: 'DatasetClient', method: 'update', tier: 'short', args: [{ name: 'x' }] },
    { client: 'DatasetClient', method: 'delete', tier: 'short' },
    { client: 'DatasetClient', method: 'listItems', tier: 'long' },
    { client: 'DatasetClient', method: 'downloadItems', tier: 'long', args: ['json'] },
    { client: 'DatasetClient', method: 'pushItems', tier: 'medium', args: [[{ test: 'data' }]] },
    { client: 'DatasetClient', method: 'getStatistics', tier: 'short' },
    { client: 'DatasetClient', method: 'createItemsPublicUrl', tier: 'long' },
    { client: 'DatasetCollectionClient', method: 'list', tier: 'medium' },
    { client: 'DatasetCollectionClient', method: 'getOrCreate', tier: 'short', args: ['name'] },
    { client: 'KeyValueStoreClient', method: 'get', tier: 'short' },
    { client: 'KeyValueStoreClient', method: 'update', tier: 'long', args: [{ name: 'x' }] },
    { client: 'KeyValueStoreClient', method: 'delete', tier: 'short' },
    { client: 'KeyValueStoreClient', method: 'listKeys', tier: 'medium' },
    { client: 'KeyValueStoreClient', method: 'getRecordPublicUrl', tier: 'long', args: ['key'] },
    { client: 'KeyValueStoreClient', method: 'createKeysPublicUrl', tier: 'long' },
    { client: 'KeyValueStoreClient', method: 'recordExists', tier: 'long', args: ['key'] },
    { client: 'KeyValueStoreClient', method: 'getRecord', tier: 'long', args: ['key'] },
    { client: 'KeyValueStoreClient', method: 'setRecord', tier: 'long', args: [{ key: 'key', value: 'value' }] },
    { client: 'KeyValueStoreClient', method: 'deleteRecord', tier: 'short', args: ['key'] },
    { client: 'KeyValueStoreCollectionClient', method: 'list', tier: 'medium' },
    { client: 'KeyValueStoreCollectionClient', method: 'getOrCreate', tier: 'short', args: ['name'] },
    { client: 'LogClient', method: 'get', tier: 'long' },
    { client: 'LogClient', method: 'stream', tier: 'long' },
    { client: 'RequestQueueClient', method: 'get', tier: 'short' },
    { client: 'RequestQueueClient', method: 'update', tier: 'short', args: [{ name: 'x' }] },
    { client: 'RequestQueueClient', method: 'delete', tier: 'short' },
    { client: 'RequestQueueClient', method: 'listHead', tier: 'short' },
    { client: 'RequestQueueClient', method: 'listAndLockHead', tier: 'medium', options: { lockSecs: 10 } },
    { client: 'RequestQueueClient', method: 'addRequest', tier: 'short', args: [{ url: 'http://x', uniqueKey: 'x' }] },
    {
        client: 'RequestQueueClient',
        method: 'batchAddRequests',
        tier: 'medium',
        args: [[{ url: 'http://x', uniqueKey: 'x' }]],
        responseData: { processedRequests: [{ uniqueKey: 'x' }], unprocessedRequests: [] },
    },
    { client: 'RequestQueueClient', method: 'batchDeleteRequests', tier: 'short', args: [[{ id: 'x' }]] },
    { client: 'RequestQueueClient', method: 'getRequest', tier: 'short', args: ['x'] },
    { client: 'RequestQueueClient', method: 'updateRequest', tier: 'medium', args: [{ id: 'x', url: 'http://x' }] },
    { client: 'RequestQueueClient', method: 'deleteRequest', tier: 'short', args: ['x'] },
    {
        client: 'RequestQueueClient',
        method: 'prolongRequestLock',
        tier: 'medium',
        args: ['x'],
        options: { lockSecs: 10 },
    },
    { client: 'RequestQueueClient', method: 'deleteRequestLock', tier: 'short', args: ['x'] },
    { client: 'RequestQueueClient', method: 'listRequests', tier: 'medium' },
    { client: 'RequestQueueClient', method: 'unlockRequests', tier: 'long' },
    { client: 'RequestQueueCollectionClient', method: 'list', tier: 'medium' },
    { client: 'RequestQueueCollectionClient', method: 'getOrCreate', tier: 'short', args: ['name'] },
    { client: 'RunClient', method: 'get', tier: 'short' },
    { client: 'RunClient', method: 'abort', tier: 'medium' },
    { client: 'RunClient', method: 'delete', tier: 'short' },
    { client: 'RunClient', method: 'metamorph', tier: 'medium', args: ['target', {}] },
    { client: 'RunClient', method: 'reboot', tier: 'medium' },
    { client: 'RunClient', method: 'update', tier: 'short', args: [{ statusMessage: 'x' }] },
    { client: 'RunClient', method: 'resurrect', tier: 'medium' },
    { client: 'RunClient', method: 'charge', tier: 'short', options: { eventName: 'x' } },
    { client: 'RunClient', method: 'waitForFinish', tier: 'noTimeout' },
    {
        client: 'RunClient',
        method: 'getStreamedLog',
        tier: 'long',
        // The method reads the run to find its Actor, and that lookup is what the tier times.
        responseData: { ...DEFAULT_RESPONSE_DATA, actId: 'actor-id' },
    },
    { client: 'RunCollectionClient', method: 'list', tier: 'medium' },
    { client: 'ScheduleClient', method: 'get', tier: 'short' },
    { client: 'ScheduleClient', method: 'update', tier: 'short', args: [{ name: 'x' }] },
    { client: 'ScheduleClient', method: 'delete', tier: 'short' },
    { client: 'ScheduleClient', method: 'getLog', tier: 'medium' },
    { client: 'ScheduleCollectionClient', method: 'list', tier: 'medium' },
    { client: 'ScheduleCollectionClient', method: 'create', tier: 'short', args: [{ name: 'x' }] },
    { client: 'StoreCollectionClient', method: 'list', tier: 'medium' },
    { client: 'TaskClient', method: 'get', tier: 'short' },
    { client: 'TaskClient', method: 'update', tier: 'short', args: [{ name: 'x' }] },
    { client: 'TaskClient', method: 'publish', tier: 'short' },
    { client: 'TaskClient', method: 'unpublish', tier: 'short' },
    { client: 'TaskClient', method: 'delete', tier: 'short' },
    { client: 'TaskClient', method: 'start', tier: 'medium', args: [undefined] },
    { client: 'TaskClient', method: 'call', tier: 'noTimeout', args: [undefined] },
    { client: 'TaskClient', method: 'getInput', tier: 'short' },
    { client: 'TaskClient', method: 'updateInput', tier: 'short', args: [{ x: 1 }] },
    { client: 'TaskCollectionClient', method: 'list', tier: 'medium' },
    { client: 'TaskCollectionClient', method: 'create', tier: 'medium', args: [{ actId: 'x', name: 'x' }] },
    { client: 'UserClient', method: 'get', tier: 'short' },
    { client: 'UserClient', method: 'monthlyUsage', tier: 'short' },
    { client: 'UserClient', method: 'limits', tier: 'short' },
    { client: 'UserClient', method: 'updateLimits', tier: 'short', args: [{ maxMonthlyUsageUsd: 1 }] },
    { client: 'WebhookClient', method: 'get', tier: 'short' },
    { client: 'WebhookClient', method: 'update', tier: 'short', args: [{ requestUrl: 'http://x' }] },
    { client: 'WebhookClient', method: 'delete', tier: 'short' },
    { client: 'WebhookClient', method: 'test', tier: 'medium' },
    { client: 'WebhookCollectionClient', method: 'list', tier: 'medium' },
    { client: 'WebhookCollectionClient', method: 'create', tier: 'short', args: [{ requestUrl: 'http://x' }] },
    { client: 'WebhookDispatchClient', method: 'get', tier: 'short' },
    { client: 'WebhookDispatchCollectionClient', method: 'list', tier: 'medium' },
];

describe('Client timeouts', () => {
    let client: ApifyClient;
    let mockHttpClient: MockHttpClient;

    /** Builds the resource client under test on top of the recording HTTP client. */
    const resourceClient = (name: keyof typeof CLIENTS) => {
        const instance = CLIENTS[name](client) as Record<string, unknown>;
        instance.httpClient = mockHttpClient;
        return instance as Record<string, (...args: unknown[]) => Promise<unknown>>;
    };

    beforeEach(() => {
        client = new ApifyClient();
        mockHttpClient = new MockHttpClient(client.httpClient);
        client.httpClient = mockHttpClient as unknown as HttpClient;
    });

    describe.each(TIMEOUT_CASES)(
        '$client $method()',
        ({ client: clientName, method, tier, args = [], options, responseData }) => {
            beforeEach(() => {
                if (responseData) mockHttpClient.responseData = responseData;
            });

            test(`asks for the ${String(tier)} tier by default`, async () => {
                await resourceClient(clientName)[method](...args, ...(options ? [options] : []));

                expect(mockHttpClient.lastCall.timeout).toBe(tier);
            });

            test('sends an explicit per-call timeout instead', async () => {
                await resourceClient(clientName)[method](...args, { ...options, timeout: 42 });

                expect(mockHttpClient.lastCall.timeout).toBe(42);
            });
        },
    );

    test('the timeout never reaches the query string', async () => {
        await resourceClient('DatasetClient').listItems({ limit: 5, timeout: 'short' });
        expect(mockHttpClient.lastCall.params).toEqual({ limit: 5 });

        await resourceClient('RunCollectionClient').list({ desc: true, timeout: 'short' });
        expect(mockHttpClient.lastCall.params).toEqual({ desc: true });

        await resourceClient('DatasetCollectionClient').getOrCreate('name', { schema: { a: 1 }, timeout: 'long' });
        expect(mockHttpClient.lastCall.data).toEqual({ schema: { a: 1 } });
        expect(mockHttpClient.lastCall.params).toEqual({ name: 'name' });
    });

    test('call() passes its timeout to the start request and to every poll', async () => {
        await resourceClient('ActorClient').call(undefined, { log: null, timeout: 7 });

        expect(mockHttpClient.callHistory.map((config) => config.timeout)).toEqual([7, 7]);
    });

    test('runTimeout is what the API receives as the run `timeout`', async () => {
        await resourceClient('ActorClient').start(undefined, { runTimeout: 120, timeout: 'long' });
        expect(mockHttpClient.lastCall.params).toMatchObject({ timeout: 120 });
        expect(mockHttpClient.lastCall.timeout).toBe('long');

        await resourceClient('RunClient').resurrect({ runTimeout: 60 });
        expect(mockHttpClient.lastCall.params).toMatchObject({ timeout: 60 });
        expect(mockHttpClient.lastCall.timeout).toBe('medium');
    });

    test.each([
        { timeout: 0, reason: 'zero' },
        { timeout: -1, reason: 'a negative number' },
        { timeout: 'fast', reason: 'an unknown tier' },
        { timeout: null, reason: 'null' },
    ])('rejects $reason as a timeout', async ({ timeout }) => {
        await expect(resourceClient('DatasetClient').get({ timeout })).rejects.toThrow(ArgumentValidationError);
    });

    describe('RequestQueueClient with a queue-wide timeoutSecs', () => {
        test('caps the default tier of every request', async () => {
            const queue = client.requestQueue('test-id', { timeoutSecs: 2 }) as unknown as Record<string, unknown>;
            queue.httpClient = mockHttpClient;
            const queueClient = queue as unknown as ReturnType<ApifyClient['requestQueue']>;

            await queueClient.get();
            expect(mockHttpClient.lastCall.timeout).toBe(2);

            await queueClient.unlockRequests();
            expect(mockHttpClient.lastCall.timeout).toBe(2);
        });

        test('leaves a tier below the cap alone', async () => {
            const queue = client.requestQueue('test-id', { timeoutSecs: 60 }) as unknown as Record<string, unknown>;
            queue.httpClient = mockHttpClient;
            const queueClient = queue as unknown as ReturnType<ApifyClient['requestQueue']>;

            await queueClient.get();
            expect(mockHttpClient.lastCall.timeout).toBe('short');

            await queueClient.unlockRequests();
            expect(mockHttpClient.lastCall.timeout).toBe(60);
        });

        test('does not cap an explicit per-call timeout', async () => {
            const queue = client.requestQueue('test-id', { timeoutSecs: 2 }) as unknown as Record<string, unknown>;
            queue.httpClient = mockHttpClient;
            const queueClient = queue as unknown as ReturnType<ApifyClient['requestQueue']>;

            await queueClient.get({ timeout: 'long' });
            expect(mockHttpClient.lastCall.timeout).toBe('long');

            await queueClient.getRequest('x', { timeout: 30 });
            expect(mockHttpClient.lastCall.timeout).toBe(30);
        });

        test('compares against the tier durations configured on the client', async () => {
            client = new ApifyClient({ timeoutShortSecs: 1 });
            mockHttpClient = new MockHttpClient(client.httpClient);
            const queue = client.requestQueue('test-id', { timeoutSecs: 2 }) as unknown as Record<string, unknown>;
            queue.httpClient = mockHttpClient;
            const queueClient = queue as unknown as ReturnType<ApifyClient['requestQueue']>;

            await queueClient.get();
            expect(mockHttpClient.lastCall.timeout).toBe('short');
        });
    });
});
