import { ApifyClient } from 'apify-client';

/** API token of the primary test user. Every test in this tier needs it. */
const TOKEN_ENV_VAR = 'APIFY_TEST_USER_API_TOKEN';

/** Overrides the API the suite runs against, so it can be pointed at a staging deployment. */
const API_URL_ENV_VAR = 'APIFY_INTEGRATION_TESTS_API_URL';

/** Client authenticated as the primary test user. */
export function makeClient(): ApifyClient {
    const token = process.env[TOKEN_ENV_VAR];
    if (!token) {
        throw new Error(`${TOKEN_ENV_VAR} environment variable is missing, cannot run tests!`);
    }

    const baseUrl = process.env[API_URL_ENV_VAR];
    return new ApifyClient({ token, ...(baseUrl ? { baseUrl } : {}) });
}
