import { beforeAll, expect, test } from 'vitest';

import type { ActorStoreList, ApifyClient } from 'apify-client';

import { makeClient } from './_fixtures.js';

let client: ApifyClient;

beforeAll(() => {
    client = makeClient();
});

test('store().list() returns public Actors', async () => {
    const actorsList = await client.store().list({ limit: 10 });

    expect(actorsList.items.length).toBeGreaterThan(0);
});

test('store().list() accepts a search term', async () => {
    const storePage = await client.store().list({ limit: 5, search: 'web scraper' });

    expect(Array.isArray(storePage.items)).toBe(true);
});

test('store().list() moves the window with offset', async () => {
    const firstPage = await client.store().list({ limit: 5, offset: 0 });
    const secondPage = await client.store().list({ limit: 5, offset: 5 });

    if (firstPage.items.length === 5 && secondPage.items.length > 0) {
        expect(secondPage.items[0].id).not.toBe(firstPage.items[0].id);
    }
});

test.for([
    { pricingModel: 'FREE' },
    { pricingModel: 'FLAT_PRICE_PER_MONTH' },
    { pricingModel: 'PRICE_PER_DATASET_ITEM' },
    { pricingModel: 'PAY_PER_EVENT' },
])('store().list() filters by the $pricingModel pricing model', async ({ pricingModel }) => {
    const page = await client.store().list({ limit: 10, pricingModel });

    expect(Array.isArray(page.items)).toBe(true);
    for (const actor of page.items) {
        if (actor.currentPricingInfo?.pricingModel) {
            expect(actor.currentPricingInfo.pricingModel).toBe(pricingModel);
        }
    }
});

test('store().list() filters by username', async () => {
    const page = await client.store().list({ limit: 10, username: 'apify' });

    expect(page.items.length).toBeGreaterThan(0);
    for (const actor of page.items) {
        expect(actor.username).toBe('apify');
    }
});

test('store().list() sorts by popularity', async () => {
    const page = await client.store().list({ limit: 10, sortBy: 'popularity' });

    expect(page.items.length).toBeGreaterThan(0);

    // Popularity is a composite ranking rather than a sort on one field, so only the directional
    // invariant holds: the top item has at least as many total users as the bottom one.
    const totalUsers = page.items
        .map((actor) => actor.stats.totalUsers)
        .filter((total): total is number => total !== undefined);
    expect(totalUsers.length, 'expected at least one item with populated stats.totalUsers').toBeGreaterThan(0);
    expect(totalUsers[0]).toBeGreaterThanOrEqual(totalUsers.at(-1)!);
});

test('store().list() parses every item on a full first page', async () => {
    const page = await client.store().list({ limit: 100 });

    expect(page.items.length, 'the public store returned an empty page').toBeGreaterThan(0);
    for (const item of page.items) {
        expect(item.id).toBeTruthy();
        expect(item.name).toBeTruthy();
        expect(item.username).toBeTruthy();
    }
});

test('store().list() is async-iterable and yields distinct Actors', async () => {
    const collected: ActorStoreList[] = [];
    for await (const actor of client.store().list({ limit: 20 })) {
        collected.push(actor);
    }

    expect(collected.length).toBeGreaterThan(0);
    expect(collected.length).toBeLessThanOrEqual(20);

    const seenIds = new Set<string>();
    for (const actor of collected) {
        expect(actor.id).toBeTruthy();
        expect(seenIds, `Actor ${actor.id} was yielded twice`).not.toContain(actor.id);
        seenIds.add(actor.id);
    }
});

test('store().list() iteration keeps the username filter across pages', async () => {
    const collected: ActorStoreList[] = [];
    for await (const actor of client.store().list({ limit: 15, username: 'apify' })) {
        collected.push(actor);
    }

    expect(collected.length).toBeGreaterThan(0);
    for (const actor of collected) {
        expect(actor.username).toBe('apify');
    }
});
