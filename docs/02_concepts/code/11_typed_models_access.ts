import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// `get()` resolves to an `Actor`, or to `undefined` when the Actor doesn't exist.
const actor = await client.actor('apify/hello-world').get();

if (actor) {
    console.log(actor.id); // string
    console.log(actor.username); // string
    console.log(actor.isPublic); // boolean
    console.log(actor.createdAt); // Date
    console.log(actor.stats.totalRuns); // number, nested objects are typed all the way down
}
