import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Retry the start until the account has the resources for the run.
const run = await client.actor('username/actor-name').call(undefined, { waitForResources: true });

// Stop retrying after 10 minutes and throw the last error.
const startedRun = await client.task('username~task-name').start(undefined, { waitForResources: 600 });
