import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';

import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Resolves to a Node.js `Readable` with the items serialized to CSV.
const itemsStream = await client.dataset('MY-DATASET-ID').streamItems('csv');

await pipeline(itemsStream, createWriteStream('items.csv'));
