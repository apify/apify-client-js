import { LogLevel } from '@apify/log';
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Print errors only. `LogLevel.OFF` silences the client entirely.
client.logger.setLevel(LogLevel.ERROR);
