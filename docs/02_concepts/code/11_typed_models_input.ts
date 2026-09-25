import { ApifyClient } from 'apify-client';
import type { RequestQueueClientRequestToAdd } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// The input type lists the fields the API accepts, so your editor completes and checks them.
const request: RequestQueueClientRequestToAdd = {
    url: 'https://example.com',
    uniqueKey: 'https://example.com',
    method: 'GET',
};

await client.requestQueue('REQUEST-QUEUE-ID').addRequest(request);
