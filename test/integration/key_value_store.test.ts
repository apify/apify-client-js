import type { Readable } from 'node:stream';

import { beforeAll, expect, test } from 'vitest';

import type { JsonValue } from 'type-fest';

import type { ApifyClient, KeyValueStore } from 'apify-client';

import { makeClient } from './_fixtures.js';
import { collectUntilPresent, getRandomResourceName, pollUntilCondition } from './_utils.js';

let client: ApifyClient;

beforeAll(() => {
    client = makeClient();
});

async function createStore(label = 'kvs'): Promise<KeyValueStore> {
    return client.keyValueStores().getOrCreate(getRandomResourceName(label));
}

/** Wait until a record written to the store is readable, since writes are only eventually consistent. */
async function waitForRecord(storeId: string, key: string): Promise<void> {
    const exists = await pollUntilCondition(() => client.keyValueStore(storeId).recordExists(key));
    expect(exists, `record ${key} never became readable`).toBe(true);
}

/** Wait until the store lists exactly `expectedCount` keys. */
async function waitForKeyCount(storeId: string, expectedCount: number): Promise<void> {
    const keys = await pollUntilCondition(
        () => client.keyValueStore(storeId).listKeys(),
        (result) => result.items.length === expectedCount,
    );
    expect(keys.items).toHaveLength(expectedCount);
}

async function readStream(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
}

test('keyValueStores().list() returns a page of the user stores', async () => {
    const storesPage = await client.keyValueStores().list({ limit: 10 });

    expect(Array.isArray(storesPage.items)).toBe(true);
    expect(storesPage.limit).toBe(10);
});

test('keyValueStores().list() honours limit and offset', async () => {
    const storesPage = await client.keyValueStores().list({ limit: 5, offset: 0 });

    expect(Array.isArray(storesPage.items)).toBe(true);
    expect(storesPage.limit).toBe(5);
    expect(storesPage.offset).toBe(0);
});

test('keyValueStores().getOrCreate() creates a named store and returns the existing one on a second call', async () => {
    const uniqueName = getRandomResourceName('kvs');
    const store = await client.keyValueStores().getOrCreate(uniqueName);

    try {
        expect(store.name).toBe(uniqueName);

        const sameStore = await client.keyValueStores().getOrCreate(uniqueName);
        expect(sameStore.id).toBe(store.id);
    } finally {
        await client.keyValueStore(store.id).delete();
    }
});

test('keyValueStores().list() iterates the user stores across pages', async () => {
    const createdIds: string[] = [];

    try {
        for (let i = 0; i < 3; i++) {
            const store = await createStore();
            createdIds.push(store.id);
        }

        const collected = await collectUntilPresent(
            () => client.keyValueStores().list({ desc: true, limit: 50 }),
            createdIds,
        );
        const collectedIds = new Set(collected.map((item) => item.id));

        for (const createdId of createdIds) {
            expect(collectedIds, `store ${createdId} is missing from the listing`).toContain(createdId);
        }
    } finally {
        for (const id of createdIds) {
            await client.keyValueStore(id).delete();
        }
    }
});

test('a created store is retrievable by id', async () => {
    const storeName = getRandomResourceName('kvs');
    const createdStore = await client.keyValueStores().getOrCreate(storeName);
    const storeClient = client.keyValueStore(createdStore.id);

    try {
        const retrievedStore = await storeClient.get();

        expect(retrievedStore?.id).toBe(createdStore.id);
        expect(retrievedStore?.name).toBe(storeName);
    } finally {
        await storeClient.delete();
    }
});

test('update() renames a store and the new name persists', async () => {
    const newName = getRandomResourceName('kvs-updated');
    const createdStore = await createStore();
    const storeClient = client.keyValueStore(createdStore.id);

    try {
        const updatedStore = await storeClient.update({ name: newName });
        expect(updatedStore.name).toBe(newName);
        expect(updatedStore.id).toBe(createdStore.id);

        const retrievedStore = await storeClient.get();
        expect(retrievedStore?.name).toBe(newName);
    } finally {
        await storeClient.delete();
    }
});

test('get() resolves to undefined for a deleted store', async () => {
    const createdStore = await createStore();
    const storeClient = client.keyValueStore(createdStore.id);

    await storeClient.delete();

    await expect(storeClient.get()).resolves.toBeUndefined();
});

test('setRecord() stores a JSON value that getRecord() returns parsed', async () => {
    const createdStore = await createStore();
    const storeClient = client.keyValueStore(createdStore.id);

    try {
        const testValue = { name: 'Test Item', value: 123, nested: { data: 'value' } };
        await storeClient.setRecord({ key: 'test-key', value: testValue });
        await waitForRecord(createdStore.id, 'test-key');

        const record = await storeClient.getRecord('test-key');
        expect(record?.key).toBe('test-key');
        expect(record?.value).toEqual(testValue);
        expect(record?.contentType).toContain('application/json');
    } finally {
        await storeClient.delete();
    }
});

test('setRecord() stores a text value under an explicit content type', async () => {
    const createdStore = await createStore();
    const storeClient = client.keyValueStore(createdStore.id);

    try {
        const testText = 'Hello, this is a test text!';
        await storeClient.setRecord({ key: 'text-key', value: testText, contentType: 'text/plain' });
        await waitForRecord(createdStore.id, 'text-key');

        const record = await storeClient.getRecord('text-key');
        expect(record?.key).toBe('text-key');
        expect(record?.value).toBe(testText);
        expect(record?.contentType).toContain('text/plain');
    } finally {
        await storeClient.delete();
    }
});

test('setRecord() stores binary data that getRecord() returns byte-for-byte with the buffer option', async () => {
    const createdStore = await createStore();
    const storeClient = client.keyValueStore(createdStore.id);

    try {
        const binaryValue = Buffer.concat([
            Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
            Buffer.from('fake-png-bytes'),
        ]);
        // `setRecord` accepts a Buffer at runtime, but its `value` is typed as `JsonValue`, so the
        // binary case needs a cast.
        await storeClient.setRecord({
            key: 'image.png',
            value: binaryValue as unknown as JsonValue,
            contentType: 'image/png',
        });
        await waitForRecord(createdStore.id, 'image.png');

        const record = await storeClient.getRecord('image.png', { buffer: true });
        expect(record?.key).toBe('image.png');
        expect(Buffer.isBuffer(record?.value)).toBe(true);
        expect(record!.value.equals(binaryValue)).toBe(true);
        expect(record?.contentType).toContain('image/png');
    } finally {
        await storeClient.delete();
    }
});

test('getRecord() with the stream option yields the record body as a readable stream', async () => {
    const createdStore = await createStore();
    const storeClient = client.keyValueStore(createdStore.id);

    try {
        await storeClient.setRecord({ key: 'stream-key', value: { data: 'streamed' } });
        await waitForRecord(createdStore.id, 'stream-key');

        const record = await storeClient.getRecord('stream-key', { stream: true });
        expect(record).toBeDefined();

        const body = await readStream(record!.value);
        expect(JSON.parse(body.toString('utf8'))).toEqual({ data: 'streamed' });
    } finally {
        await storeClient.delete();
    }
});

test('getRecord() resolves to undefined for a missing key', async () => {
    const createdStore = await createStore();
    const storeClient = client.keyValueStore(createdStore.id);

    try {
        await expect(storeClient.getRecord('never-written')).resolves.toBeUndefined();
    } finally {
        await storeClient.delete();
    }
});

test('recordExists() distinguishes a written key from a missing one', async () => {
    const createdStore = await createStore();
    const storeClient = client.keyValueStore(createdStore.id);

    try {
        await storeClient.setRecord({ key: 'exists-key', value: { data: 'value' } });
        await waitForRecord(createdStore.id, 'exists-key');

        await expect(storeClient.recordExists('exists-key')).resolves.toBe(true);
        await expect(storeClient.recordExists('non-existent-key')).resolves.toBe(false);
    } finally {
        await storeClient.delete();
    }
});

test('deleteRecord() removes a record from the store', async () => {
    const createdStore = await createStore();
    const storeClient = client.keyValueStore(createdStore.id);

    try {
        await storeClient.setRecord({ key: 'delete-me', value: { data: 'value' } });
        await waitForRecord(createdStore.id, 'delete-me');

        await storeClient.deleteRecord('delete-me');

        const record = await pollUntilCondition(
            () => storeClient.getRecord('delete-me'),
            (result) => result === undefined,
        );
        expect(record).toBeUndefined();
    } finally {
        await storeClient.delete();
    }
});

test('listKeys() returns every key in the store', async () => {
    const createdStore = await createStore();
    const storeClient = client.keyValueStore(createdStore.id);

    try {
        for (let i = 0; i < 5; i++) {
            await storeClient.setRecord({ key: `key-${i}`, value: { index: i } });
        }
        await waitForKeyCount(createdStore.id, 5);

        const keysResult = await storeClient.listKeys();
        const keyNames = keysResult.items.map((item) => item.key);
        for (let i = 0; i < 5; i++) {
            expect(keyNames).toContain(`key-${i}`);
        }
    } finally {
        await storeClient.delete();
    }
});

test('listKeys() honours limit', async () => {
    const createdStore = await createStore();
    const storeClient = client.keyValueStore(createdStore.id);

    try {
        for (let i = 0; i < 10; i++) {
            await storeClient.setRecord({ key: `item-${String(i).padStart(2, '0')}`, value: { index: i } });
        }
        await waitForKeyCount(createdStore.id, 10);

        const keysResult = await storeClient.listKeys({ limit: 5 });
        expect(keysResult.items).toHaveLength(5);
        expect(keysResult.isTruncated).toBe(true);
    } finally {
        await storeClient.delete();
    }
});

test('listKeys() paginates from exclusiveStartKey without repeating keys', async () => {
    const createdStore = await createStore();
    const storeClient = client.keyValueStore(createdStore.id);

    try {
        // Zero-padded names keep the lexicographic order predictable.
        for (let i = 0; i < 5; i++) {
            await storeClient.setRecord({ key: `key-${String(i).padStart(2, '0')}`, value: { idx: i } });
        }
        await waitForKeyCount(createdStore.id, 5);

        const firstPage = await storeClient.listKeys({ limit: 2 });
        expect(firstPage.items).toHaveLength(2);

        const lastKeyOfFirst = firstPage.items.at(-1)!.key;
        const secondPage = await storeClient.listKeys({ exclusiveStartKey: lastKeyOfFirst });

        const firstKeys = new Set(firstPage.items.map((item) => item.key));
        for (const item of secondPage.items) {
            expect(firstKeys).not.toContain(item.key);
        }
    } finally {
        await storeClient.delete();
    }
});

test('listKeys() is async-iterable and yields every key', async () => {
    const createdStore = await createStore();
    const storeClient = client.keyValueStore(createdStore.id);

    try {
        for (let i = 0; i < 5; i++) {
            await storeClient.setRecord({ key: `key-${i}`, value: { index: i } });
        }
        await waitForKeyCount(createdStore.id, 5);

        const collectedKeys: string[] = [];
        for await (const item of storeClient.listKeys()) {
            collectedKeys.push(item.key);
        }

        expect(collectedKeys).toHaveLength(5);
        for (let i = 0; i < 5; i++) {
            expect(collectedKeys).toContain(`key-${i}`);
        }
    } finally {
        await storeClient.delete();
    }
});

test('listKeys() iteration stops at the requested limit', async () => {
    const createdStore = await createStore();
    const storeClient = client.keyValueStore(createdStore.id);

    try {
        for (let i = 0; i < 10; i++) {
            await storeClient.setRecord({ key: `item-${String(i).padStart(2, '0')}`, value: { index: i } });
        }
        await waitForKeyCount(createdStore.id, 10);

        const collectedKeys: string[] = [];
        for await (const item of storeClient.listKeys({ limit: 5 })) {
            collectedKeys.push(item.key);
        }

        expect(collectedKeys).toHaveLength(5);
    } finally {
        await storeClient.delete();
    }
});

test('listKeys() iteration applies the prefix filter', async () => {
    const createdStore = await createStore();
    const storeClient = client.keyValueStore(createdStore.id);

    try {
        for (let i = 0; i < 3; i++) {
            await storeClient.setRecord({ key: `prefix-a-${i}`, value: { type: 'a', index: i } });
        }
        for (let i = 0; i < 2; i++) {
            await storeClient.setRecord({ key: `prefix-b-${i}`, value: { type: 'b', index: i } });
        }
        await waitForKeyCount(createdStore.id, 5);

        const collectedKeys: string[] = [];
        for await (const item of storeClient.listKeys({ prefix: 'prefix-a-' })) {
            collectedKeys.push(item.key);
        }

        expect(collectedKeys).toHaveLength(3);
        for (const key of collectedKeys) {
            expect(key.startsWith('prefix-a-')).toBe(true);
        }
    } finally {
        await storeClient.delete();
    }
});

test('getRecordPublicUrl() returns a signed URL that serves the record', async () => {
    const createdStore = await createStore();
    const storeClient = client.keyValueStore(createdStore.id);

    try {
        await storeClient.setRecord({ key: 'my-record', value: { hello: 'world' } });
        await waitForRecord(createdStore.id, 'my-record');

        const publicUrl = await storeClient.getRecordPublicUrl('my-record');
        expect(publicUrl).toContain(createdStore.id);
        expect(publicUrl).toContain('my-record');

        // Fetched with no credentials at all - the signature alone must authorize the read.
        const response = await fetch(publicUrl);
        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({ hello: 'world' });
    } finally {
        await storeClient.delete();
    }
});

test('createKeysPublicUrl() returns a signed URL that lists the keys', async () => {
    const createdStore = await createStore();
    const storeClient = client.keyValueStore(createdStore.id);

    try {
        for (let i = 0; i < 3; i++) {
            await storeClient.setRecord({ key: `key-${i}`, value: { idx: i } });
        }
        await waitForKeyCount(createdStore.id, 3);

        const publicUrl = await storeClient.createKeysPublicUrl({ limit: 10, expiresInSecs: 300 });
        expect(publicUrl).toContain(createdStore.id);
        expect(publicUrl).toContain('signature=');

        const response = await fetch(publicUrl);
        expect(response.status).toBe(200);

        const body = (await response.json()) as { data?: { items?: { key: string }[] } };
        const keyNames = (body.data?.items ?? []).map((item) => item.key);
        for (let i = 0; i < 3; i++) {
            expect(keyNames).toContain(`key-${i}`);
        }
    } finally {
        await storeClient.delete();
    }
});

test('createKeysPublicUrl() returns a never-expiring signed URL', async () => {
    const createdStore = await createStore();
    const storeClient = client.keyValueStore(createdStore.id);

    try {
        const publicUrl = await storeClient.createKeysPublicUrl();
        expect(publicUrl).toContain('signature=');

        const response = await fetch(publicUrl);
        expect(response.status).toBe(200);
    } finally {
        await storeClient.delete();
    }
});
