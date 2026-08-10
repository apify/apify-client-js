import { afterAll, beforeAll, expect, test } from 'vitest';

import { WEBHOOK_EVENT_TYPES } from '@apify/consts';

import type { ApifyClient, Webhook, WebhookDispatch } from 'apify-client';

import { makeClient } from './_fixtures.js';
import { collectUntilPresent, pollUntilCondition } from './_utils.js';

const HELLO_WORLD_ACTOR = 'apify/hello-world';

let client: ApifyClient;

/**
 * A finished `hello-world` run owned by this file, shared by every webhook it creates.
 *
 * Binding webhooks to a finished run keeps them from ever firing on their own, since a completed run
 * emits no further events - the only dispatches are the ones a test asks for explicitly. The run is
 * created here rather than borrowed from the listing, because the other test files start and delete
 * runs of the same Actor in parallel and a borrowed one can disappear mid-test.
 */
let finishedRunId: string;

beforeAll(async () => {
    client = makeClient();
    const run = await client.actor(HELLO_WORLD_ACTOR).call();
    finishedRunId = run.id;
});

afterAll(async () => {
    await client.run(finishedRunId).delete();
});

async function createWebhook(runId: string, requestUrl = 'https://example.com/webhook'): Promise<Webhook> {
    return client.webhooks().create({
        eventTypes: [WEBHOOK_EVENT_TYPES.ACTOR_RUN_SUCCEEDED],
        requestUrl,
        condition: { actorRunId: runId },
        isAdHoc: true,
    });
}

test('webhooks().list() returns a page of the user webhooks', async () => {
    const webhooksPage = await client.webhooks().list({ limit: 10 });

    expect(Array.isArray(webhooksPage.items)).toBe(true);
    expect(webhooksPage.limit).toBe(10);
});

test('webhooks().list() honours limit and offset', async () => {
    const webhooksPage = await client.webhooks().list({ limit: 5, offset: 0 });

    expect(Array.isArray(webhooksPage.items)).toBe(true);
    expect(webhooksPage.limit).toBe(5);
    expect(webhooksPage.offset).toBe(0);
});

test('a created webhook is retrievable by id', async () => {
    const createdWebhook = await createWebhook(finishedRunId);
    const webhookClient = client.webhook(createdWebhook.id);

    try {
        expect(createdWebhook.eventTypes).toContain(WEBHOOK_EVENT_TYPES.ACTOR_RUN_SUCCEEDED);
        expect(createdWebhook.condition).toEqual({ actorRunId: finishedRunId });

        const retrievedWebhook = await webhookClient.get();
        expect(retrievedWebhook?.id).toBe(createdWebhook.id);
    } finally {
        await webhookClient.delete();
    }
});

test('update() changes the request URL of a webhook', async () => {
    const createdWebhook = await createWebhook(finishedRunId);
    const webhookClient = client.webhook(createdWebhook.id);

    try {
        const updatedWebhook = await webhookClient.update({
            requestUrl: 'https://example.com/webhook-updated',
            condition: { actorRunId: finishedRunId },
        });
        expect(updatedWebhook.requestUrl).toBe('https://example.com/webhook-updated');
    } finally {
        await webhookClient.delete();
    }
});

test('test() creates a dispatch carrying a dummy payload', async () => {
    const createdWebhook = await createWebhook(finishedRunId);
    const webhookClient = client.webhook(createdWebhook.id);

    try {
        const dispatch = await webhookClient.test();

        expect(dispatch?.id).toBeTruthy();
    } finally {
        await webhookClient.delete();
    }
});

test('dispatches().list() returns the dispatches of a webhook', async () => {
    const createdWebhook = await createWebhook(finishedRunId);
    const webhookClient = client.webhook(createdWebhook.id);

    try {
        await webhookClient.test();

        // The dispatch is created asynchronously, so it is not guaranteed to be listed right away.
        const dispatches = await pollUntilCondition(
            () => webhookClient.dispatches().list({ limit: 10 }),
            (page) => page.items.length > 0,
        );
        expect(dispatches.items.length).toBeGreaterThan(0);
    } finally {
        await webhookClient.delete();
    }
});

test('dispatches().list() is async-iterable', async () => {
    const createdWebhook = await createWebhook(finishedRunId);
    const webhookClient = client.webhook(createdWebhook.id);

    try {
        await webhookClient.test();

        await pollUntilCondition(
            () => webhookClient.dispatches().list({ limit: 10 }),
            (page) => page.items.length > 0,
        );

        const collected: WebhookDispatch[] = [];
        for await (const dispatch of webhookClient.dispatches().list({ limit: 10 })) {
            collected.push(dispatch);
        }

        expect(collected.length).toBeGreaterThanOrEqual(1);
        for (const dispatch of collected) {
            expect(dispatch.id).toBeTruthy();
        }
    } finally {
        await webhookClient.delete();
    }
});

test('get() resolves to undefined for a deleted webhook', async () => {
    const createdWebhook = await createWebhook(finishedRunId);
    const webhookClient = client.webhook(createdWebhook.id);

    await webhookClient.delete();

    await expect(webhookClient.get()).resolves.toBeUndefined();
});

test('get() resolves to undefined for a webhook that never existed', async () => {
    await expect(client.webhook('NoNeXiStEnTwH').get()).resolves.toBeUndefined();
});

test('webhooks().list() iterates the user webhooks across pages', async () => {
    // Distinct request URLs, otherwise the API dedupes webhooks by event types, run ID and URL.
    const createdIds: string[] = [];
    for (let i = 0; i < 3; i++) {
        const webhook = await createWebhook(finishedRunId, `https://example.com/webhook?n=${i}`);
        createdIds.push(webhook.id);
    }

    try {
        expect(new Set(createdIds).size, 'the API deduplicated the created webhooks').toBe(3);

        const collected = await collectUntilPresent(
            () => client.webhooks().list({ desc: true, limit: 50 }),
            createdIds,
        );
        const collectedIds = new Set(collected.map((item) => item.id));

        for (const createdId of createdIds) {
            expect(collectedIds, `webhook ${createdId} is missing from the listing`).toContain(createdId);
        }
    } finally {
        for (const id of createdIds) {
            await client.webhook(id).delete();
        }
    }
});
