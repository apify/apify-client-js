import { readFile } from 'node:fs/promises';

import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// A file that is gzipped on disk already.
const report = await readFile('report.json.gz');

// The explicit content encoding stops the client from compressing the bytes again.
await client.keyValueStore('MY-KVS-ID').setRecord({
    key: 'report.json',
    value: report,
    contentType: 'application/json',
    contentEncoding: 'gzip',
});
