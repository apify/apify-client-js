import { ApifyClient, NotFoundError } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Resolves to `undefined`.
const actor = await client.actor('missing-actor').get();

try {
    await client.run('missing-run').dataset().get();
} catch (error) {
    if (error instanceof NotFoundError) {
        // Either the run or its default dataset doesn't exist.
    }
}
