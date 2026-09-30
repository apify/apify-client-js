import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Iterate over all Actors you own, fetching as many pages as needed.
for await (const actor of client.actors().list({ my: true })) {
    console.log(actor.id);
}
