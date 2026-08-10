import { beforeAll, expect, test } from 'vitest';

import type { Actor, ActorVersion, ApifyClient, FinalActorVersion } from 'apify-client';
import { ActorSourceType } from 'apify-client';

import { makeClient } from './_fixtures.js';
import { getRandomResourceName } from './_utils.js';

let client: ApifyClient;

beforeAll(() => {
    client = makeClient();
});

function sourceFilesVersion(versionNumber: string, buildTag: string, content = 'console.log("Hello")'): ActorVersion {
    return {
        versionNumber,
        sourceType: ActorSourceType.SourceFiles,
        buildTag,
        sourceFiles: [{ name: 'main.js', format: 'TEXT', content }],
    };
}

/** Create a throwaway Actor. The versions are never built, so this costs no compute. */
async function createActor(versions?: ActorVersion[]): Promise<Actor> {
    return client.actors().create({
        name: getRandomResourceName('actor'),
        ...(versions ? { versions } : {}),
    });
}

test('versions().list() returns the versions an Actor was created with', async () => {
    const actor = await createActor([sourceFilesVersion('0.0', 'latest')]);
    const actorClient = client.actor(actor.id);

    try {
        const versions = await actorClient.versions().list();

        expect(versions.items.length).toBeGreaterThanOrEqual(1);
        expect(versions.items[0].versionNumber).toBe('0.0');
        expect(versions.items[0].buildTag).toBe('latest');
    } finally {
        await actorClient.delete();
    }
});

test('versions().create() adds a version that is then retrievable by number', async () => {
    const actor = await createActor();
    const actorClient = client.actor(actor.id);

    try {
        const createdVersion = await actorClient
            .versions()
            .create(sourceFilesVersion('1.0', 'test', 'console.log("Hello from version 1.0")'));
        expect(createdVersion.versionNumber).toBe('1.0');
        expect(createdVersion.buildTag).toBe('test');
        expect(createdVersion.sourceType).toBe(ActorSourceType.SourceFiles);

        const retrievedVersion = await actorClient.version('1.0').get();
        expect(retrievedVersion?.versionNumber).toBe('1.0');
        expect(retrievedVersion?.buildTag).toBe('test');
    } finally {
        await actorClient.delete();
    }
});

test('update() changes the build tag of a version, and it persists', async () => {
    const actor = await createActor([sourceFilesVersion('0.1', 'initial', 'console.log("Initial")')]);
    const actorClient = client.actor(actor.id);
    const versionClient = actorClient.version('0.1');

    try {
        const updatedVersion = await versionClient.update(
            sourceFilesVersion('0.1', 'updated', 'console.log("Updated")'),
        );
        expect(updatedVersion.versionNumber).toBe('0.1');
        expect(updatedVersion.buildTag).toBe('updated');

        const retrievedVersion = await versionClient.get();
        expect(retrievedVersion?.buildTag).toBe('updated');
    } finally {
        await actorClient.delete();
    }
});

test('delete() removes one version and leaves the others alone', async () => {
    const actor = await createActor([
        sourceFilesVersion('0.1', 'v1', 'console.log("v1")'),
        sourceFilesVersion('0.2', 'v2', 'console.log("v2")'),
    ]);
    const actorClient = client.actor(actor.id);

    try {
        await actorClient.version('0.1').delete();

        await expect(actorClient.version('0.1').get()).resolves.toBeUndefined();

        const remainingVersion = await actorClient.version('0.2').get();
        expect(remainingVersion?.versionNumber).toBe('0.2');
    } finally {
        await actorClient.delete();
    }
});

test('versions().list() is async-iterable and yields every version', async () => {
    const actor = await createActor([
        sourceFilesVersion('0.0', 'latest', 'console.log(0)'),
        sourceFilesVersion('0.1', 'v1', 'console.log(1)'),
        sourceFilesVersion('0.2', 'v2', 'console.log(2)'),
    ]);
    const actorClient = client.actor(actor.id);

    try {
        const collected: FinalActorVersion[] = [];
        for await (const version of actorClient.versions().list()) {
            collected.push(version);
        }

        expect(collected).toHaveLength(3);
        expect(new Set(collected.map((item) => item.versionNumber))).toEqual(new Set(['0.0', '0.1', '0.2']));
    } finally {
        await actorClient.delete();
    }
});

test('get() resolves to undefined for a version that does not exist', async () => {
    const actor = await createActor();
    const actorClient = client.actor(actor.id);

    try {
        await expect(actorClient.version('99.99').get()).resolves.toBeUndefined();
    } finally {
        await actorClient.delete();
    }
});
