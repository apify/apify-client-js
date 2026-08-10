import { beforeAll, expect, test } from 'vitest';

import type { ApifyClient } from 'apify-client';

import { makeClient } from './_fixtures.js';

const HELLO_WORLD_ACTOR = 'apify/hello-world';

let client: ApifyClient;

beforeAll(() => {
    client = makeClient();
});

test('get() returns the log of an Actor run as a string', async () => {
    const run = await client.actor(HELLO_WORLD_ACTOR).call();
    const runClient = client.run(run.id);

    try {
        const log = await runClient.log().get();

        expect(typeof log).toBe('string');
        expect(log!.length).toBeGreaterThan(0);
    } finally {
        await runClient.delete();
    }
});

test('get({ raw: true }) returns the log without the client-side processing', async () => {
    const run = await client.actor(HELLO_WORLD_ACTOR).call();
    const runClient = client.run(run.id);

    try {
        const rawLog = await runClient.log().get({ raw: true });

        expect(typeof rawLog).toBe('string');
        expect(rawLog!.length).toBeGreaterThan(0);
    } finally {
        await runClient.delete();
    }
});

test('get() returns the log of a build', async () => {
    const buildsPage = await client.actor(HELLO_WORLD_ACTOR).builds().list({ limit: 1 });
    expect(buildsPage.items.length, `${HELLO_WORLD_ACTOR} should have at least one build`).toBeGreaterThan(0);

    // A build log can legitimately be empty, so this only pins that the endpoint is reachable and
    // that the client hands back a string rather than an error.
    const log = await client.build(buildsPage.items[0].id).log().get();

    expect(log === undefined || typeof log === 'string').toBe(true);
});

test('stream() returns a readable stream of the run log', async () => {
    const run = await client.actor(HELLO_WORLD_ACTOR).call();
    const runClient = client.run(run.id);

    try {
        const stream = await runClient.log().stream();
        expect(stream, 'stream() returned nothing in a Node.js environment').toBeDefined();

        const chunks: Buffer[] = [];
        for await (const chunk of stream!) {
            chunks.push(Buffer.from(chunk));
        }

        expect(Buffer.concat(chunks).length).toBeGreaterThan(0);
    } finally {
        await runClient.delete();
    }
});
