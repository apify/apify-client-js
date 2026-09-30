import { writeFile } from 'node:fs/promises';

import { ApifyClient, DownloadItemsFormat } from 'apify-client';
import express from 'express';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });
const app = express();
const PORT = 3000;

// Parse the JSON payload the webhook sends.
app.use(express.json());

app.post('/apify-webhook', async (req, res) => {
    // The default payload carries the run object in `resource`.
    const { defaultDatasetId } = req.body.resource;

    // Save the run's dataset locally as JSON.
    const items = await client.dataset(defaultDatasetId).downloadItems(DownloadItemsFormat.JSON);
    await writeFile(`${defaultDatasetId}.json`, items);

    // Respond to the webhook.
    res.send('Webhook received');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
