import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

const datasetClient = client.dataset('dataset-id');

// Fetch a single page of up to 1000 items in one API call.
const page = await datasetClient.listItems({ limit: 1000, offset: 0 });

// Inspect the pagination metadata returned by the API.
console.log(page.total);

for (const item of page.items) {
    console.log(item);
}
