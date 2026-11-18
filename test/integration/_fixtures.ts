import { expect } from 'vitest';

import type { ActorCollectionCreateOptions, VersionSourceFiles } from 'apify-client';
import { ActorSourceType, ApifyClient } from 'apify-client';

/** API token of the primary test user. Every test in this tier needs it. */
const TOKEN_ENV_VAR = 'APIFY_TEST_USER_API_TOKEN';

/** Overrides the API the suite runs against, so it can be pointed at a staging deployment. */
const API_URL_ENV_VAR = 'APIFY_INTEGRATION_TESTS_API_URL';

/** Client authenticated as the primary test user, or with the given `token` instead. */
export function makeClient(token?: string): ApifyClient {
    token ??= process.env[TOKEN_ENV_VAR];
    if (!token) {
        throw new Error(`${TOKEN_ENV_VAR} environment variable is missing, cannot run tests!`);
    }

    const baseUrl = process.env[API_URL_ENV_VAR];
    return new ApifyClient({ token, ...(baseUrl ? { baseUrl } : {}) });
}

/**
 * Create an Actor from source files and build it, returning its ID.
 *
 * The caller deletes the Actor. If the build does not succeed, the call tries to delete the Actor and throws the
 * build error.
 */
export async function createBuiltActor(
    client: ApifyClient,
    name: string,
    sourceFiles: VersionSourceFiles['sourceFiles'],
    createOptions: Omit<ActorCollectionCreateOptions, 'name' | 'versions'> = {},
): Promise<string> {
    const actor = await client.actors().create({
        name,
        versions: [
            {
                versionNumber: '0.0',
                sourceType: ActorSourceType.SourceFiles,
                buildTag: 'latest',
                sourceFiles,
            },
        ],
        ...createOptions,
    });
    const actorClient = client.actor(actor.id);

    try {
        const build = await actorClient.build('0.0');
        const finishedBuild = await client.build(build.id).waitForFinish({ waitSecs: 300 });
        expect(finishedBuild.status).toBe('SUCCEEDED');
    } catch (err) {
        // A failed delete would hide the build failure, which is the error worth reporting.
        await actorClient.delete().catch(() => {});
        throw err;
    }
    return actor.id;
}
