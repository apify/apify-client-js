import { ApifyClient } from 'apify-client';

// Configure the default timeout tiers globally.
const client = new ApifyClient({
    token: 'MY-APIFY-TOKEN',
    timeoutShortSecs: 10,
    timeoutMediumSecs: 60,
    timeoutLongSecs: 600,
    timeoutMaxSecs: 600,
});

const datasetClient = client.dataset('dataset-id');

// Override the timeout for a single call with a number of seconds.
const { items } = await datasetClient.listItems({ timeoutSecs: 120 });

// Or use a tier name to select a predefined timeout.
const dataset = await datasetClient.get({ timeoutSecs: 'long' });
