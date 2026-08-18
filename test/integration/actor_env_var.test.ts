import { beforeAll, expect, test } from 'vitest';

import type { Actor, ActorEnvironmentVariable, ActorVersion, ApifyClient } from 'apify-client';
import { ActorSourceType } from 'apify-client';

import { makeClient } from './_fixtures.js';
import { getRandomResourceName } from './_utils.js';

let client: ApifyClient;

beforeAll(() => {
    client = makeClient();
});

function sourceFilesVersion(versionNumber: string, envVars?: ActorEnvironmentVariable[]): ActorVersion {
    return {
        versionNumber,
        sourceType: ActorSourceType.SourceFiles,
        buildTag: 'latest',
        sourceFiles: [{ name: 'main.js', format: 'TEXT', content: 'console.log("Hello")' }],
        ...(envVars ? { envVars } : {}),
    };
}

/** Create a throwaway Actor with a single unbuilt version, so this costs no compute. */
async function createActor(version: ActorVersion): Promise<Actor> {
    return client.actors().create({ name: getRandomResourceName('actor'), versions: [version] });
}

test('envVars().list() returns the environment variables a version was created with', async () => {
    const actor = await createActor(sourceFilesVersion('0.0', [{ name: 'TEST_VAR', value: 'test_value' }]));
    const actorClient = client.actor(actor.id);

    try {
        const envVars = await actorClient.version('0.0').envVars().list();

        expect(envVars.items.length).toBeGreaterThanOrEqual(1);
        expect(envVars.items[0].name).toBe('TEST_VAR');
        expect(envVars.items[0].value).toBe('test_value');
    } finally {
        await actorClient.delete();
    }
});

test('envVars().create() adds a variable that is then retrievable by name', async () => {
    const actor = await createActor(sourceFilesVersion('1.0'));
    const actorClient = client.actor(actor.id);
    const versionClient = actorClient.version('1.0');

    try {
        const createdEnvVar = await versionClient
            .envVars()
            .create({ name: 'MY_VAR', value: 'my_value', isSecret: false });
        expect(createdEnvVar.name).toBe('MY_VAR');
        expect(createdEnvVar.value).toBe('my_value');
        expect(createdEnvVar.isSecret).toBe(false);

        const retrievedEnvVar = await versionClient.envVar('MY_VAR').get();
        expect(retrievedEnvVar?.name).toBe('MY_VAR');
        expect(retrievedEnvVar?.value).toBe('my_value');
    } finally {
        await actorClient.delete();
    }
});

test('update() changes the value of an environment variable, and it persists', async () => {
    const actor = await createActor(sourceFilesVersion('0.1', [{ name: 'UPDATE_VAR', value: 'initial_value' }]));
    const actorClient = client.actor(actor.id);
    const envVarClient = actorClient.version('0.1').envVar('UPDATE_VAR');

    try {
        const updatedEnvVar = await envVarClient.update({ name: 'UPDATE_VAR', value: 'updated_value' });
        expect(updatedEnvVar.name).toBe('UPDATE_VAR');
        expect(updatedEnvVar.value).toBe('updated_value');

        const retrievedEnvVar = await envVarClient.get();
        expect(retrievedEnvVar?.value).toBe('updated_value');
    } finally {
        await actorClient.delete();
    }
});

test('delete() removes one environment variable and leaves the others alone', async () => {
    const actor = await createActor(
        sourceFilesVersion('0.1', [
            { name: 'VAR_TO_DELETE', value: 'delete_me' },
            { name: 'VAR_TO_KEEP', value: 'keep_me' },
        ]),
    );
    const actorClient = client.actor(actor.id);
    const versionClient = actorClient.version('0.1');

    try {
        await versionClient.envVar('VAR_TO_DELETE').delete();

        await expect(versionClient.envVar('VAR_TO_DELETE').get()).resolves.toBeUndefined();

        const remainingEnvVar = await versionClient.envVar('VAR_TO_KEEP').get();
        expect(remainingEnvVar?.name).toBe('VAR_TO_KEEP');
    } finally {
        await actorClient.delete();
    }
});

test('envVars().list() is async-iterable and yields every environment variable', async () => {
    const envVars = [0, 1, 2].map((index) => ({ name: `VAR_${index}`, value: `value_${index}` }));
    const actor = await createActor(sourceFilesVersion('0.0', envVars));
    const actorClient = client.actor(actor.id);

    try {
        const collected: ActorEnvironmentVariable[] = [];
        for await (const envVar of actorClient.version('0.0').envVars().list()) {
            collected.push(envVar);
        }

        expect(collected).toHaveLength(3);
        expect(new Set(collected.map((item) => item.name))).toEqual(new Set(['VAR_0', 'VAR_1', 'VAR_2']));
    } finally {
        await actorClient.delete();
    }
});

test('a secret environment variable is stored, but its value is never read back', async () => {
    const actor = await createActor(sourceFilesVersion('0.0'));
    const actorClient = client.actor(actor.id);
    const versionClient = actorClient.version('0.0');

    try {
        const created = await versionClient
            .envVars()
            .create({ name: 'MY_SECRET', value: 'super-secret-token', isSecret: true });
        expect(created.name).toBe('MY_SECRET');
        expect(created.isSecret).toBe(true);

        const retrieved = await versionClient.envVar('MY_SECRET').get();
        expect(retrieved?.isSecret).toBe(true);
        expect(retrieved?.value).toBeUndefined();
    } finally {
        await actorClient.delete();
    }
});

test('get() resolves to undefined for an environment variable that does not exist', async () => {
    const actor = await createActor(sourceFilesVersion('0.0'));
    const actorClient = client.actor(actor.id);

    try {
        await expect(actorClient.version('0.0').envVar('THIS_DOES_NOT_EXIST').get()).resolves.toBeUndefined();
    } finally {
        await actorClient.delete();
    }
});
