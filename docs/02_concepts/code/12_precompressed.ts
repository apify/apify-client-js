import { readFile } from 'node:fs/promises';

import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// A file that is gzipped on disk already.
const report = await readFile('report.json.gz');

// The explicit content encoding stops the client from compressing the bytes again.
await client.httpClient.call({
    url: `${client.baseUrl}/key-value-stores/MY-KVS-ID/records/report.json`,
    method: 'PUT',
    data: report,
    headers: { 'content-type': 'application/json', 'content-encoding': 'gzip' },
    timeoutSecs: 'long',
});
