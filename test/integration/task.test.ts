import { beforeAll, expect, test } from 'vitest';

import type { ActorRunListItem, ApifyClient, Task } from 'apify-client';

import { makeClient } from './_fixtures.js';
import { collectUntilPresent, getRandomResourceName } from './_utils.js';

const HELLO_WORLD_ACTOR = 'apify/hello-world';

let client: ApifyClient;
let helloWorldActorId: string;

beforeAll(async () => {
    client = makeClient();
    const actor = await client.actor(HELLO_WORLD_ACTOR).get();
    expect(actor, `the reference Actor ${HELLO_WORLD_ACTOR} could not be resolved`).toBeDefined();
    helloWorldActorId = actor!.id;
});

async function createTask(input?: Record<string, unknown>): Promise<Task> {
    return client.tasks().create({
        actId: helloWorldActorId,
        name: getRandomResourceName('task'),
        ...(input ? { input } : {}),
    });
}

test('create() stores the Actor id and name, and the task is retrievable by id', async () => {
    const taskName = getRandomResourceName('task');
    const createdTask = await client.tasks().create({ actId: helloWorldActorId, name: taskName });
    const taskClient = client.task(createdTask.id);

    try {
        expect(createdTask.name).toBe(taskName);
        expect(createdTask.actId).toBe(helloWorldActorId);

        const retrievedTask = await taskClient.get();
        expect(retrievedTask?.id).toBe(createdTask.id);
        expect(retrievedTask?.name).toBe(taskName);
    } finally {
        await taskClient.delete();
    }
});

test('update() changes the name and run options, and they persist', async () => {
    const newName = getRandomResourceName('task-updated');
    const createdTask = await createTask();
    const taskClient = client.task(createdTask.id);

    try {
        const updatedTask = await taskClient.update({ name: newName, options: { timeoutSecs: 300 } });
        expect(updatedTask.name).toBe(newName);
        expect(updatedTask.id).toBe(createdTask.id);
        expect(updatedTask.options?.timeoutSecs).toBe(300);

        const retrievedTask = await taskClient.get();
        expect(retrievedTask?.name).toBe(newName);
    } finally {
        await taskClient.delete();
    }
});

test('tasks().list() contains a freshly created task', async () => {
    const createdTask = await createTask();

    try {
        const collected = await collectUntilPresent(
            () => client.tasks().list({ desc: true, limit: 100 }),
            [createdTask.id],
        );
        const collectedIds = new Set(collected.map((item) => item.id));

        expect(collectedIds).toContain(createdTask.id);
    } finally {
        await client.task(createdTask.id).delete();
    }
});

test('tasks().list() iterates the user tasks across pages', async () => {
    const createdIds: string[] = [];
    for (let i = 0; i < 3; i++) {
        const task = await createTask();
        createdIds.push(task.id);
    }

    try {
        const collected = await collectUntilPresent(() => client.tasks().list({ desc: true, limit: 50 }), createdIds);
        const collectedIds = new Set(collected.map((item) => item.id));

        for (const createdId of createdIds) {
            expect(collectedIds, `task ${createdId} is missing from the listing`).toContain(createdId);
        }
    } finally {
        for (const id of createdIds) {
            await client.task(id).delete();
        }
    }
});

test('get() resolves to undefined for a deleted task', async () => {
    const createdTask = await createTask();
    const taskClient = client.task(createdTask.id);

    await taskClient.delete();

    await expect(taskClient.get()).resolves.toBeUndefined();
});

test('get() resolves to undefined for a task that never existed', async () => {
    await expect(client.task('NoNeXiStEnTtAsK1').get()).resolves.toBeUndefined();
});

test('getInput() returns the saved input and updateInput() replaces it', async () => {
    const createdTask = await createTask({ message: 'Hello from test' });
    const taskClient = client.task(createdTask.id);

    try {
        const retrievedInput = await taskClient.getInput();
        expect(retrievedInput).toMatchObject({ message: 'Hello from test' });

        const updatedInput = await taskClient.updateInput({ message: 'Updated message' });
        expect(updatedInput).toMatchObject({ message: 'Updated message' });
    } finally {
        await taskClient.delete();
    }
});

test('start() launches a run that reaches SUCCEEDED', async () => {
    const createdTask = await createTask();
    const taskClient = client.task(createdTask.id);

    try {
        const run = await taskClient.start();
        expect(run.id).toBeTruthy();
        expect(run.actId).toBe(helloWorldActorId);

        const finishedRun = await client.run(run.id).waitForFinish();
        expect(finishedRun.status).toBe('SUCCEEDED');

        await client.run(run.id).delete();
    } finally {
        await taskClient.delete();
    }
});

test('start() lets a run input override the saved task input', async () => {
    const createdTask = await createTask({ message: 'original' });
    const taskClient = client.task(createdTask.id);

    try {
        const run = await taskClient.start({ message: 'overridden' }, { memory: 256 });
        expect(run.id).toBeTruthy();

        await client.run(run.id).waitForFinish();
        await client.run(run.id).delete();
    } finally {
        await taskClient.delete();
    }
});

test('call() waits for the run and resolves once it has SUCCEEDED', async () => {
    const createdTask = await createTask();
    const taskClient = client.task(createdTask.id);

    try {
        const run = await taskClient.call();
        expect(run.id).toBeTruthy();
        expect(run.status).toBe('SUCCEEDED');

        await client.run(run.id).delete();
    } finally {
        await taskClient.delete();
    }
});

test('call() applies the build and memory overrides it is given', async () => {
    const createdTask = await createTask();
    const taskClient = client.task(createdTask.id);

    try {
        const run = await taskClient.call(undefined, { build: 'latest', memory: 256, timeout: 120 });
        expect(run.status).toBe('SUCCEEDED');
        expect(run.options.memoryMbytes).toBe(256);

        await client.run(run.id).delete();
    } finally {
        await taskClient.delete();
    }
});

test('runs().list() returns the runs of a task', async () => {
    const createdTask = await createTask();
    const taskClient = client.task(createdTask.id);

    try {
        const run = await taskClient.call();

        const runsPage = await taskClient.runs().list({ limit: 10 });
        expect(runsPage.items.length).toBeGreaterThanOrEqual(1);

        await client.run(run.id).delete();
    } finally {
        await taskClient.delete();
    }
});

test('runs().list() is async-iterable and yields the run that was just made', async () => {
    const createdTask = await createTask();
    const taskClient = client.task(createdTask.id);

    try {
        const run = await taskClient.call();

        const collected: ActorRunListItem[] = [];
        for await (const taskRun of taskClient.runs().list({ limit: 5 })) {
            collected.push(taskRun);
        }

        expect(collected.map((item) => item.id)).toContain(run.id);

        await client.run(run.id).delete();
    } finally {
        await taskClient.delete();
    }
});

test('lastRun() resolves to the most recent run of a task', async () => {
    const createdTask = await createTask();
    const taskClient = client.task(createdTask.id);

    try {
        const run = await taskClient.call();

        const lastRun = await taskClient.lastRun().get();
        expect(lastRun?.id).toBe(run.id);

        await client.run(run.id).delete();
    } finally {
        await taskClient.delete();
    }
});

test('webhooks().list() is empty for a newly created task', async () => {
    const createdTask = await createTask();
    const taskClient = client.task(createdTask.id);

    try {
        const webhooksPage = await taskClient.webhooks().list();

        expect(webhooksPage.items).toHaveLength(0);
    } finally {
        await taskClient.delete();
    }
});
