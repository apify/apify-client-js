import type { TestProject } from 'vitest/node';

import { createHmacSignatureAsync, createStorageContentSignatureAsync } from '@apify/utilities';

import type { DatasetFixture, KvsFixture } from './_fixtures.js';
import { makeClient2, TOKEN_ENV_VAR_2 } from './_fixtures.js';
import { randomId } from './_utils.js';

const DATASET_CONTENT = [
    { item1: 1, item2: 2, item3: 3 },
    { item1: 4, item2: 5, item3: 6 },
];

const KVS_CONTENT: Record<string, number> = { key1: 1, key2: 2, key3: 3 };

async function createCrossUserDataset(): Promise<{ fixture: DatasetFixture; teardown: () => Promise<void> }> {
    const client = makeClient2();
    const dataset = await client.datasets().getOrCreate(`API-test-permissions-${randomId()}`);
    const datasetClient = client.dataset(dataset.id);
    await datasetClient.pushItems(DATASET_CONTENT);

    if (!dataset.urlSigningSecretKey) {
        throw new Error('Dataset created by the secondary user has no URL signing secret key.');
    }

    return {
        fixture: {
            id: dataset.id,
            signature: await createStorageContentSignatureAsync({
                resourceId: dataset.id,
                urlSigningSecretKey: dataset.urlSigningSecretKey,
            }),
            expectedContent: DATASET_CONTENT,
        },
        teardown: () => datasetClient.delete(),
    };
}

async function createCrossUserKvs(): Promise<{ fixture: KvsFixture; teardown: () => Promise<void> }> {
    const client = makeClient2();
    const kvs = await client.keyValueStores().getOrCreate(`API-test-permissions-${randomId()}`);
    const kvsClient = client.keyValueStore(kvs.id);
    for (const [key, value] of Object.entries(KVS_CONTENT)) {
        await kvsClient.setRecord({ key, value });
    }

    if (!kvs.urlSigningSecretKey) {
        throw new Error('Key-value store created by the secondary user has no URL signing secret key.');
    }

    const keysSignature: Record<string, string> = {};
    for (const key of Object.keys(KVS_CONTENT)) {
        keysSignature[key] = await createHmacSignatureAsync(kvs.urlSigningSecretKey, key);
    }

    return {
        fixture: {
            id: kvs.id,
            signature: await createStorageContentSignatureAsync({
                resourceId: kvs.id,
                urlSigningSecretKey: kvs.urlSigningSecretKey,
            }),
            expectedContent: KVS_CONTENT,
            keysSignature,
        },
        teardown: () => kvsClient.delete(),
    };
}

/**
 * Creates the storages owned by the secondary test user, which the cross-user permission tests read
 * with a signature instead of a token.
 *
 * These live in `globalSetup` rather than a `beforeAll` because vitest runs each test file in its own
 * worker: a per-file hook would create one copy of each storage per file. A failure here is recorded
 * and surfaced by the tests that inject the fixture, so a missing or rejected secondary token does not
 * take down the rest of the suite.
 */
export default async function setup({ provide }: TestProject) {
    const teardowns: (() => Promise<void>)[] = [];

    for (const [key, create] of [
        ['crossUserDataset', createCrossUserDataset],
        ['crossUserKvs', createCrossUserKvs],
    ] as const) {
        try {
            const { fixture, teardown } = await create();
            teardowns.push(teardown);
            provide(key, { ok: true, value: fixture } as never);
        } catch (err) {
            provide(key, {
                ok: false,
                error:
                    `Could not create the ${key} fixture with ${TOKEN_ENV_VAR_2}, so cross-user tests ` +
                    `cannot run: ${err instanceof Error ? err.message : String(err)}`,
            });
        }
    }

    return async () => {
        for (const teardown of teardowns) {
            await teardown();
        }
    };
}
