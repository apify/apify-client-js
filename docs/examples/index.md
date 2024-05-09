---
title: Basic usage
sidebar_label: Basic usage
---

# Code examples

## Different ways how to pass an input

The fastest way to get results from an Actor is to pass input directly to the `call` function.

```javascript
import { ApifyClient } from 'apify-client';

// Client initialization with the API token
const client = new ApifyClient({ token: 'MY_APIFY_TOKEN' });

const actorClient = client.actor('apify/instagram-hashtag-scraper');

// Run the actor and wait for it to finish up to 60 seconds. Input is not persisted for next runs.
const runData = await actorClient.call({ hashtags: ['twitter'], resultsLimit: 20 }, { waitSecs: 60 });
```

To run multiple inputs with the same Actor, most convenient way is to create multiple [tasks](https://docs.apify.com/platform/actors/running/tasks) with different inputs.
Task input is persisted on Apify platform when task is created.

```javascript
import { ApifyClient } from 'apify-client';

// Client initialization with the API token
const client = new ApifyClient({ token: 'MY_APIFY_TOKEN' });

const socialsHashtags = ['facebook', 'twitter', 'instagram'];

// Multiple input schemas for one Actor can be persisted in tasks. Tasks are saved in the Apify platform and can be run multiple times.
const socialsTasks = socialsHashtags.map((hashtag) => client.tasks().create({
    actId: 'apify/instagram-hashtag-scraper',
    name: `hashtags-${hashtag}`,
    input: { hashtags: [hashtag], resultsLimit: 20 },
    options: { memoryMbytes: 1024 },
}));

// Create all tasks in parallel
const createdTasks = await Promise.all(socialsTasks);

// Run all tasks in parallel
await Promise.all(createdTasks.map((task) => client.task(task.id).call()));
```

## Getting latest data from an Actor

Actor data are stored to [datasets](https://docs.apify.com/platform/storage/dataset). Datasets can be retrieved from Actor runs. Dataset items can be listed with pagination

```javascript
import { ApifyClient } from 'apify-client';

// Client initialization with the API token
const client = new ApifyClient({ token: 'MY_APIFY_TOKEN' });

const actorClient = client.actor('apify/instagram-hashtag-scraper');

const actorRuns = actorClient.runs();

// See pagination to understand how to get more datasets
const actorDatasets = await actorRuns.list({ limit: 20 });

actorDatasets.items.forEach(async (datasetItem) => {
    // Dataset items can be handled here. Dataset items can be paginated
    const datasetItems = await client.dataset(datasetItem.defaultDatasetId).listItems({ limit: 1000 });

    // ...
});
```

## Handling webhooks

[Webhooks](https://docs.apify.com/platform/integrations/webhooks) can be used to get notifications about Actor runs. Simple webhook listener can be built on `express` library:

```javascript
import express from 'express';
import bodyParser from 'body-parser';
import { ApifyClient, DownloadItemsFormat } from 'apify-client';

// Initialize Apify client, express and define server port
const client = new ApifyClient({ token: 'MY_APIFY_TOKEN' });
const app = express();
const PORT = 3000;

// Tell express to use body-parser's JSON parsing
app.use(bodyParser.json());

app.post('apify-webhook', async (req, res) => {
    // Log the payload from the webhook
    console.log(req.body);

    const runDataset = await client.dataset(req.body.resource.defaultDatasetId);

    // e.g. Save dataset locally as JSON
    await runDataset.downloadItems(DownloadItemsFormat.JSON);

    // Respond to the webhook
    res.send('Webhook received');
})

// Start express on the defined port
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
```
