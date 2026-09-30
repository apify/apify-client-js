import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Resolves to a Node.js `Readable` that follows the log while the run is in progress.
const logStream = await client.run('MY-RUN-ID').log().stream();

if (logStream) {
    for await (const chunk of logStream) {
        process.stdout.write(chunk);
    }
}
