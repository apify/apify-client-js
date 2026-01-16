---
sidebar_label: Joining datasets
title: 'Joining datasets'
---

Actor data is stored in [datasets](https://docs.apify.com/platform/storage/dataset), which can be retrieved from Actor runs. You can list dataset items with pagination and merge multiple datasets together for easier analysis. Datasets can be exported to various formats (CSV, JSON, XLSX, XML) or processed using [Integrations](https://docs.apify.com/platform/integrations).

```javascript
import { ApifyClient } from 'apify-client';

// Client initialization with the API token
const client = new ApifyClient({ token: 'MY_APIFY_TOKEN' });

const actorClient = client.actor('apify/instagram-hashtag-scraper');

const actorRuns = actorClient.runs();

// See pagination to understand how to get more datasets
const actorDatasets = await actorRuns.list({ limit: 20 });

console.log('Actor datasets:');
console.log(actorDatasets);

const mergingDataset = await client.datasets().getOrCreate('merge-dataset');

for (const datasetItem of actorDatasets.items) {
    // Dataset items can be handled here. Dataset items can be paginated
    const datasetItems = await client.dataset(datasetItem.defaultDatasetId).listItems({ limit: 1000 });

    // Items can be pushed to single dataset
    await client.dataset(mergingDataset.id).pushItems(datasetItems.items);

    // ...
}
```