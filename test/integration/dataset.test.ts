import { beforeAll, describe, expect, test } from 'vitest';

import type { ApifyClient, Dataset } from 'apify-client';
import { DownloadItemsFormat } from 'apify-client';

import { makeClient } from './_fixtures.js';
import { collectUntilPresent, getRandomResourceName, pollUntilCondition } from './_utils.js';

let client: ApifyClient;

beforeAll(() => {
    client = makeClient();
});

async function createDataset(label = 'dataset'): Promise<Dataset> {
    return client.datasets().getOrCreate(getRandomResourceName(label));
}

/**
 * Wait until every pushed item is readable, since dataset writes are only eventually consistent.
 *
 * Also waits for the reported total to catch up, not just the returned items: paginated iteration
 * derives its stop condition from the total, so a lagging one silently truncates the iteration.
 */
async function waitForItemCount(datasetId: string, expectedCount: number): Promise<void> {
    const page = await pollUntilCondition(
        () => client.dataset(datasetId).listItems({ limit: Math.max(expectedCount, 1) }),
        (result) => result.items.length === expectedCount && result.total === expectedCount,
    );
    expect(page.items).toHaveLength(expectedCount);
    expect(page.total).toBe(expectedCount);
}

test('datasets().list() returns a page of the user datasets', async () => {
    const datasetsPage = await client.datasets().list({ limit: 10 });

    expect(Array.isArray(datasetsPage.items)).toBe(true);
    expect(datasetsPage.limit).toBe(10);
});

test('datasets().list() honours limit and offset', async () => {
    const datasetsPage = await client.datasets().list({ limit: 5, offset: 0 });

    expect(Array.isArray(datasetsPage.items)).toBe(true);
    expect(datasetsPage.limit).toBe(5);
    expect(datasetsPage.offset).toBe(0);
});

test('datasets().getOrCreate() creates a named dataset and returns the existing one on a second call', async () => {
    const uniqueName = getRandomResourceName('dataset');
    const dataset = await client.datasets().getOrCreate(uniqueName);

    try {
        expect(dataset.name).toBe(uniqueName);

        const sameDataset = await client.datasets().getOrCreate(uniqueName);
        expect(sameDataset.id).toBe(dataset.id);
    } finally {
        await client.dataset(dataset.id).delete();
    }
});

test('datasets().list() iterates the user datasets across pages', async () => {
    const createdIds: string[] = [];
    for (let i = 0; i < 3; i++) {
        const dataset = await createDataset();
        createdIds.push(dataset.id);
    }

    try {
        const collected = await collectUntilPresent(
            () => client.datasets().list({ desc: true, limit: 50 }),
            createdIds,
        );
        const collectedIds = new Set(collected.map((item) => item.id));

        for (const createdId of createdIds) {
            expect(collectedIds, `dataset ${createdId} is missing from the listing`).toContain(createdId);
        }
    } finally {
        for (const id of createdIds) {
            await client.dataset(id).delete();
        }
    }
});

test('a created dataset is retrievable by id', async () => {
    const datasetName = getRandomResourceName('dataset');
    const createdDataset = await client.datasets().getOrCreate(datasetName);
    const datasetClient = client.dataset(createdDataset.id);

    try {
        const retrievedDataset = await datasetClient.get();

        expect(retrievedDataset?.id).toBe(createdDataset.id);
        expect(retrievedDataset?.name).toBe(datasetName);
    } finally {
        await datasetClient.delete();
    }
});

test('update() renames a dataset and the new name persists', async () => {
    const newName = getRandomResourceName('dataset-updated');
    const createdDataset = await createDataset();
    const datasetClient = client.dataset(createdDataset.id);

    try {
        const updatedDataset = await datasetClient.update({ name: newName });
        expect(updatedDataset.name).toBe(newName);
        expect(updatedDataset.id).toBe(createdDataset.id);

        const retrievedDataset = await datasetClient.get();
        expect(retrievedDataset?.name).toBe(newName);
    } finally {
        await datasetClient.delete();
    }
});

test('get() resolves to undefined for a deleted dataset', async () => {
    const createdDataset = await createDataset();
    const datasetClient = client.dataset(createdDataset.id);

    await datasetClient.delete();

    await expect(datasetClient.get()).resolves.toBeUndefined();
});

test('pushItems() stores items that listItems() then returns', async () => {
    const createdDataset = await createDataset();
    const datasetClient = client.dataset(createdDataset.id);

    try {
        const itemsToPush = [
            { id: 1, name: 'Item 1', value: 100 },
            { id: 2, name: 'Item 2', value: 200 },
            { id: 3, name: 'Item 3', value: 300 },
        ];
        await datasetClient.pushItems(itemsToPush);
        await waitForItemCount(createdDataset.id, 3);

        const itemsPage = await datasetClient.listItems();
        expect(itemsPage.count).toBe(3);
        expect(itemsPage.items).toEqual(itemsToPush);
    } finally {
        await datasetClient.delete();
    }
});

test('pushItems() accepts a pre-serialized JSON string', async () => {
    const createdDataset = await createDataset();
    const datasetClient = client.dataset(createdDataset.id);

    try {
        const itemsToPush = [
            { id: 1, name: 'first' },
            { id: 2, name: 'second' },
        ];
        await datasetClient.pushItems(JSON.stringify(itemsToPush));
        await waitForItemCount(createdDataset.id, 2);

        const itemsPage = await datasetClient.listItems();
        expect(itemsPage.items).toEqual(itemsToPush);
    } finally {
        await datasetClient.delete();
    }
});

test('pushItems() round-trips a payload large enough to be compressed', async () => {
    const createdDataset = await createDataset();
    const datasetClient = client.dataset(createdDataset.id);

    try {
        // Well above the 1 KiB threshold at which the client compresses the request body, so this
        // exercises the compressed-request path end to end against the API.
        const itemsToPush = Array.from({ length: 50 }, (_, index) => ({
            index,
            padding: 'x'.repeat(200),
        }));
        expect(Buffer.byteLength(JSON.stringify(itemsToPush))).toBeGreaterThan(1024);

        await datasetClient.pushItems(itemsToPush);
        await waitForItemCount(createdDataset.id, 50);

        const itemsPage = await datasetClient.listItems({ limit: 50 });
        expect(itemsPage.items).toEqual(itemsToPush);
    } finally {
        await datasetClient.delete();
    }
});

test('listItems() honours limit and offset', async () => {
    const createdDataset = await createDataset();
    const datasetClient = client.dataset(createdDataset.id);

    try {
        await datasetClient.pushItems(Array.from({ length: 10 }, (_, index) => ({ index, value: index * 10 })));
        await waitForItemCount(createdDataset.id, 10);

        const firstPage = await datasetClient.listItems({ limit: 5 });
        expect(firstPage.items).toHaveLength(5);
        expect(firstPage.count).toBe(5);
        expect(firstPage.limit).toBe(5);

        const secondPage = await datasetClient.listItems({ offset: 5, limit: 5 });
        expect(secondPage.items).toHaveLength(5);
        expect(secondPage.offset).toBe(5);

        expect(secondPage.items[0].index).not.toBe(firstPage.items[0].index);
    } finally {
        await datasetClient.delete();
    }
});

test('listItems() with fields returns only the requested fields', async () => {
    const createdDataset = await createDataset();
    const datasetClient = client.dataset(createdDataset.id);

    try {
        await datasetClient.pushItems([
            { id: 1, name: 'Item 1', value: 100, extra: 'data1' },
            { id: 2, name: 'Item 2', value: 200, extra: 'data2' },
        ]);
        await waitForItemCount(createdDataset.id, 2);

        const itemsPage = await datasetClient.listItems({ fields: ['id', 'name'] });
        expect(itemsPage.items).toHaveLength(2);

        for (const item of itemsPage.items) {
            expect(Object.keys(item).sort()).toEqual(['id', 'name']);
        }
    } finally {
        await datasetClient.delete();
    }
});

test('listItems() with desc reverses the item order', async () => {
    const createdDataset = await createDataset();
    const datasetClient = client.dataset(createdDataset.id);

    try {
        await datasetClient.pushItems(Array.from({ length: 5 }, (_, index) => ({ idx: index })));
        await waitForItemCount(createdDataset.id, 5);

        const ascendingPage = await datasetClient.listItems();
        const descendingPage = await datasetClient.listItems({ desc: true });

        expect(descendingPage.desc).toBe(true);
        expect(descendingPage.items.map((item) => item.idx)).toEqual(
            ascendingPage.items.map((item) => item.idx).reverse(),
        );
    } finally {
        await datasetClient.delete();
    }
});

test('listItems() applies the omit, clean, skipHidden and skipEmpty filters', async () => {
    const createdDataset = await createDataset();
    const datasetClient = client.dataset(createdDataset.id);

    try {
        // A mix of regular, hidden (`#`-prefixed) and empty items, so each filter has something to drop.
        const itemsToPush = [
            { id: 1, name: 'visible', '#secret': 'shh', extra: 'X' },
            {},
            { id: 2, name: 'also visible', '#secret': 'shh', extra: 'Y' },
        ];
        await datasetClient.pushItems(itemsToPush);
        await waitForItemCount(createdDataset.id, itemsToPush.length);

        const omitPage = await datasetClient.listItems({ omit: ['extra'] });
        for (const item of omitPage.items) {
            expect(item).not.toHaveProperty('extra');
        }

        const cleanPage = await datasetClient.listItems({ clean: true });
        for (const item of cleanPage.items) {
            expect(Object.keys(item).length).toBeGreaterThan(0);
            expect(item).not.toHaveProperty('#secret');
        }

        const skipHiddenPage = await datasetClient.listItems({ skipHidden: true });
        for (const item of skipHiddenPage.items) {
            expect(item).not.toHaveProperty('#secret');
        }

        const skipEmptyPage = await datasetClient.listItems({ skipEmpty: true });
        expect(skipEmptyPage.items).toHaveLength(itemsToPush.filter((item) => Object.keys(item).length > 0).length);
    } finally {
        await datasetClient.delete();
    }
});

test('listItems() is async-iterable and yields every item', async () => {
    const createdDataset = await createDataset();
    const datasetClient = client.dataset(createdDataset.id);

    try {
        await datasetClient.pushItems(Array.from({ length: 5 }, (_, index) => ({ index })));
        await waitForItemCount(createdDataset.id, 5);

        const collected: Record<string, any>[] = [];
        for await (const item of datasetClient.listItems()) {
            collected.push(item);
        }

        expect(collected.map((item) => item.index)).toEqual([0, 1, 2, 3, 4]);
    } finally {
        await datasetClient.delete();
    }
});

test('listItems() iteration pages through the dataset when chunkSize is smaller than the item count', async () => {
    const createdDataset = await createDataset();
    const datasetClient = client.dataset(createdDataset.id);

    try {
        await datasetClient.pushItems(Array.from({ length: 12 }, (_, index) => ({ idx: index })));
        await waitForItemCount(createdDataset.id, 12);

        // A chunk size of 5 forces three underlying requests for 12 items.
        const collected: Record<string, any>[] = [];
        for await (const item of datasetClient.listItems({ chunkSize: 5 })) {
            collected.push(item);
        }

        expect(collected).toHaveLength(12);
        // Ordering across several paginated reads is not strictly guaranteed mid-flight, so compare
        // the sorted view rather than positions.
        expect(collected.map((item) => item.idx).sort((a, b) => a - b)).toEqual([...Array(12).keys()]);
    } finally {
        await datasetClient.delete();
    }
});

test('listItems() iteration applies the fields filter to every yielded item', async () => {
    const createdDataset = await createDataset();
    const datasetClient = client.dataset(createdDataset.id);

    try {
        await datasetClient.pushItems(
            Array.from({ length: 3 }, (_, index) => ({ id: index, name: `item-${index}`, extra: 'drop-me' })),
        );
        await waitForItemCount(createdDataset.id, 3);

        const collected: Record<string, any>[] = [];
        for await (const item of datasetClient.listItems({ fields: ['id', 'name'] })) {
            collected.push(item);
        }

        expect(collected).toHaveLength(3);
        for (const item of collected) {
            expect(Object.keys(item).sort()).toEqual(['id', 'name']);
        }
    } finally {
        await datasetClient.delete();
    }
});

test('getStatistics() returns per-field statistics', async () => {
    const createdDataset = await createDataset();
    const datasetClient = client.dataset(createdDataset.id);

    try {
        await datasetClient.pushItems([
            { id: 1, name: 'Item 1' },
            { id: 2, name: 'Item 2' },
        ]);
        await waitForItemCount(createdDataset.id, 2);

        const statistics = await datasetClient.getStatistics();

        expect(statistics).toBeDefined();
        expect(statistics!.fieldStatistics).toBeTypeOf('object');
    } finally {
        await datasetClient.delete();
    }
});

describe('downloadItems()', () => {
    const items = [
        { id: 1, name: 'first' },
        { id: 2, name: 'second' },
    ];

    test.for([
        { format: DownloadItemsFormat.JSON, id: 'json' },
        { format: DownloadItemsFormat.JSONL, id: 'jsonl' },
        { format: DownloadItemsFormat.CSV, id: 'csv' },
        { format: DownloadItemsFormat.XLSX, id: 'xlsx' },
        { format: DownloadItemsFormat.XML, id: 'xml' },
        { format: DownloadItemsFormat.RSS, id: 'rss' },
        { format: DownloadItemsFormat.HTML, id: 'html' },
    ])('serializes the items to $id', async ({ format }) => {
        const createdDataset = await createDataset();
        const datasetClient = client.dataset(createdDataset.id);

        try {
            await datasetClient.pushItems(items);
            await waitForItemCount(createdDataset.id, 2);

            const downloaded = await datasetClient.downloadItems(format);
            expect(Buffer.isBuffer(downloaded)).toBe(true);
            expect(downloaded.length).toBeGreaterThan(0);

            if (format === DownloadItemsFormat.JSON) {
                expect(JSON.parse(downloaded.toString('utf8'))).toEqual(items);
            } else if (format === DownloadItemsFormat.XLSX) {
                // XLSX is a zip container, which always starts with the `PK` local file header.
                expect(downloaded.subarray(0, 2).toString('latin1')).toBe('PK');
            } else {
                // Every text format embeds the field values somewhere in its output.
                const decoded = downloaded.toString('utf8');
                expect(decoded).toContain('first');
                expect(decoded).toContain('second');
            }
        } finally {
            await datasetClient.delete();
        }
    });
});

test('createItemsPublicUrl() returns a signed, never-expiring URL that serves the items', async () => {
    const createdDataset = await createDataset();
    const datasetClient = client.dataset(createdDataset.id);

    try {
        const items = Array.from({ length: 3 }, (_, index) => ({ id: index, value: index * 10 }));
        await datasetClient.pushItems(items);
        await waitForItemCount(createdDataset.id, 3);

        const publicUrl = await datasetClient.createItemsPublicUrl();
        expect(publicUrl).toContain(createdDataset.id);
        expect(publicUrl).toContain('signature=');

        // Fetched with no credentials at all - the signature alone must authorize the read.
        const response = await fetch(publicUrl);
        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual(items);
    } finally {
        await datasetClient.delete();
    }
});

test('createItemsPublicUrl() passes through expiry and listing options', async () => {
    const createdDataset = await createDataset();
    const datasetClient = client.dataset(createdDataset.id);

    try {
        const publicUrl = await datasetClient.createItemsPublicUrl({
            expiresInSecs: 2000,
            limit: 10,
            offset: 0,
        });

        expect(publicUrl).toContain('signature=');
        expect(publicUrl).toContain('limit=10');
        expect(publicUrl).toContain('offset=0');

        const response = await fetch(publicUrl);
        expect(response.status).toBe(200);
    } finally {
        await datasetClient.delete();
    }
});
