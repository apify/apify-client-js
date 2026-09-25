import { ApifyClient } from 'apify-client';

// Client initialization with the API token.
const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

const runsClient = client.actor('apify/instagram-hashtag-scraper').runs();

// List the last 20 runs. For how to get more, see the Pagination concept.
const actorRuns = await runsClient.list({ limit: 20 });

const mergingDataset = await client.datasets().getOrCreate('merge-dataset');

for (const run of actorRuns.items) {
    // Fetch the items of the run's default dataset. The items can be paginated.
    const { items } = await client.dataset(run.defaultDatasetId).listItems({ limit: 1000 });

    // Push the items to the merged dataset.
    await client.dataset(mergingDataset.id).pushItems(items);
}
