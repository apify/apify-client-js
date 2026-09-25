import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Collection clients don't take a parameter.
const actorCollectionClient = client.actors();

// Create an Actor with the name my-actor.
const myActor = await actorCollectionClient.create({ name: 'my-actor' });

// List your Actors, both your own and the ones from Apify Store you've used.
const { items } = await actorCollectionClient.list();
