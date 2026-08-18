import { afterEach, beforeAll, expect, test, vi } from 'vitest';

import type {
    Actor,
    ActorChargeEvent,
    ActorCollectionListItem,
    ApifyClient,
    PricePerDatasetItemActorPricingInfo,
    PricePerEventActorPricingInfo,
} from 'apify-client';
import { ActorListSortBy, ActorSourceType } from 'apify-client';

import { makeClient } from './_fixtures.js';
import { ANY_RUN_STATUS, getRandomResourceName, NO_LOG_REDIRECT } from './_utils.js';

const HELLO_WORLD_ACTOR = 'apify/hello-world';
const WEB_SCRAPER_ACTOR = 'apify/web-scraper';

/**
 * Actor carrying pricing-info entries for every non-trivial variant: `FLAT_PRICE_PER_MONTH`, both flat
 * and tiered `PRICE_PER_DATASET_ITEM`, and tiered `PAY_PER_EVENT` with `isPrimaryEvent` /
 * `isOneTimeEvent` fields.
 */
const ALL_PRICING_VARIANTS_ACTOR = 'apify/facebook-pages-scraper';

let client: ApifyClient;

beforeAll(() => {
    client = makeClient();
});

afterEach(() => {
    vi.restoreAllMocks();
});

/** Create a throwaway Actor. Nothing here is ever built, so it costs no compute. */
async function createActor(options: { title?: string } = {}): Promise<Actor> {
    return client.actors().create({
        name: getRandomResourceName('actor'),
        ...(options.title ? { title: options.title } : {}),
    });
}

/**
 * The listing endpoint returns `stats`, but `ActorCollectionListItem` does not declare it yet. Read it
 * through this shape so the sorting assertions stay honest until the type catches up.
 */
type ListItemWithStats = ActorCollectionListItem & { stats?: { lastRunStartedAt?: Date } };

/**
 * Sort keys of the Actors in a listing that have actually run.
 *
 * An Actor that never ran carries no `lastRunStartedAt`, and where the API places those in the ordering
 * is not part of the client's contract. Compare only the timestamps that are present, the same way the
 * run feed assertions do.
 */
function lastRunSortKeys(items: ActorCollectionListItem[]): number[] {
    return (items as ListItemWithStats[])
        .map((item) => item.stats?.lastRunStartedAt?.getTime())
        .filter((value): value is number => value !== undefined);
}

test('get() resolves a public Actor by its full name', async () => {
    const actor = await client.actor(WEB_SCRAPER_ACTOR).get();

    expect(actor?.id).toBeTruthy();
    expect(actor?.name).toBe('web-scraper');
    expect(actor?.username).toBe('apify');
});

test('get() resolves apify/hello-world, the Actor the run-based tests rely on', async () => {
    const actor = await client.actor(HELLO_WORLD_ACTOR).get();

    expect(actor?.name).toBe('hello-world');
    expect(actor?.username).toBe('apify');
});

test('get() resolves to undefined for an Actor that does not exist', async () => {
    await expect(client.actor('this-actor/does-not-exist-anywhere').get()).resolves.toBeUndefined();
});

test('actors().list({ my: true }) returns a page of Actors', async () => {
    const actorsPage = await client.actors().list({ my: true, limit: 10 });

    expect(Array.isArray(actorsPage.items)).toBe(true);
    expect(actorsPage.items.length).toBeLessThanOrEqual(10);
});

test('actors().list() honours limit and offset', async () => {
    const actorsPage = await client.actors().list({ limit: 5, offset: 0 });

    expect(Array.isArray(actorsPage.items)).toBe(true);
    expect(actorsPage.items.length).toBeLessThanOrEqual(5);
    expect(actorsPage.limit).toBe(5);
    expect(actorsPage.offset).toBe(0);
});

test('actors().list() sorted by last run, descending, comes back in that order', async () => {
    const actorsPage = await client
        .actors()
        .list({ limit: 10, desc: true, sortBy: ActorListSortBy.LAST_RUN_STARTED_AT });

    // Assert monotonicity rather than comparing against a locally re-sorted copy: the API and a local
    // sort may break ties on identical timestamps differently, which says nothing about the client.
    const keys = lastRunSortKeys(actorsPage.items);
    expect(keys).toEqual([...keys].sort((a, b) => b - a));
});

test('actors().list() sorted by last run, ascending, comes back in that order', async () => {
    const actorsPage = await client
        .actors()
        .list({ limit: 10, desc: false, sortBy: ActorListSortBy.LAST_RUN_STARTED_AT });

    const keys = lastRunSortKeys(actorsPage.items);
    expect(keys).toEqual([...keys].sort((a, b) => a - b));
});

test('actors().list() is async-iterable and yields the user Actors', async () => {
    const collected: ActorCollectionListItem[] = [];
    for await (const actor of client.actors().list({ my: true, limit: 10 })) {
        collected.push(actor);
    }

    expect(collected.length, 'the test account should own at least one Actor').toBeGreaterThanOrEqual(1);
    for (const actor of collected) {
        expect(actor.id).toBeTruthy();
    }
});

test('an Actor can be created, updated and deleted, and each step is visible on a re-read', async () => {
    const actorName = getRandomResourceName('actor');
    const createdActor = await client.actors().create({
        name: actorName,
        title: 'Test Actor',
        description: 'Test actor for integration tests',
        versions: [
            {
                versionNumber: '0.1',
                sourceType: ActorSourceType.SourceFiles,
                buildTag: 'latest',
                sourceFiles: [{ name: 'main.js', format: 'TEXT', content: 'console.log("Hello")' }],
            },
        ],
    });
    expect(createdActor.id).toBeTruthy();
    expect(createdActor.name).toBe(actorName);

    const actorClient = client.actor(createdActor.id);

    try {
        // Only title and description - changing defaultRunOptions requires the Actor to have a build.
        const updatedActor = await actorClient.update({
            title: 'Updated Test Actor',
            description: 'Updated description',
        });
        expect(updatedActor.title).toBe('Updated Test Actor');
        expect(updatedActor.description).toBe('Updated description');

        const retrievedActor = await actorClient.get();
        expect(retrievedActor?.title).toBe('Updated Test Actor');
    } finally {
        await actorClient.delete();
    }

    await expect(actorClient.get()).resolves.toBeUndefined();
});

test('update() sets the categories and SEO fields, and they persist', async () => {
    const createdActor = await createActor({ title: 'Test Actor for Categories' });
    const actorClient = client.actor(createdActor.id);

    try {
        const updated = await actorClient.update({
            categories: ['MARKETING'],
            seoTitle: 'SEO Test Title',
            seoDescription: 'SEO Test Description',
        });

        expect(updated.categories).toEqual(['MARKETING']);
        expect(updated.seoTitle).toBe('SEO Test Title');
        expect(updated.seoDescription).toBe('SEO Test Description');
    } finally {
        await actorClient.delete();
    }
});

test('defaultBuild() returns a client for a build that can then be read', async () => {
    const buildClient = await client.actor(HELLO_WORLD_ACTOR).defaultBuild();

    const build = await buildClient.get();
    expect(build?.id).toBeTruthy();
    expect(build?.status).toBeTruthy();
});

test('defaultBuild() accepts waitForFinish and still returns a readable build', async () => {
    const buildClient = await client.actor(HELLO_WORLD_ACTOR).defaultBuild({ waitForFinish: 1 });

    const build = await buildClient.get();
    expect(build?.id).toBeTruthy();
});

test('lastRun() resolves to a readable run', async () => {
    const actorClient = client.actor(HELLO_WORLD_ACTOR);
    const run = await actorClient.call(undefined, NO_LOG_REDIRECT);

    try {
        const lastRun = await actorClient.lastRun().get();

        expect(lastRun?.id).toBeTruthy();
    } finally {
        await client.run(run.id).delete();
    }
});

test('validateInput() accepts an empty input for apify/hello-world', async () => {
    await expect(client.actor(HELLO_WORLD_ACTOR).validateInput({})).resolves.toBe(true);
});

test('start() applies the build, memory and timeout overrides it is given', async () => {
    const run = await client
        .actor(HELLO_WORLD_ACTOR)
        .start(undefined, { build: 'latest', memory: 256, timeout: 120, waitForFinish: 60 });
    const runClient = client.run(run.id);

    try {
        expect(run.id).toBeTruthy();
        expect(run.options.memoryMbytes).toBe(256);
        expect(run.options.timeoutSecs).toBe(120);
        expect(ANY_RUN_STATUS).toContain(run.status);
    } finally {
        // A run that is still executing cannot be deleted.
        await runClient.waitForFinish();
        await runClient.delete();
    }
});

test('start() passes a run input through, and the run succeeds with it', async () => {
    const run = await client.actor(HELLO_WORLD_ACTOR).start({ message: 'integration-test-input' });
    const runClient = client.run(run.id);

    try {
        expect(run.id).toBeTruthy();

        const finishedRun = await runClient.waitForFinish();
        expect(finishedRun.status).toBe('SUCCEEDED');
    } finally {
        await runClient.delete();
    }
});

test('call() waits for the run and resolves once it has SUCCEEDED', async () => {
    const run = await client
        .actor(HELLO_WORLD_ACTOR)
        .call({ message: 'integration-test' }, { build: 'latest', memory: 256, ...NO_LOG_REDIRECT });

    try {
        expect(run.status).toBe('SUCCEEDED');
        expect(run.options.memoryMbytes).toBe(256);
    } finally {
        await client.run(run.id).delete();
    }
});

test('webhooks().list() is empty for a newly created Actor', async () => {
    const createdActor = await createActor({ title: 'Test Actor for Webhooks' });
    const actorClient = client.actor(createdActor.id);

    try {
        const webhooksPage = await actorClient.webhooks().list();

        expect(webhooksPage.items).toHaveLength(0);
    } finally {
        await actorClient.delete();
    }
});

/**
 * The tiered pricing shapes below are not declared on the v3 types yet, so the assertions read them
 * through these local shapes. Pinning the field names here is what would catch an alias being
 * dropped once the types do declare them.
 */
type TieredPricePerDatasetItem = PricePerDatasetItemActorPricingInfo & {
    tieredPricing?: Record<string, { tieredPricePerUnitUsd: number }>;
};

type TieredChargeEvent = ActorChargeEvent & {
    eventTieredPricingUsd?: Record<string, unknown>;
    isPrimaryEvent?: boolean;
    isOneTimeEvent?: boolean;
};

test('get() returns tiered PRICE_PER_DATASET_ITEM pricing with its tiers intact', async () => {
    const actor = await client.actor(ALL_PRICING_VARIANTS_ACTOR).get();
    expect(actor?.pricingInfos?.length).toBeGreaterThan(0);

    const tieredEntries = (actor!.pricingInfos ?? [])
        .filter((info): info is TieredPricePerDatasetItem => info.pricingModel === 'PRICE_PER_DATASET_ITEM')
        .filter((info) => info.tieredPricing !== undefined);

    expect(
        tieredEntries.length,
        `${ALL_PRICING_VARIANTS_ACTOR} should have at least one tiered PRICE_PER_DATASET_ITEM entry - ` +
            'pick a different Actor if its pricing changed.',
    ).toBeGreaterThan(0);

    // Fixture-drift guard: tiered pricing is only meaningful with more than one tier and with tiers
    // that actually differ in price. A degenerate single-tier or all-zero payload would silently look
    // like flat pricing and the assertion above would keep passing.
    for (const entry of tieredEntries) {
        const tiers = Object.values(entry.tieredPricing!);
        expect(
            tiers.length,
            `${ALL_PRICING_VARIANTS_ACTOR} tiered PPD entry has only ${tiers.length} tier(s); expected ` +
                'multiple tiers (e.g. FREE/BRONZE/SILVER/GOLD/PLATINUM/DIAMOND).',
        ).toBeGreaterThanOrEqual(2);

        const distinctPrices = new Set(tiers.map((tier) => tier.tieredPricePerUnitUsd));
        expect(
            distinctPrices.size,
            `${ALL_PRICING_VARIANTS_ACTOR} tiered PPD entry has all-identical prices; tiers should differ.`,
        ).toBeGreaterThanOrEqual(2);
    }
});

test('get() returns tiered PAY_PER_EVENT charge events with their flags intact', async () => {
    const actor = await client.actor(ALL_PRICING_VARIANTS_ACTOR).get();
    expect(actor?.pricingInfos?.length).toBeGreaterThan(0);

    const tieredEvents = (actor!.pricingInfos ?? [])
        .filter((info): info is PricePerEventActorPricingInfo => info.pricingModel === 'PAY_PER_EVENT')
        .flatMap((info) => Object.values(info.pricingPerEvent.actorChargeEvents ?? {}) as TieredChargeEvent[])
        .filter((event) => event.eventTieredPricingUsd !== undefined);

    expect(
        tieredEvents.length,
        `${ALL_PRICING_VARIANTS_ACTOR} should have at least one tiered PAY_PER_EVENT event - ` +
            'pick a different Actor if its pricing changed.',
    ).toBeGreaterThan(0);

    expect(
        tieredEvents.some((event) => event.isPrimaryEvent === true),
        `${ALL_PRICING_VARIANTS_ACTOR}: no tiered PPE event has isPrimaryEvent === true.`,
    ).toBe(true);
    expect(
        tieredEvents.some((event) => event.isOneTimeEvent !== undefined),
        `${ALL_PRICING_VARIANTS_ACTOR}: no tiered PPE event has isOneTimeEvent populated.`,
    ).toBe(true);
});

test('call({ log: "default" }) streams the run log to the console while the run executes', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const run = await client.actor(HELLO_WORLD_ACTOR).call(undefined, { log: 'default' });

    try {
        expect(run.status).toBe('SUCCEEDED');

        // The default redirect logger prefixes every line it emits with `<actor name> runId:<id> -> `.
        const lines = logSpy.mock.calls.map(([line]) => String(line));
        expect(
            lines.filter((line) => line.includes(`runId:${run.id}`)),
            'no log line was redirected from the run',
        ).not.toHaveLength(0);
    } finally {
        await client.run(run.id).delete();
    }
});
