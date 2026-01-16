---
sidebar_label: Webhooks
title: 'Webhooks'
---

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

Simple webhook listener can be built on [`express`](https://expressjs.com/) library, which can helps to create a REST server for handling webhooks:

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
});

// Start express on the defined port
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
```
