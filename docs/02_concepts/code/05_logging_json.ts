import { LoggerJson } from '@apify/log';
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Print every log line as a JSON object, for log collectors that parse structured output.
client.logger.setOptions({ logger: new LoggerJson() });
