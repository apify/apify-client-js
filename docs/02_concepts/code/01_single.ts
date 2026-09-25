import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Resource clients take the ID of the resource.
const actorClient = client.actor('username/actor-name');

// Fetch the username/actor-name object from the API.
const myActor = await actorClient.get();

// Start a run of username/actor-name and return the run object.
const myActorRun = await actorClient.start();
