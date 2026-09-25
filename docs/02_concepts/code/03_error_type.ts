import { ApifyApiError, ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

try {
    await client.actor('my-actor').call({ url: 'https://example.com' }, { memory: 32768 });
} catch (error) {
    if (error instanceof ApifyApiError && error.type === 'actor-memory-limit-exceeded') {
        // The account has no memory left for another run, so wait and start it later.
    } else {
        throw error;
    }
}
