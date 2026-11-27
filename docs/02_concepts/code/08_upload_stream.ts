import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

const record = await client.keyValueStore('source-store').getRecord('video.mp4', { stream: true });

if (record) {
    // The stream goes straight from one store to the other.
    await client.keyValueStore('target-store').setRecord({
        key: record.key,
        value: record.value,
        contentType: record.contentType,
    });
}
