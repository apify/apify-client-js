import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

await client.webhooks().create({
    description: 'Instagram hashtag Actor succeeded',
    // The Actor ID of apify/instagram-hashtag-scraper.
    condition: { actorId: 'reGe1ST3OBgYZSsZJ' },
    // Generate a request URL at https://webhook.site, or point it at any REST server.
    requestUrl: 'https://webhook.site/CUSTOM_WEBHOOK_ID',
    eventTypes: ['ACTOR.RUN.SUCCEEDED'],
});
