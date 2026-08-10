import { beforeAll, expect, test } from 'vitest';

import type { ApifyClient, RequestQueue, RequestQueueClient, RequestQueueClientGetRequestResult } from 'apify-client';

import { makeClient } from './_fixtures.js';
import { collectUntilPresent, getRandomResourceName, pollUntilCondition, randomId } from './_utils.js';

let client: ApifyClient;

beforeAll(() => {
    client = makeClient();
});

async function createQueue(label = 'queue'): Promise<RequestQueue> {
    return client.requestQueues().getOrCreate(getRandomResourceName(label));
}

/**
 * `getRequest()` returns `userData`, but `RequestQueueClientGetRequestResult` does not declare it.
 * Read it through this shape so the round-trip assertion stays honest until the type catches up.
 */
type RequestWithUserData = RequestQueueClientGetRequestResult & { userData?: Record<string, unknown> };

/**
 * Poll the queue until `expectedCount` requests are visible.
 *
 * Uses `listHead()`, which has no side effects, so polling does not lock anything - locking here
 * would leave the tests that exercise locks with an ambiguous count.
 */
async function ensureQueueIsPopulated(queueClient: RequestQueueClient, expectedCount: number): Promise<void> {
    const head = await pollUntilCondition(
        () => queueClient.listHead({ limit: expectedCount }),
        (result) => result.items.length === expectedCount,
    );
    expect(head.items).toHaveLength(expectedCount);
}

test('requestQueues().list() returns a page of the user queues', async () => {
    const queuesPage = await client.requestQueues().list({ limit: 10 });

    expect(Array.isArray(queuesPage.items)).toBe(true);
    expect(queuesPage.limit).toBe(10);
});

test('requestQueues().list() honours limit and offset', async () => {
    const queuesPage = await client.requestQueues().list({ limit: 5, offset: 0 });

    expect(Array.isArray(queuesPage.items)).toBe(true);
    expect(queuesPage.limit).toBe(5);
    expect(queuesPage.offset).toBe(0);
});

test('requestQueues().getOrCreate() creates a named queue and returns the existing one on a second call', async () => {
    const uniqueName = getRandomResourceName('rq');
    const queue = await client.requestQueues().getOrCreate(uniqueName);

    try {
        expect(queue.name).toBe(uniqueName);

        const sameQueue = await client.requestQueues().getOrCreate(uniqueName);
        expect(sameQueue.id).toBe(queue.id);
    } finally {
        await client.requestQueue(queue.id).delete();
    }
});

test('requestQueues().list() iterates the user queues across pages', async () => {
    const createdIds: string[] = [];
    for (let i = 0; i < 3; i++) {
        const queue = await createQueue('rq');
        createdIds.push(queue.id);
    }

    try {
        const collected = await collectUntilPresent(
            () => client.requestQueues().list({ desc: true, limit: 50 }),
            createdIds,
        );
        const collectedIds = new Set(collected.map((item) => item.id));

        for (const createdId of createdIds) {
            expect(collectedIds, `queue ${createdId} is missing from the listing`).toContain(createdId);
        }
    } finally {
        for (const id of createdIds) {
            await client.requestQueue(id).delete();
        }
    }
});

test('a created queue is retrievable by id', async () => {
    const queueName = getRandomResourceName('queue');
    const createdQueue = await client.requestQueues().getOrCreate(queueName);
    const queueClient = client.requestQueue(createdQueue.id);

    try {
        expect(createdQueue.name).toBe(queueName);

        const retrievedQueue = await queueClient.get();
        expect(retrievedQueue?.id).toBe(createdQueue.id);
        expect(retrievedQueue?.name).toBe(queueName);
    } finally {
        await queueClient.delete();
    }
});

test('update() renames a queue and the new name persists', async () => {
    const newName = getRandomResourceName('queue-updated');
    const createdQueue = await createQueue();
    const queueClient = client.requestQueue(createdQueue.id);

    try {
        const updatedQueue = await queueClient.update({ name: newName });
        expect(updatedQueue.name).toBe(newName);
        expect(updatedQueue.id).toBe(createdQueue.id);

        const retrievedQueue = await queueClient.get();
        expect(retrievedQueue?.name).toBe(newName);
    } finally {
        await queueClient.delete();
    }
});

test('get() resolves to undefined for a deleted queue', async () => {
    const createdQueue = await createQueue();
    const queueClient = client.requestQueue(createdQueue.id);

    await queueClient.delete();

    await expect(queueClient.get()).resolves.toBeUndefined();
});

test('addRequest() registers a request that getRequest() then returns', async () => {
    const createdQueue = await createQueue();
    const queueClient = client.requestQueue(createdQueue.id);

    try {
        const addResult = await queueClient.addRequest({
            url: 'https://example.com/test',
            uniqueKey: 'test-key-1',
            method: 'GET',
        });
        expect(addResult.requestId).toBeTruthy();
        expect(addResult.wasAlreadyPresent).toBe(false);

        const request = await pollUntilCondition(
            () => queueClient.getRequest(addResult.requestId),
            (result) => result !== undefined,
        );
        expect(request?.url).toBe('https://example.com/test');
        expect(request?.uniqueKey).toBe('test-key-1');
    } finally {
        await queueClient.delete();
    }
});

test('updateRequest() changes the method and user data of an existing request', async () => {
    const createdQueue = await createQueue();
    const queueClient = client.requestQueue(createdQueue.id);

    try {
        const addResult = await queueClient.addRequest({
            url: 'https://example.com/original',
            uniqueKey: 'update-test',
            method: 'GET',
        });

        const originalRequest = await pollUntilCondition(
            () => queueClient.getRequest(addResult.requestId),
            (result) => result !== undefined,
        );
        expect(originalRequest).toBeDefined();

        const updateResult = await queueClient.updateRequest({
            id: addResult.requestId,
            url: originalRequest!.url,
            uniqueKey: originalRequest!.uniqueKey,
            method: 'POST',
            userData: { updated: true },
        });
        expect(updateResult.requestId).toBe(addResult.requestId);

        const updatedRequest = (await pollUntilCondition(
            () => queueClient.getRequest(addResult.requestId),
            (result) => result?.method === 'POST',
        )) as RequestWithUserData | undefined;
        expect(updatedRequest?.method).toBe('POST');
        expect(updatedRequest?.userData).toEqual({ updated: true });
    } finally {
        await queueClient.delete();
    }
});

test('deleteRequest() removes a request from the queue', async () => {
    const createdQueue = await createQueue();
    const queueClient = client.requestQueue(createdQueue.id);

    try {
        const addResult = await queueClient.addRequest({
            url: 'https://example.com/to-delete',
            uniqueKey: 'delete-me',
        });

        await pollUntilCondition(
            () => queueClient.getRequest(addResult.requestId),
            (result) => result !== undefined,
        );

        await queueClient.deleteRequest(addResult.requestId);

        const deletedRequest = await pollUntilCondition(
            () => queueClient.getRequest(addResult.requestId),
            (result) => result === undefined,
        );
        expect(deletedRequest).toBeUndefined();
    } finally {
        await queueClient.delete();
    }
});

test('listHead() returns requests from the head of the queue', async () => {
    const createdQueue = await createQueue();
    const queueClient = client.requestQueue(createdQueue.id);

    try {
        for (let i = 0; i < 5; i++) {
            await queueClient.addRequest({ url: `https://example.com/page-${i}`, uniqueKey: `page-${i}` });
        }

        const head = await pollUntilCondition(
            () => queueClient.listHead({ limit: 3 }),
            (result) => result.items.length === 3,
        );
        expect(head.items).toHaveLength(3);
    } finally {
        await queueClient.delete();
    }
});

test('listRequests() returns every request in the queue', async () => {
    const createdQueue = await createQueue();
    const queueClient = client.requestQueue(createdQueue.id);

    try {
        for (let i = 0; i < 5; i++) {
            await queueClient.addRequest({ url: `https://example.com/item-${i}`, uniqueKey: `item-${i}` });
        }

        const listResult = await pollUntilCondition(
            () => queueClient.listRequests(),
            (result) => result.items.length === 5,
        );
        expect(listResult.items).toHaveLength(5);
    } finally {
        await queueClient.delete();
    }
});

test('listRequests() paginates via the opaque cursor without repeating requests', async () => {
    const createdQueue = await createQueue('rq');
    const queueClient = client.requestQueue(createdQueue.id);

    try {
        for (let i = 0; i < 5; i++) {
            await queueClient.addRequest({ url: `https://example.com/p-${i}`, uniqueKey: `u-${i}` });
        }
        await ensureQueueIsPopulated(queueClient, 5);

        const firstPage = await queueClient.listRequests({ limit: 2 });
        expect(firstPage.items).toHaveLength(2);

        // With 5 requests and a limit of 2, the API must hand back a continuation token.
        expect(firstPage.nextCursor).toBeTruthy();

        const secondPage = await queueClient.listRequests({ limit: 10, cursor: firstPage.nextCursor });
        const firstIds = new Set(firstPage.items.map((item) => item.id));
        for (const item of secondPage.items) {
            expect(firstIds).not.toContain(item.id);
        }
    } finally {
        await queueClient.delete();
    }
});

test('listRequests() with the pending filter returns the unhandled requests', async () => {
    const createdQueue = await createQueue('rq');
    const queueClient = client.requestQueue(createdQueue.id);

    try {
        for (let i = 0; i < 3; i++) {
            await queueClient.addRequest({ url: `https://example.com/f-${i}`, uniqueKey: `f-${i}` });
        }
        await ensureQueueIsPopulated(queueClient, 3);

        const pendingPage = await queueClient.listRequests({ filter: ['pending'] });
        expect(pendingPage.items).toHaveLength(3);
    } finally {
        await queueClient.delete();
    }
});

test('listRequests() is async-iterable and pages through the queue', async () => {
    const createdQueue = await createQueue('rq');
    const queueClient = client.requestQueue(createdQueue.id);

    try {
        const addedUrls: string[] = [];
        for (let i = 0; i < 7; i++) {
            const url = `https://example.com/page-${i}`;
            await queueClient.addRequest({ url, uniqueKey: `unique-${i}` });
            addedUrls.push(url);
        }
        await ensureQueueIsPopulated(queueClient, 7);

        const collected: { url: string }[] = [];
        for await (const request of queueClient.listRequests({ limit: 3 })) {
            collected.push(request);
        }

        // The limit caps the iteration, so only the first page's worth is yielded.
        expect(collected).toHaveLength(3);
        for (const request of collected) {
            expect(addedUrls).toContain(request.url);
        }
    } finally {
        await queueClient.delete();
    }
});

test('paginateRequests() yields pages sized by maxPageLimit until the queue is drained', async () => {
    const createdQueue = await createQueue('rq');
    const queueClient = client.requestQueue(createdQueue.id);

    try {
        const addedUrls: string[] = [];
        for (let i = 0; i < 7; i++) {
            const url = `https://example.com/page-${i}`;
            await queueClient.addRequest({ url, uniqueKey: `unique-${i}` });
            addedUrls.push(url);
        }
        await ensureQueueIsPopulated(queueClient, 7);

        const collectedUrls: string[] = [];
        const pageSizes: number[] = [];
        for await (const page of queueClient.paginateRequests({ maxPageLimit: 3 })) {
            pageSizes.push(page.items.length);
            collectedUrls.push(...page.items.map((item) => item.url));
        }

        expect(collectedUrls.sort()).toEqual(addedUrls.sort());
        // 7 requests in pages of at most 3 means no page may exceed the requested size.
        for (const size of pageSizes) {
            expect(size).toBeLessThanOrEqual(3);
        }
    } finally {
        await queueClient.delete();
    }
});

test('batchAddRequests() registers every request in one call', async () => {
    const createdQueue = await createQueue();
    const queueClient = client.requestQueue(createdQueue.id);

    try {
        const requestsToAdd = Array.from({ length: 10 }, (_, index) => ({
            url: `https://example.com/batch-${index}`,
            uniqueKey: `batch-${index}`,
        }));
        const batchResult = await queueClient.batchAddRequests(requestsToAdd);
        expect(batchResult.processedRequests).toHaveLength(10);
        expect(batchResult.unprocessedRequests).toHaveLength(0);

        const listResult = await pollUntilCondition(
            () => queueClient.listRequests(),
            (result) => result.items.length === 10,
        );
        expect(listResult.items).toHaveLength(10);
    } finally {
        await queueClient.delete();
    }
});

test('batchDeleteRequests() removes the requests it is given by unique key', async () => {
    const createdQueue = await createQueue();
    const queueClient = client.requestQueue(createdQueue.id);

    try {
        for (let i = 0; i < 10; i++) {
            await queueClient.addRequest({ url: `https://example.com/delete-${i}`, uniqueKey: `delete-${i}` });
        }

        const listResult = await pollUntilCondition(
            () => queueClient.listRequests(),
            (result) => result.items.length === 10,
        );
        expect(listResult.items).toHaveLength(10);

        const requestsToDelete = listResult.items.slice(0, 5).map((item) => ({ uniqueKey: item.uniqueKey }));
        const deleteResult = await queueClient.batchDeleteRequests(requestsToDelete);
        expect(deleteResult.processedRequests).toHaveLength(5);

        const remaining = await pollUntilCondition(
            () => queueClient.listRequests(),
            (result) => result.items.length === 5,
        );
        expect(remaining.items).toHaveLength(5);
    } finally {
        await queueClient.delete();
    }
});

test('listAndLockHead() locks the requests it returns', async () => {
    const createdQueue = await createQueue();
    const queueClient = client.requestQueue(createdQueue.id, { clientKey: randomId(10) });

    try {
        for (let i = 0; i < 5; i++) {
            await queueClient.addRequest({ url: `https://example.com/lock-${i}`, uniqueKey: `lock-${i}` });
        }
        await ensureQueueIsPopulated(queueClient, 5);

        const lockResult = await queueClient.listAndLockHead({ limit: 3, lockSecs: 60 });
        expect(lockResult.items).toHaveLength(3);

        for (const lockedRequest of lockResult.items) {
            expect(lockedRequest.id).toBeTruthy();
            expect(lockedRequest.lockExpiresAt).toBeDefined();
        }
    } finally {
        await queueClient.delete();
    }
});

test('prolongRequestLock() pushes the lock expiry further out', async () => {
    const createdQueue = await createQueue();
    const queueClient = client.requestQueue(createdQueue.id, { clientKey: randomId(10) });

    try {
        await queueClient.addRequest({ url: 'https://example.com/prolong', uniqueKey: 'prolong-test' });

        await ensureQueueIsPopulated(queueClient, 1);

        const lockResult = await queueClient.listAndLockHead({ limit: 1, lockSecs: 60 });
        expect(lockResult.items).toHaveLength(1);
        const lockedRequest = lockResult.items[0];
        const originalLockExpiresAt = lockedRequest.lockExpiresAt!;

        const prolongResult = await queueClient.prolongRequestLock(lockedRequest.id, { lockSecs: 120 });
        expect(prolongResult.lockExpiresAt.getTime()).toBeGreaterThan(originalLockExpiresAt.getTime());
    } finally {
        await queueClient.delete();
    }
});

test('deleteRequestLock() releases the lock and leaves the request in place', async () => {
    const createdQueue = await createQueue();
    const queueClient = client.requestQueue(createdQueue.id, { clientKey: randomId(10) });

    try {
        await queueClient.addRequest({ url: 'https://example.com/unlock', uniqueKey: 'unlock-test' });

        await ensureQueueIsPopulated(queueClient, 1);

        const lockResult = await queueClient.listAndLockHead({ limit: 1, lockSecs: 60 });
        expect(lockResult.items).toHaveLength(1);
        const lockedRequest = lockResult.items[0];

        await queueClient.deleteRequestLock(lockedRequest.id);

        await expect(queueClient.getRequest(lockedRequest.id)).resolves.toBeDefined();

        // The request is back at the head, which it would not be while a lock was still held.
        const head = await pollUntilCondition(
            () => queueClient.listAndLockHead({ limit: 1, lockSecs: 5 }),
            (result) => result.items.length === 1,
        );
        expect(head.items[0].id).toBe(lockedRequest.id);
    } finally {
        await queueClient.delete();
    }
});

test('deleteRequestLock() accepts the forefront option', async () => {
    const createdQueue = await createQueue();
    const queueClient = client.requestQueue(createdQueue.id, { clientKey: randomId(10) });

    try {
        for (let i = 0; i < 2; i++) {
            await queueClient.addRequest({ url: `https://example.com/forefront-${i}`, uniqueKey: `forefront-${i}` });
        }
        await ensureQueueIsPopulated(queueClient, 2);

        const lockResult = await queueClient.listAndLockHead({ limit: 2, lockSecs: 60 });
        expect(lockResult.items).toHaveLength(2);

        await queueClient.deleteRequestLock(lockResult.items[0].id, { forefront: true });

        await expect(queueClient.getRequest(lockResult.items[0].id)).resolves.toBeDefined();
    } finally {
        await queueClient.delete();
    }
});

test('unlockRequests() releases every lock held by this client', async () => {
    const createdQueue = await createQueue();
    const queueClient = client.requestQueue(createdQueue.id, { clientKey: randomId(10) });

    try {
        for (let i = 0; i < 5; i++) {
            await queueClient.addRequest({ url: `https://example.com/unlock-${i}`, uniqueKey: `unlock-${i}` });
        }
        await ensureQueueIsPopulated(queueClient, 5);

        const lockResult = await queueClient.listAndLockHead({ limit: 3, lockSecs: 60 });
        expect(lockResult.items).toHaveLength(3);
        const lockedIds = new Set(lockResult.items.map((item) => item.id));

        // Locks are acknowledged before they become visible to later reads, so unlocking straight away can
        // see fewer locks than were just taken. Locked requests drop out of the queue head, so wait until
        // the locked IDs are gone from it.
        await pollUntilCondition(
            async () => {
                const head = await queueClient.listHead({ limit: 5 });
                return head.items.every((item) => !lockedIds.has(item.id));
            },
            (allLocksVisible) => allLocksVisible,
        );

        const unlockResult = await queueClient.unlockRequests();
        expect(unlockResult.unlockedCount).toBe(3);
    } finally {
        await queueClient.delete();
    }
});

test('locks can be taken, released and prolonged across a batch of requests', async () => {
    const createdQueue = await createQueue('queue');
    const queueClient = client.requestQueue(createdQueue.id, { clientKey: randomId(10) });

    try {
        for (let i = 0; i < 15; i++) {
            await queueClient.addRequest({ url: `http://test-lock.com/${i}`, uniqueKey: `http://test-lock.com/${i}` });
        }

        await ensureQueueIsPopulated(queueClient, 15);

        const lockResult = await queueClient.listAndLockHead({ limit: 10, lockSecs: 10 });
        expect(lockResult.items).toHaveLength(10);

        for (const lockedRequest of lockResult.items) {
            expect(lockedRequest.lockExpiresAt).toBeDefined();
        }

        await queueClient.deleteRequestLock(lockResult.items[1].id);
        await queueClient.deleteRequestLock(lockResult.items[2].id, { forefront: true });

        const prolongResult = await queueClient.prolongRequestLock(lockResult.items[3].id, { lockSecs: 15 });
        expect(prolongResult.lockExpiresAt).toBeDefined();
    } finally {
        await queueClient.delete();
    }
});
