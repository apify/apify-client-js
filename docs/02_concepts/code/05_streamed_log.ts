import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

const run = await client.actor('username/actor-name').start();
const runClient = client.run(run.id);

// Resolves to `undefined` outside Node.js, where the log can't be streamed.
const streamedLog = await runClient.getStreamedLog();

streamedLog?.start();
await runClient.waitForFinish();
await streamedLog?.stop();
