import { ApifyClient } from 'apify-client';

// You can find your API token at https://console.apify.com/account/integrations.
const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Start an Actor and wait for it to finish.
const run = await client.actor('apify/web-scraper').call({
    startUrls: [{ url: 'https://example.com' }],
    maxCrawlPages: 10,
});

// Fetch results from the Actor run's default dataset.
const { items } = await client.dataset(run.defaultDatasetId).listItems();
console.log(items);
