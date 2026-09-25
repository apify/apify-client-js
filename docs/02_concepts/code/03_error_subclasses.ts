import { ApifyClient, NotFoundError, RateLimitError } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

try {
    await client.actor('my-actor').call({ url: 'https://example.com' });
} catch (error) {
    if (error instanceof NotFoundError) {
        // The Actor doesn't exist, or the token can't see it.
    } else if (error instanceof RateLimitError) {
        // The retries are exhausted, so back off and try again later.
    } else {
        throw error;
    }
}
