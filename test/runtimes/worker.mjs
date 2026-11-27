// Runs inside Cloudflare's `workerd`, bundled by `workers.mjs`, and reports what the client did there.
import { ApifyApiError, ApifyClient } from '../../dist/index.js';

const sha256 = async (bytes) => {
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

export default {
    async fetch(request) {
        const baseUrl = new URL(request.url).searchParams.get('baseUrl');
        const client = new ApifyClient({ token: 'smoke-token', maxRetries: 3, minDelayBetweenRetriesMillis: 10 });
        const { httpClient } = client;
        httpClient.logger.warning = () => {};
        httpClient.logger.warningOnce = () => {};
        const call = async (config) => httpClient.call({ method: 'GET', ...config });
        const upload = { method: 'PUT', url: `${baseUrl}/echo`, headers: { 'content-type': 'text/plain' } };
        const text = Array.from({ length: 2000 }, (_, index) => `line ${index}\n`).join('');

        const observations = {
            'gets and parses JSON': async () => (await call({ url: `${baseUrl}/ok` })).data.data.id,
            'sends the token': async () => {
                const { data } = await call({ method: 'POST', url: `${baseUrl}/echo`, data: { a: 1 } });
                return data.authorization;
            },
            'retries a server error': async () => {
                const before = httpClient.stats.requests;
                await call({ url: `${baseUrl}/flaky` });
                return httpClient.stats.requests - before;
            },
            'throws an API error': async () => {
                const error = await call({ url: `${baseUrl}/not-found` }).catch((err) => err);
                return error instanceof ApifyApiError ? error.type : String(error);
            },
            'uploads bytes': async () => (await call({ ...upload, data: new TextEncoder().encode(text) })).data.sha256,
            'uploads a web stream': async () =>
                (await call({ ...upload, data: new Blob([text]).stream() })).data.sha256,
            'uploads the web stream of a download': async () => {
                const download = await call({ url: `${baseUrl}/download`, responseType: 'stream' });
                return (await call({ ...upload, data: download.data })).data.sha256;
            },
            'downloads a stream': async () => {
                const { data } = await call({ url: `${baseUrl}/download`, responseType: 'stream' });
                return sha256(await new Response(data).arrayBuffer());
            },
        };

        const results = { 'text sha256': await sha256(new TextEncoder().encode(text)) };
        for (const [name, observe] of Object.entries(observations)) {
            results[name] = await observe().catch((error) => `threw ${error?.stack ?? error}`);
        }
        return Response.json(results);
    },
};
