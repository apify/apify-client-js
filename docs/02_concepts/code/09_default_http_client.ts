import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
    token: 'MY-APIFY-TOKEN',
    maxRetries: 4,
    minDelayBetweenRetriesMillis: 500,
    timeoutMediumSecs: 60,
    headers: { 'x-apify-integration-platform': 'my-platform' },
});
