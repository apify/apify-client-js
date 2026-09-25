import { Log } from '@apify/log';
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });
const actorClient = client.actor('username/actor-name');

// Redirect the run log to a logger with your own prefix.
await actorClient.call(undefined, { log: new Log({ prefix: 'My Actor' }) });

// Turn the redirection off.
await actorClient.call(undefined, { log: null });
