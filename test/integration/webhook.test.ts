import { beforeAll, expect, test } from 'vitest';

import { WEBHOOK_EVENT_TYPES } from '@apify/consts';

import type { ApifyClient, Webhook, WebhookDispatch } from 'apify-client';

import { makeClient } from './_fixtures.js';
import { collectUntilPresent } from './_utils.js';

const HELLO_WORLD_ACTOR = 'apify/hello-world';

let client: ApifyClient;

beforeAll(() => {
    client = makeClient();
});

/**
 * Return the ID of an already-finished `hello-world` run.
 *
 * Binding webhooks to a finished run keeps them from ever firing on their own, since a completed run
 * emits no further events - the only dispatches are the ones a test asks for explicitly.
 */
async function getFinishedRunId(): Promise<string> {
    const runsPage = await client.actor(HELLO_WORLD_ACTOR).runs().list({ limit: 1, status: 'SUCCEEDED' });
    if (runsPage.items.length > 0) {
        return runsPage.items[0].id;
    }

    const run = await client.actor(HELLO_WORLD_ACTOR).call();
    return run.id;
}

async function createWebhook(runId: string, requestUrl = 'https://httpbin.org/post'): Promise<Webhook> {
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
    const runId = await getFinishedRunId();
    const createdWebhook = await createWebhook(runId);
    const webhookClient = client.webhook(createdWebhook.id);

    try {
        expect(createdWebhook.eventTypes).toContain(WEBHOOK_EVENT_TYPES.ACTOR_RUN_SUCCEEDED);
        expect(createdWebhook.condition).toEqual({ actorRunId: runId });

        const retrievedWebhook = await webhookClient.get();
        expect(retrievedWebhook?.id).toBe(createdWebhook.id);
    } finally {
        await webhookClient.delete();
    }
});

test('update() changes the request URL of a webhook', async () => {
    const runId = await getFinishedRunId();
    const createdWebhook = await createWebhook(runId);
    const webhookClient = client.webhook(createdWebhook.id);

    try {
        const updatedWebhook = await webhookClient.update({
            requestUrl: 'https://httpbin.org/anything',
            condition: { actorRunId: runId },
        });
        expect(updatedWebhook.requestUrl).toBe('https://httpbin.org/anything');
    } finally {
        await webhookClient.delete();
    }
});

test('test() creates a dispatch carrying a dummy payload', async () => {
    const runId = await getFinishedRunId();
    const createdWebhook = await createWebhook(runId);
    const webhookClient = client.webhook(createdWebhook.id);

    try {
        const dispatch = await webhookClient.test();

        expect(dispatch?.id).toBeTruthy();
    } finally {
        await webhookClient.delete();
    }
});

test('dispatches().list() returns the dispatches of a webhook', async () => {
    const runId = await getFinishedRunId();
    const createdWebhook = await createWebhook(runId);
    const webhookClient = client.webhook(createdWebhook.id);

    try {
        await webhookClient.test();

        const dispatches = await webhookClient.dispatches().list();
        expect(dispatches.items.length).toBeGreaterThan(0);
    } finally {
        await webhookClient.delete();
    }
});

test('dispatches().list() is async-iterable', async () => {
    const runId = await getFinishedRunId();
    const createdWebhook = await createWebhook(runId);
    const webhookClient = client.webhook(createdWebhook.id);

    try {
        await webhookClient.test();

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
    const runId = await getFinishedRunId();
    const createdWebhook = await createWebhook(runId);
    const webhookClient = client.webhook(createdWebhook.id);

    await webhookClient.delete();

    await expect(webhookClient.get()).resolves.toBeUndefined();
});

test('get() resolves to undefined for a webhook that never existed', async () => {
    await expect(client.webhook('NoNeXiStEnTwH').get()).resolves.toBeUndefined();
});

test('webhooks().list() iterates the user webhooks across pages', async () => {
    const runId = await getFinishedRunId();

    // Distinct request URLs, otherwise the API dedupes webhooks by event types, run ID and URL.
    const createdIds: string[] = [];
    for (let i = 0; i < 3; i++) {
        const webhook = await createWebhook(runId, `https://httpbin.org/post?n=${i}`);
        createdIds.push(webhook.id);
    }
    expect(new Set(createdIds).size, 'the API deduplicated the created webhooks').toBe(3);

    try {
        const collected = await collectUntilPresent(() => client.webhooks().list({ desc: true }), createdIds);
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
