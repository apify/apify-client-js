---
sidebar_label: 'Retrieving Datasets'
title: 'Retrieving Datasets'
description: 'Learn how to retrieve and work with data from Apify datasets, including pagination, filtering, and accessing data from Actor runs.'
---

## What are Datasets?

[Datasets](https://docs.apify.com/platform/storage/dataset) are storage containers for structured data on the Apify platform. They are typically used to store results from Actor runs, such as scraped web data, processed information, or any structured output.

## Getting Dataset from Actor Run

When an Actor finishes running, it typically stores its results in a dataset. You can access this dataset using the `defaultDatasetId` from the run object:

```js
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Start an Actor and wait for it to finish
const { defaultDatasetId } = await client.actor('john-doe/my-cool-actor').call();

// Retrieve items from the Actor's dataset
const { items } = await client.dataset(defaultDatasetId).listItems();

console.log(`Retrieved ${items.length} items from the dataset`);
```

## Accessing Existing Datasets

If you already know the dataset ID, you can access it directly:

```js
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Access dataset by ID
const { items } = await client.dataset('dataset-id').listItems();
```

:::info Dataset Access

Running an Actor might take time, depending on the Actor's complexity and the amount of data it processes. If you want only to get data and have an immediate response, you should access the existing dataset of a finished [Actor run](https://docs.apify.com/platform/actors/running/runs-and-builds#runs).

:::

## Listing Dataset Items

The `listItems()` method retrieves data from a dataset with various options:

### Basic Usage

```js
const { items } = await client.dataset('dataset-id').listItems();

// Process the items
items.forEach(item => {
    console.log(item);
});
```

### With Pagination

```js
// Get first 100 items
const { items, total, count, offset, limit } = await client
    .dataset('dataset-id')
    .listItems({
        limit: 100,
        offset: 0
    });

console.log(`Retrieved ${count} of ${total} total items`);
```

### Filtering Fields

Retrieve only specific fields to reduce bandwidth:

```js
const { items } = await client
    .dataset('dataset-id')
    .listItems({
        fields: ['name', 'price', 'url'],
        limit: 50
    });
```

### Excluding Fields

Exclude specific fields from the response:

```js
const { items } = await client
    .dataset('dataset-id')
    .listItems({
        omit: ['largeField', 'unusedData'],
        limit: 50
    });
```

## Direct Dataset Access from Run

You can access a run's dataset directly without storing the dataset ID:

```js
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Start an Actor
const run = await client.actor('john-doe/my-actor').start();

// Wait for the run to finish
await client.waitForFinish(run.id);

// Access dataset directly from run client
const runClient = client.run(run.id);
const { items } = await runClient.dataset().listItems();
```

## Accessing Last Run's Dataset

Use the `lastRun()` method to access the most recent run's dataset:

```js
const lastRunClient = client.actor('username/actor-name').lastRun({ status: 'SUCCEEDED' });

// Access the dataset from the last successful run
const { items } = await lastRunClient.dataset().listItems();
```

## Dataset Item Formats

You can download dataset items in different formats:

### JSON Format (default)

```js
const { items } = await client.dataset('dataset-id').listItems();
// Returns JSON array
```

### CSV Format

```js
// Download as CSV (for external processing)
const datasetClient = client.dataset('dataset-id');

// Get download URL for CSV
const csvUrl = datasetClient.downloadItems('csv');
console.log(`Download CSV from: ${csvUrl}`);
```

### Other Formats

The dataset API supports multiple formats:
- JSON (default)
- CSV
- XLSX
- HTML
- XML
- RSS

## Streaming Large Datasets

For large datasets, use pagination to avoid loading all data at once:

```js
async function processLargeDataset(datasetId) {
    const BATCH_SIZE = 1000;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
        const { items, count } = await client
            .dataset(datasetId)
            .listItems({
                limit: BATCH_SIZE,
                offset: offset
            });

        // Process batch
        for (const item of items) {
            await processItem(item);
        }

        offset += count;
        hasMore = count === BATCH_SIZE;

        console.log(`Processed ${offset} items...`);
    }
}

await processLargeDataset('my-dataset-id');
```

## Error Handling

Always handle errors when retrieving datasets:

```js
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

try {
    const { items } = await client.dataset('dataset-id').listItems();

    if (items.length === 0) {
        console.log('Dataset is empty');
    } else {
        console.log(`Retrieved ${items.length} items`);
    }
} catch (error) {
    if (error.statusCode === 404) {
        console.error('Dataset not found');
    } else {
        console.error('Failed to retrieve dataset:', error.message);
    }
}
```

## Checking Dataset Info

Get metadata about a dataset before retrieving items:

```js
const dataset = await client.dataset('dataset-id').get();

console.log({
    id: dataset.id,
    name: dataset.name,
    itemCount: dataset.itemCount,
    createdAt: dataset.createdAt,
    modifiedAt: dataset.modifiedAt
});

// Only fetch items if dataset has data
if (dataset.itemCount > 0) {
    const { items } = await client.dataset('dataset-id').listItems();
}
```

## Combining Multiple Datasets

To combine data from multiple datasets, retrieve and merge them:

```js
async function combineDatasets(datasetIds) {
    const allItems = [];

    for (const datasetId of datasetIds) {
        try {
            const { items } = await client.dataset(datasetId).listItems();
            allItems.push(...items);
        } catch (error) {
            console.error(`Failed to retrieve dataset ${datasetId}:`, error.message);
        }
    }

    return allItems;
}

const datasetIds = ['dataset-1', 'dataset-2', 'dataset-3'];
const combinedData = await combineDatasets(datasetIds);
console.log(`Combined ${combinedData.length} items from ${datasetIds.length} datasets`);
```

## Next Steps

- Learn about [joining datasets](03_joining_datasets.md) for more complex data merging
- See [pagination](../02_concepts/05_pagination.md) concepts for efficient data retrieval
- Explore [passing input to actors](01_passing_input_to_actors.md) to configure what data gets scraped
