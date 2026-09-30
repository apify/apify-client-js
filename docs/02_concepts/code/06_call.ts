import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

const actorClient = client.actor('username/actor-name');

// Start an Actor and wait for it to finish.
const finishedActorRun = await actorClient.call();

// Start an Actor and wait up to 60 seconds for it to finish.
const actorRun = await actorClient.start(undefined, { waitForFinish: 60 });

// Wait for an already started run to finish.
const finishedRun = await client.run(actorRun.id).waitForFinish();
