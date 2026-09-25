import { ApifyClient } from 'apify-client';

// Client initialization with the API token.
const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

const actorClient = client.actor('apify/instagram-hashtag-scraper');

const input = { hashtags: ['rainbow'], resultsLimit: 20 };

// Run the Actor and wait up to 60 seconds for it to finish.
// The input isn't persisted for the next runs.
const run = await actorClient.call(input, { waitSecs: 60 });

console.log(run);
