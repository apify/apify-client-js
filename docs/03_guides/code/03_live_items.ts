import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Start the Actor without waiting for it to finish.
const run = await client.actor('username/actor-name').start({ query: 'web scraping' });

// Each item arrives shortly after the run pushes it. The loop ends once the run
// has finished and every item is read.
for await (const item of client.run(run.id).iterateDatasetItems({ skipEmpty: true })) {
    console.log(item);
}
