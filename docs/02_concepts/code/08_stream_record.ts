import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';

import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// With `stream: true`, the record value is a Node.js `Readable`.
const record = await client.keyValueStore('MY-KVS-ID').getRecord('video.mp4', { stream: true });

if (record) {
    await pipeline(record.value, createWriteStream('video.mp4'));
}
