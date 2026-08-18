import { beforeAll, expect, test } from 'vitest';

import type { ApifyClient, Schedule } from 'apify-client';
import { ScheduleActions } from 'apify-client';

import { makeClient } from './_fixtures.js';
import { collectUntilPresent, getRandomResourceName } from './_utils.js';

const HELLO_WORLD_ACTOR = 'apify/hello-world';

let client: ApifyClient;

beforeAll(() => {
    client = makeClient();
});

async function createSchedule(cronExpression = '0 0 * * *'): Promise<Schedule> {
    return client.schedules().create({
        cronExpression,
        isEnabled: false,
        isExclusive: false,
        name: getRandomResourceName('schedule'),
    });
}

test('create() stores the cron expression and flags, and the schedule is retrievable by id', async () => {
    const scheduleName = getRandomResourceName('schedule');
    const createdSchedule = await client.schedules().create({
        cronExpression: '0 0 * * *',
        isEnabled: false,
        isExclusive: false,
        name: scheduleName,
    });
    const scheduleClient = client.schedule(createdSchedule.id);

    try {
        expect(createdSchedule.name).toBe(scheduleName);
        expect(createdSchedule.cronExpression).toBe('0 0 * * *');
        expect(createdSchedule.isEnabled).toBe(false);
        expect(createdSchedule.isExclusive).toBe(false);

        const retrievedSchedule = await scheduleClient.get();
        expect(retrievedSchedule?.id).toBe(createdSchedule.id);
        expect(retrievedSchedule?.name).toBe(scheduleName);
    } finally {
        await scheduleClient.delete();
    }
});

test('update() changes the name, cron expression and enabled flag, and they persist', async () => {
    const newName = getRandomResourceName('schedule-updated');
    const createdSchedule = await createSchedule();
    const scheduleClient = client.schedule(createdSchedule.id);

    try {
        const updatedSchedule = await scheduleClient.update({
            name: newName,
            cronExpression: '0 12 * * *',
            isEnabled: true,
        });
        expect(updatedSchedule.name).toBe(newName);
        expect(updatedSchedule.cronExpression).toBe('0 12 * * *');
        expect(updatedSchedule.isEnabled).toBe(true);
        expect(updatedSchedule.id).toBe(createdSchedule.id);

        const retrievedSchedule = await scheduleClient.get();
        expect(retrievedSchedule?.name).toBe(newName);
        expect(retrievedSchedule?.cronExpression).toBe('0 12 * * *');
    } finally {
        await scheduleClient.delete();
    }
});

test('schedules().list() contains the freshly created schedules', async () => {
    const first = await createSchedule('0 0 * * *');
    const second = await createSchedule('0 6 * * *');

    try {
        const collected = await collectUntilPresent(
            () => client.schedules().list({ desc: true, limit: 100 }),
            [first.id, second.id],
        );
        const collectedIds = new Set(collected.map((item) => item.id));

        expect(collectedIds).toContain(first.id);
        expect(collectedIds).toContain(second.id);
    } finally {
        await client.schedule(first.id).delete();
        await client.schedule(second.id).delete();
    }
});

test('schedules().list() iterates the user schedules across pages', async () => {
    const createdIds: string[] = [];

    try {
        for (let i = 0; i < 3; i++) {
            const schedule = await createSchedule();
            createdIds.push(schedule.id);
        }

        const collected = await collectUntilPresent(
            () => client.schedules().list({ desc: true, limit: 50 }),
            createdIds,
        );
        const collectedIds = new Set(collected.map((item) => item.id));

        for (const createdId of createdIds) {
            expect(collectedIds, `schedule ${createdId} is missing from the listing`).toContain(createdId);
        }
    } finally {
        for (const id of createdIds) {
            await client.schedule(id).delete();
        }
    }
});

test('get() resolves to undefined for a deleted schedule', async () => {
    const createdSchedule = await createSchedule();
    const scheduleClient = client.schedule(createdSchedule.id);

    await scheduleClient.delete();

    await expect(scheduleClient.get()).resolves.toBeUndefined();
});

test('get() resolves to undefined for a schedule that never existed', async () => {
    await expect(client.schedule('NoNeXiStEnT').get()).resolves.toBeUndefined();
});

test('getLog() works on a schedule that has never run', async () => {
    const createdSchedule = await createSchedule();
    const scheduleClient = client.schedule(createdSchedule.id);

    try {
        const log = await scheduleClient.getLog();

        // The API answers with an array of log entries, empty for a schedule that never fired.
        // `getLog` declares `Promise<string | undefined>`, which does not match, hence the cast.
        expect(Array.isArray(log as unknown)).toBe(true);
        expect(log as unknown as unknown[]).toHaveLength(0);
    } finally {
        await scheduleClient.delete();
    }
});

test('create() accepts a RUN_ACTOR action, which round-trips through the API', async () => {
    const actor = await client.actor(HELLO_WORLD_ACTOR).get();
    expect(actor).toBeDefined();

    const createdSchedule = await client.schedules().create({
        cronExpression: '0 0 * * *',
        isEnabled: false,
        isExclusive: false,
        name: getRandomResourceName('schedule'),
        actions: [{ type: ScheduleActions.RunActor, actorId: actor!.id }],
    });
    const scheduleClient = client.schedule(createdSchedule.id);

    try {
        expect(createdSchedule.actions).toHaveLength(1);
        const action = createdSchedule.actions[0];
        expect(action.type).toBe(ScheduleActions.RunActor);
        expect(action).toHaveProperty('actorId', actor!.id);

        const retrieved = await scheduleClient.get();
        expect(retrieved?.actions).toHaveLength(1);
    } finally {
        await scheduleClient.delete();
    }
});
