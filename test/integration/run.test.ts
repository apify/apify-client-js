import { beforeAll, expect, test } from 'vitest';

import { Log, LogLevel } from '@apify/log';

import type { ActorRun, ActorRunListItem, ApifyClient, RunClient } from 'apify-client';
import { ApifyApiError } from 'apify-client';

import { makeClient } from './_fixtures.js';
import { pollUntilCondition } from './_utils.js';

const HELLO_WORLD_ACTOR = 'apify/hello-world';

let client: ApifyClient;

beforeAll(() => {
    client = makeClient();
});

/**
 * Wait until the run has actually left `READY`, i.e. its container has started.
 *
 * Startup time varies by orders of magnitude - a second when the platform is warm, close to a minute
 * when it is not - so this backs off instead of polling at a fixed rate.
 */
async function waitUntilStarted(runClient: RunClient): Promise<ActorRun | undefined> {
    return pollUntilCondition(
        async () => runClient.get(),
        (run) => run !== undefined && run.status !== 'READY',
        { timeoutSecs: 120, backoffFactor: 2 },
    );
}

/** `'already finished'` errors are expected in the races below; anything else is a real failure. */
function rethrowUnlessAlreadyFinished(err: unknown): void {
    if (!(err instanceof ApifyApiError) || !err.message.includes('already finished')) throw err;
}

test('runs().list() filters by a single status and by a list of statuses', async () => {
    const createdRunIds: string[] = [];

    try {
        // One run of each status the filter is about to ask for.
        const actorClient = client.actor(HELLO_WORLD_ACTOR);
        createdRunIds.push((await actorClient.call()).id);
        createdRunIds.push((await actorClient.call(undefined, { timeout: 1 })).id);

        const runCollection = actorClient.runs();

        const multipleStatusRuns = await runCollection.list({ status: ['SUCCEEDED', 'TIMED-OUT'] });
        expect(multipleStatusRuns.items.every((run) => ['SUCCEEDED', 'TIMED-OUT'].includes(run.status))).toBe(true);

        const singleStatusRuns = await runCollection.list({ status: 'SUCCEEDED' });
        expect(singleStatusRuns.items.every((run) => run.status === 'SUCCEEDED')).toBe(true);
    } finally {
        for (const runId of createdRunIds) {
            await client.run(runId).delete();
        }
    }
});

test('runs().list() accepts the date range both as a Date and as an ISO 8601 string', async () => {
    // No runs are created here: the assertion is that the client serializes both forms into a request
    // the API accepts, which holds whether or not the resulting page is empty.
    const date = new Date(Date.UTC(2100, 0, 1));
    const isoDate = date.toISOString();

    await expect(client.runs().list({ startedBefore: date, startedAfter: date })).resolves.toBeDefined();
    await expect(client.runs().list({ startedBefore: isoDate, startedAfter: isoDate })).resolves.toBeDefined();
});

test('a finished run can be read back and then deleted', async () => {
    const run = await client.actor(HELLO_WORLD_ACTOR).call();
    const runClient = client.run(run.id);

    const retrievedRun = await runClient.get();
    expect(retrievedRun?.id).toBe(run.id);
    expect(retrievedRun?.status).toBe('SUCCEEDED');

    await runClient.delete();

    await expect(runClient.get()).resolves.toBeUndefined();
});

test('get() resolves to undefined for a run that does not exist', async () => {
    await expect(client.run('NoNExIsTeNtRuNiD123').get()).resolves.toBeUndefined();
});

test('dataset() addresses the default dataset of the run', async () => {
    const run = await client.actor(HELLO_WORLD_ACTOR).call();
    const runClient = client.run(run.id);

    try {
        const dataset = await runClient.dataset().get();

        expect(dataset?.id).toBe(run.defaultDatasetId);
    } finally {
        await runClient.delete();
    }
});

test('keyValueStore() addresses the default key-value store of the run', async () => {
    const run = await client.actor(HELLO_WORLD_ACTOR).call();
    const runClient = client.run(run.id);

    try {
        const kvs = await runClient.keyValueStore().get();

        expect(kvs?.id).toBe(run.defaultKeyValueStoreId);
    } finally {
        await runClient.delete();
    }
});

test('requestQueue() addresses the default request queue of the run', async () => {
    const run = await client.actor(HELLO_WORLD_ACTOR).call();
    const runClient = client.run(run.id);

    try {
        const requestQueue = await runClient.requestQueue().get();

        expect(requestQueue?.id).toBe(run.defaultRequestQueueId);
    } finally {
        await runClient.delete();
    }
});

test('log() returns the log the run produced', async () => {
    const run = await client.actor(HELLO_WORLD_ACTOR).call();
    const runClient = client.run(run.id);

    try {
        const logContent = await runClient.log().get();

        expect(typeof logContent).toBe('string');
        expect(logContent!.length).toBeGreaterThan(0);
    } finally {
        await runClient.delete();
    }
});

test('getStreamedLog() streams the log of a real run', async () => {
    const run = await client.actor(HELLO_WORLD_ACTOR).call();
    const runClient = client.run(run.id);

    try {
        // Mock-server coverage pins how chunks are split into lines; this pins that the live stream
        // reaches that code at all, which a mock can never show.
        const lines: string[] = [];
        const toLog = new Log({ level: LogLevel.DEBUG });
        toLog.info = (message: string) => {
            lines.push(message);
        };

        const streamedLog = await runClient.getStreamedLog({ toLog, fromStart: true });
        expect(streamedLog).toBeDefined();

        streamedLog!.start();
        await pollUntilCondition(
            async () => lines.length,
            (count) => count > 0,
            { timeoutSecs: 30 },
        );
        await streamedLog!.stop();

        expect(lines.length, 'the streamed log of a finished run yielded no lines').toBeGreaterThan(0);
    } finally {
        await runClient.delete();
    }
});

test('abort() stops a running Actor and the run settles in a terminal state', async () => {
    const run = await client.actor(HELLO_WORLD_ACTOR).start();
    const runClient = client.run(run.id);

    try {
        const abortedRun = await runClient.abort();
        // hello-world is short enough that it may already have succeeded before the abort landed.
        expect(['ABORTING', 'ABORTED', 'SUCCEEDED']).toContain(abortedRun.status);

        const finalRun = await runClient.waitForFinish();
        expect(['ABORTED', 'SUCCEEDED']).toContain(finalRun.status);
    } finally {
        await runClient.waitForFinish();
        await runClient.delete();
    }
});

test('update() sets the status message of a run', async () => {
    const run = await client.actor(HELLO_WORLD_ACTOR).call();
    const runClient = client.run(run.id);

    try {
        const updatedRun = await runClient.update({
            statusMessage: 'Test status message',
            isStatusMessageTerminal: true,
        });

        expect(updatedRun.statusMessage).toBe('Test status message');
    } finally {
        await runClient.delete();
    }
});

test('resurrect() restarts a finished run, which then succeeds again', async () => {
    const run = await client.actor(HELLO_WORLD_ACTOR).call();
    expect(run.status).toBe('SUCCEEDED');
    const runClient = client.run(run.id);

    try {
        const resurrectedRun = await runClient.resurrect();
        expect(['READY', 'RUNNING', 'SUCCEEDED']).toContain(resurrectedRun.status);

        const finalRun = await runClient.waitForFinish();
        expect(finalRun.status).toBe('SUCCEEDED');
    } finally {
        // The resurrected run may still be executing, and a running run cannot be deleted.
        await runClient.waitForFinish();
        await runClient.delete();
    }
});

test('metamorph() transforms a started run into another Actor, keeping the run id', async () => {
    const run = await client.actor(HELLO_WORLD_ACTOR).start();
    const runClient = client.run(run.id);

    try {
        await waitUntilStarted(runClient);

        try {
            const metamorphedRun = await runClient.metamorph(HELLO_WORLD_ACTOR, {
                message: 'Hello from metamorph!',
            });
            expect(metamorphedRun.id).toBe(run.id);

            await runClient.waitForFinish();
        } catch (err) {
            // hello-world can finish before the metamorph lands; the API call was still exercised.
            rethrowUnlessAlreadyFinished(err);
        }
    } finally {
        await runClient.waitForFinish();
        await runClient.delete();
    }
});

test('reboot() restarts the container of a running Actor, keeping the run id', async () => {
    const run = await client.actor(HELLO_WORLD_ACTOR).start();
    const runClient = client.run(run.id);

    try {
        const currentRun = await waitUntilStarted(runClient);

        if (currentRun?.status === 'RUNNING') {
            try {
                const rebootedRun = await runClient.reboot();
                expect(rebootedRun.id).toBe(run.id);
            } catch (err) {
                // The run may finish between the status check above and the reboot call.
                rethrowUnlessAlreadyFinished(err);
            }
        }

        await runClient.waitForFinish();
    } finally {
        await runClient.waitForFinish();
        await runClient.delete();
    }
});

test('charge() reaches the API and is rejected for an Actor that is not pay-per-event', async () => {
    const run = await client.actor(HELLO_WORLD_ACTOR).call();
    const runClient = client.run(run.id);

    try {
        try {
            await runClient.charge({ eventName: 'test-event', count: 1 });
            // If it succeeds, the reference Actor has become pay-per-event - also a valid outcome.
        } catch (err) {
            // Anything other than the API rejecting a non-PPE charge is a real failure.
            if (!(err instanceof ApifyApiError) || ![400, 403, 404].includes(err.statusCode)) throw err;
        }
    } finally {
        await runClient.delete();
    }
});

test('runs().list() returns the user run feed', async () => {
    const runsPage = await client.runs().list({ limit: 10 });

    expect(Array.isArray(runsPage.items)).toBe(true);
    for (const run of runsPage.items) {
        expect(run.id).toBeTruthy();
        expect(run.actId).toBeTruthy();
    }
});

test('runs().list({ desc: true }) returns the run feed newest first', async () => {
    const runsPage = await client.runs().list({ limit: 10, desc: true });

    // The user run feed is shared across parallel test workers, and a brand-new RUNNING run may
    // briefly lack `startedAt`. Compare ordering only on the timestamps that are present.
    const timestamps = runsPage.items
        .map((run) => run.startedAt?.getTime())
        .filter((value): value is number => value !== undefined);
    expect(timestamps).toEqual([...timestamps].sort((a, b) => b - a));
});

test('runs().list() is async-iterable and yields the user runs', async () => {
    const collected: ActorRunListItem[] = [];
    for await (const run of client.runs().list({ limit: 5 })) {
        collected.push(run);
    }

    for (const run of collected) {
        expect(run.id).toBeTruthy();
        expect(run.actId).toBeTruthy();
    }
});

test('actor.runs().list() is async-iterable and yields only that Actor runs', async () => {
    const run = await client.actor(HELLO_WORLD_ACTOR).call();

    try {
        const collected: ActorRunListItem[] = [];
        for await (const actorRun of client.actor(HELLO_WORLD_ACTOR).runs().list({ limit: 3, desc: true })) {
            collected.push(actorRun);
        }

        expect(collected.length).toBeGreaterThanOrEqual(1);
        expect(collected.every((item) => item.actId === run.actId)).toBe(true);
    } finally {
        await client.run(run.id).delete();
    }
});
