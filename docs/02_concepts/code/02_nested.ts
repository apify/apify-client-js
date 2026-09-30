import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

const actorClient = client.actor('username/actor-name');
const runsClient = actorClient.runs();

// List the last 10 runs of the Actor.
const { items: runs } = await runsClient.list({ limit: 10, desc: true });

// Select the last run of the Actor that finished with a SUCCEEDED status.
const lastSucceededRunClient = actorClient.lastRun({ status: 'SUCCEEDED' });

// Fetch items from the run's dataset.
const { items } = await lastSucceededRunClient.dataset().listItems();
