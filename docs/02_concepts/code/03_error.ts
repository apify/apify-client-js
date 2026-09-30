import { ApifyApiError, ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

try {
    const { items } = await client.dataset('non-existing-dataset-id').listItems();
} catch (error) {
    if (!(error instanceof ApifyApiError)) throw error;

    // Log the details of the failed request for easier debugging.
    const { message, type, statusCode, clientMethod, path } = error;
    console.log({ message, type, statusCode, clientMethod, path });
}
