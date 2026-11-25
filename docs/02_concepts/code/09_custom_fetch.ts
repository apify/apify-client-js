import { ApifyClient, FetchHttpClient } from 'apify-client';

const httpClient = new FetchHttpClient({
    maxRetries: 4,
    // Runs for every attempt, with the request as the shared pipeline prepared it.
    fetch: async (input, init) => {
        const headers = new Headers(init?.headers);
        headers.set('X-Request-Id', crypto.randomUUID());
        return fetch(input, { ...init, headers });
    },
});

const client = ApifyClient.withCustomHttpClient({ token: 'MY-APIFY-TOKEN', httpClient });
