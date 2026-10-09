import { ApifyClient, ApifyClientError } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

try {
    await client.actor('my-actor').call({ url: 'https://example.com' });
} catch (error) {
    if (error instanceof ApifyClientError) {
        // An ApifyApiError, an InvalidResponseBodyError or a ResponseValidationError.
        console.log(`${error.name}: ${error.message}`);
    } else {
        throw error;
    }
}
