import { ApifyClient } from 'apify-client';

/** API token of the primary test user. Every test in this tier needs it. */
export const TOKEN_ENV_VAR = 'APIFY_TEST_USER_API_TOKEN';

/** API token of a second test user, used only by the cross-user permission tests. */
export const TOKEN_ENV_VAR_2 = 'APIFY_TEST_USER_2_API_TOKEN';

/** Overrides the API the suite runs against, so it can be pointed at a staging deployment. */
export const API_URL_ENV_VAR = 'APIFY_INTEGRATION_TESTS_API_URL';

function requireToken(envVar: string): string {
    const token = process.env[envVar];
    if (!token) {
        throw new Error(`${envVar} environment variable is missing, cannot run tests!`);
    }
    return token;
}

function makeClientForToken(token: string): ApifyClient {
    const baseUrl = process.env[API_URL_ENV_VAR];
    return new ApifyClient({ token, ...(baseUrl ? { baseUrl } : {}) });
}

/** Client authenticated as the primary test user. */
export function makeClient(): ApifyClient {
    return makeClientForToken(requireToken(TOKEN_ENV_VAR));
}

/** Client authenticated as the secondary test user, for cross-user access tests. */
export function makeClient2(): ApifyClient {
    return makeClientForToken(requireToken(TOKEN_ENV_VAR_2));
}

/** A dataset or key-value store owned by the secondary user, reachable only with its signature. */
export interface StorageFixture {
    id: string;
    signature: string;
}

export interface DatasetFixture extends StorageFixture {
    expectedContent: Record<string, number>[];
}

export interface KvsFixture extends StorageFixture {
    expectedContent: Record<string, number>;
    keysSignature: Record<string, string>;
}

/**
 * Outcome of a global setup step, so that a failure to build one fixture fails only the tests that
 * need it instead of aborting the whole suite.
 */
export type FixtureResult<T> = { ok: true; value: T } | { ok: false; error: string };

/** Return the fixture value, or fail the current test with the error that global setup recorded. */
export function unwrapFixture<T>(result: FixtureResult<T>): T {
    if (!result.ok) throw new Error(result.error);
    return result.value;
}

declare module 'vitest' {
    interface ProvidedContext {
        crossUserDataset: FixtureResult<DatasetFixture>;
        crossUserKvs: FixtureResult<KvsFixture>;
    }
}
