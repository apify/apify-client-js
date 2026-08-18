import { beforeAll, expect, test } from 'vitest';

import type { ApifyClient, WebhookDispatch } from 'apify-client';

import { makeClient } from './_fixtures.js';

let client: ApifyClient;

beforeAll(() => {
    client = makeClient();
});

test('webhookDispatches().list() returns a page of the user dispatches', async () => {
    const dispatchesPage = await client.webhookDispatches().list({ limit: 10 });

    expect(Array.isArray(dispatchesPage.items)).toBe(true);
    expect(dispatchesPage.limit).toBe(10);
});

test('webhookDispatch().get() returns the dispatch a listing pointed at', async () => {
    const dispatchesPage = await client.webhookDispatches().list({ limit: 1 });

    if (dispatchesPage.items.length > 0) {
        const dispatchId = dispatchesPage.items[0].id;
        const dispatch = await client.webhookDispatch(dispatchId).get();
        expect(dispatch?.id).toBe(dispatchId);
    } else {
        // The account may have no dispatches at all, in which case there is only the negative case to check.
        await expect(client.webhookDispatch('non-existent-id').get()).resolves.toBeUndefined();
    }
});

test('webhookDispatches().list() orders by createdAt and moves the window with offset', async () => {
    const page = await client.webhookDispatches().list({ limit: 5, offset: 0, desc: true });
    expect(page.items.length).toBeLessThanOrEqual(5);

    const createdAts = page.items.map((dispatch) => dispatch.createdAt.getTime());
    expect(createdAts).toEqual([...createdAts].sort((a, b) => b - a));

    // Ascending order for the offset check, so dispatches created by tests running in parallel cannot
    // shift the pages between the two calls.
    const ascPage = await client.webhookDispatches().list({ limit: 5, offset: 0, desc: false });
    if (ascPage.items.length === 5) {
        const nextPage = await client.webhookDispatches().list({ limit: 5, offset: 5, desc: false });
        if (nextPage.items.length > 0) {
            expect(nextPage.items[0].id).not.toBe(ascPage.items[0].id);
        }
    }
});

test('webhookDispatches().list() is async-iterable and respects the limit', async () => {
    const collected: WebhookDispatch[] = [];
    for await (const dispatch of client.webhookDispatches().list({ limit: 5 })) {
        collected.push(dispatch);
    }

    expect(collected.length).toBeLessThanOrEqual(5);
    for (const dispatch of collected) {
        expect(dispatch.id).toBeTruthy();
    }
});
