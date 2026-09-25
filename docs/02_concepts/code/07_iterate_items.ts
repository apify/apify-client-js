import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

const datasetClient = client.dataset('dataset-id');

// Iterate through 1500 items past the first 100, fetching up to 100 items per API call.
for await (const item of datasetClient.listItems({ limit: 1500, offset: 100, chunkSize: 100 })) {
    console.log(item);
}
