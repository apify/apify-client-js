import { beforeAll, expect, test } from 'vitest';

import type { Actor, ApifyClient, BuildCollectionClientListItem } from 'apify-client';
import { ActorSourceType } from 'apify-client';

import { makeClient } from './_fixtures.js';
import { getRandomResourceName } from './_utils.js';

const HELLO_WORLD_ACTOR = 'apify/hello-world';

/**
 * Apify-owned Actor whose `latest` build sets `minMemoryMbytes: 128`, well below the 256 MB the spec
 * used to require. It also publishes `actorDefinition.version: "0.0.1"`, which exercises the
 * semver-triplet version pattern.
 */
const SMALL_MIN_MEMORY_ACTOR = 'apify/instagram-profile-scraper';

/**
 * Apify-owned Actor whose build list includes entries with `meta.origin: "CI"` from the internal CI
 * pipeline. CI builds are infrequent and rotate out of the most recent window, so the listing has to
 * page deep with `desc: true` to find one.
 */
const CI_ORIGIN_ACTOR = 'apify/cheerio-scraper';

/** The listing endpoint returns `actId`, but `BuildCollectionClientListItem` does not declare it yet. */
type ListItemWithActorId = BuildCollectionClientListItem & { actId?: string };

let client: ApifyClient;

beforeAll(() => {
    client = makeClient();
});

/**
 * Return a stable build id from `actor.taggedBuilds`, preferring the `latest` tag.
 *
 * Reading the first entry instead would depend on whichever tag the API happens to serialize first.
 */
function pickBuildId(actor: Actor): string {
    const taggedBuilds = actor.taggedBuilds ?? {};
    const buildId =
        taggedBuilds.latest?.buildId ?? Object.values(taggedBuilds).find((build) => build?.buildId)?.buildId;

    expect(buildId, `${actor.username}/${actor.name} has no tagged build with a build id`).toBeTruthy();
    return buildId!;
}

async function firstHelloWorldBuild(limit = 1): Promise<BuildCollectionClientListItem[]> {
    const buildsPage = await client.actor(HELLO_WORLD_ACTOR).builds().list({ limit });
    expect(buildsPage.items.length, `${HELLO_WORLD_ACTOR} should have at least one build`).toBeGreaterThan(0);
    return buildsPage.items;
}

test('builds().list() returns the builds of a public Actor', async () => {
    const buildsPage = await client.actor(HELLO_WORLD_ACTOR).builds().list({ limit: 10 });

    expect(buildsPage.items.length).toBeGreaterThan(0);
    const firstBuild = buildsPage.items[0] as ListItemWithActorId;
    expect(firstBuild.id).toBeTruthy();
    expect(firstBuild.actId).toBeTruthy();
});

test('get() returns the build that the listing pointed at', async () => {
    const [listedBuild] = await firstHelloWorldBuild();

    const build = await client.build(listedBuild.id).get();

    expect(build?.id).toBe(listedBuild.id);
    expect(build?.actId).toBeTruthy();
    expect(build?.status).toBeTruthy();
});

test('get() resolves to undefined for a build that does not exist', async () => {
    await expect(client.build('NoNeXiStEnTbUiLd').get()).resolves.toBeUndefined();
});

test('builds().list() at the user level returns the builds of the test user', async () => {
    const buildsPage = await client.builds().list({ limit: 10 });

    expect(Array.isArray(buildsPage.items)).toBe(true);
    for (const build of buildsPage.items) {
        expect(build.id).toBeTruthy();
    }
});

test('waitForFinish() returns immediately for a build that is already finished', async () => {
    const builds = await firstHelloWorldBuild(5);
    const finished = builds.find((item) => item.status === 'SUCCEEDED') ?? builds[0];

    const build = await client.build(finished.id).waitForFinish({ waitSecs: 5 });

    expect(build.id).toBe(finished.id);
});

test('getOpenApiDefinition() returns the OpenAPI document of a build', async () => {
    const [listedBuild] = await firstHelloWorldBuild();

    const openApiDefinition = await client.build(listedBuild.id).getOpenApiDefinition();

    expect(openApiDefinition).toBeTypeOf('object');
    expect(openApiDefinition.openapi).toBeTruthy();
});

test('builds().list() is async-iterable and yields the builds of an Actor', async () => {
    const collected: BuildCollectionClientListItem[] = [];
    for await (const build of client.actor(HELLO_WORLD_ACTOR).builds().list({ limit: 5 })) {
        collected.push(build);
    }

    expect(collected.length).toBeGreaterThanOrEqual(1);
    for (const build of collected as ListItemWithActorId[]) {
        expect(build.id).toBeTruthy();
        expect(build.actId).toBeTruthy();
    }
});

test('builds().list() at the user level is async-iterable', async () => {
    const collected: BuildCollectionClientListItem[] = [];
    for await (const build of client.builds().list({ limit: 5 })) {
        collected.push(build);
    }

    expect(collected.length, 'the test account should have at least one build').toBeGreaterThanOrEqual(1);
    for (const build of collected) {
        expect(build.id).toBeTruthy();
    }
});

test('a build can be aborted and deleted on an Actor the test user owns', async () => {
    const createdActor = await client.actors().create({
        name: getRandomResourceName('actor'),
        title: 'Test Actor for Build Delete',
        versions: [
            {
                versionNumber: '0.1',
                sourceType: ActorSourceType.SourceFiles,
                buildTag: 'beta',
                sourceFiles: [{ name: 'main.js', format: 'TEXT', content: 'console.log("Hello v0.1")' }],
            },
            {
                versionNumber: '0.2',
                sourceType: ActorSourceType.SourceFiles,
                buildTag: 'latest',
                sourceFiles: [{ name: 'main.js', format: 'TEXT', content: 'console.log("Hello v0.2")' }],
            },
        ],
    });
    const actorClient = client.actor(createdActor.id);

    try {
        // Two builds are needed: the default build cannot be deleted.
        const firstBuild = await actorClient.build('0.1');
        const firstBuildClient = client.build(firstBuild.id);
        await firstBuildClient.waitForFinish();

        const secondBuild = await actorClient.build('0.2');
        const secondBuildClient = client.build(secondBuild.id);

        const finishedBuild = await secondBuildClient.waitForFinish();
        expect(['SUCCEEDED', 'FAILED']).toContain(finishedBuild.status);

        // Aborting an already finished build returns it in its current state rather than failing.
        const abortedBuild = await secondBuildClient.abort();
        expect(['SUCCEEDED', 'FAILED']).toContain(abortedBuild.status);

        await firstBuildClient.delete();

        await expect(firstBuildClient.get()).resolves.toBeUndefined();
    } finally {
        await actorClient.delete();
    }
});

test('get() returns an actorDefinition whose minMemoryMbytes may be below 256', async () => {
    const actor = await client.actor(SMALL_MIN_MEMORY_ACTOR).get();
    expect(actor).toBeDefined();

    const build = await client.build(pickBuildId(actor!)).get();
    expect(build?.actorDefinition, 'expected an actorDefinition on a SUCCEEDED build').toBeDefined();

    // Fixture-drift guard: this is only meaningful while the chosen build carries a value below the
    // old 256 MB floor.
    const { minMemoryMbytes } = build!.actorDefinition!;
    expect(
        minMemoryMbytes,
        `${SMALL_MIN_MEMORY_ACTOR} latest build has minMemoryMbytes=${minMemoryMbytes} (expected <256). ` +
            'Pick a different fixture to keep this test meaningful.',
    ).toBeLessThan(256);
});

test('get() returns an actorDefinition version in semver-triplet form', async () => {
    const actor = await client.actor(SMALL_MIN_MEMORY_ACTOR).get();
    expect(actor).toBeDefined();

    const build = await client.build(pickBuildId(actor!)).get();
    expect(build?.actorDefinition).toBeDefined();

    // Fixture-drift guard: only meaningful while the chosen build's version carries more than one dot.
    const { version } = build!.actorDefinition!;
    expect(
        version.split('.').length - 1,
        `${SMALL_MIN_MEMORY_ACTOR} no longer publishes a multi-dot version (got ${version}) - ` +
            'pick a different fixture to keep this test meaningful.',
    ).toBeGreaterThanOrEqual(2);
});

test('builds().list() returns builds whose meta.origin is CI', async () => {
    const builds = await client.actor(CI_ORIGIN_ACTOR).builds().list({ limit: 100, desc: true });
    expect(builds.items.length, `${CI_ORIGIN_ACTOR} should have builds`).toBeGreaterThan(0);

    // Fixture-drift guard: only meaningful while the page actually contains a CI-origin build.
    const ciOriginBuilds = builds.items.filter((build) => build.meta?.origin === 'CI');
    expect(
        ciOriginBuilds.length,
        `${CI_ORIGIN_ACTOR}: no builds with meta.origin === "CI" in the most recent 100. CI builds may ` +
            'have rotated out of the window - pick a different Actor or paginate deeper.',
    ).toBeGreaterThan(0);
});
