import { readFile } from 'node:fs/promises';

import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

const screenshot = await readFile('screenshot.png');

// The explicit content type lets the client skip compressing the PNG.
await client.keyValueStore('MY-KVS-ID').setRecord({
    key: 'screenshot.png',
    value: screenshot,
    contentType: 'image/png',
});
