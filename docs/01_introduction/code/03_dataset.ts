import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Start an Actor and wait for it to finish.
const { defaultDatasetId } = await client.actor('username/actor-name').call();

// List items from the Actor's dataset.
const { items } = await client.dataset(defaultDatasetId).listItems();
console.log(items);
