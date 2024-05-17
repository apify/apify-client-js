---
sidebar_label: Examples
title: 'Code examples'
---

## Passing an input to the Actor

The fastest way to get results from an Actor is to pass input directly to the `call` function.
Input can be set up, can be passed to `call` function and the reference of running Actor (or wait for finish) is available in `runData` variable.

```javascript
import { ApifyClient } from 'apify-client';

// Client initialization with the API token
const client = new ApifyClient({ token: 'MY_APIFY_TOKEN' });

const actorClient = client.actor('apify/instagram-hashtag-scraper');

const input = { hashtags: ['rainbow'], resultsLimit: 20 };

// Run the Actor and wait for it to finish up to 60 seconds.
// Input is not persisted for next runs.
const runData = await actorClient.call(input, { waitSecs: 60 });
```

To run multiple inputs with the same Actor, most convenient way is to create multiple [tasks](https://docs.apify.com/platform/actors/running/tasks) with different inputs. Task input is persisted on Apify platform when task is created.

```javascript
import { ApifyClient } from 'apify-client';

// Client initialization with the API token
const client = new ApifyClient({ token: 'MY_APIFY_TOKEN' });

const animalsHashtags = ['zebra', 'lion', 'hippo'];

// Multiple input schemas for one Actor can be persisted in tasks.
// Tasks are saved in the Apify platform and can be run multiple times.
const socialsTasksPromises = animalsHashtags.map((hashtag) => client.tasks().create({
    actId: 'apify/instagram-hashtag-scraper',
    name: `hashtags-${hashtag}`,
    input: { hashtags: [hashtag], resultsLimit: 20 },
    options: { memoryMbytes: 1024 },
}));

// Create all tasks in parallel
const createdTasks = await Promise.all(socialsTasksPromises);

// Run all tasks in parallel
await Promise.all(createdTasks.map((task) => client.task(task.id).call()));
```

## Getting latest data from an Actor, joining datasets

Actor data are stored to [datasets](https://docs.apify.com/platform/storage/dataset). Datasets can be retrieved from Actor runs. Dataset items can be listed with pagination. Also, datasets can be merged together to make analysis further on with single file as dataset can be exported to various data format (CSV, JSON, XSLX, XML). [Integrations](https://docs.apify.com/platform/integrations) can do the trick as well.

```javascript
import { ApifyClient } from 'apify-client';

// Client initialization with the API token
const client = new ApifyClient({ token: 'MY_APIFY_TOKEN' });

const actorClient = client.actor('apify/instagram-hashtag-scraper');

const actorRuns = actorClient.runs();

// See pagination to understand how to get more datasets
const actorDatasets = await actorRuns.list({ limit: 20 });

const mergingDataset = await client.datasets().getOrCreate('merge-dataset');

for (const datasetItem of actorDatasets.items) {
    // Dataset items can be handled here. Dataset items can be paginated
    const datasetItems = await client.dataset(datasetItem.defaultDatasetId).listItems({ limit: 1000 });

    // Items can be pushed to single dataset
    await client.dataset(mergingDataset.id).pushItems(datasetItems.items);

    // ...
}
```

## Handling webhooks

[Webhooks](https://docs.apify.com/platform/integrations/webhooks) can be used to get notifications about Actor runs.
For example, a webhook can be triggered when an Actor run finishes successfully.
Webhook can receive dataset ID for further processing.

Initialization of webhook:

```javascript
import { ApifyClient } from 'apify-client';

// Client initialization with the API token
const client = new ApifyClient({ token: 'MY_APIFY_TOKEN' });

const webhooksClient = client.webhooks();

await webhooksClient.create({
    description: 'Instagram hashtag actor succeeded',
    condition: { actorId: 'reGe1ST3OBgYZSsZJ' }, // Actor ID of apify/instagram-hashtag-scraper
    // Request URL can be generated using https://webhook.site. Any REST server can be used
    requestUrl: 'https://webhook.site/CUSTOM_WEBHOOK_ID',
    eventTypes: ['ACTOR.RUN.SUCCEEDED'],
});
```

Simple webhook listener can be built on `express` library, which can helps to create a REST server for handling webhooks:

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
