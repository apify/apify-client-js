import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Define the input for the Actor.
const input = { some: 'input' };

// Start an Actor and wait for it to finish.
const run = await client.actor('username/actor-name').call(input);
