import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
    token: 'MY-APIFY-TOKEN',
    maxRetries: 8,
    minDelayBetweenRetriesMillis: 500,
});
