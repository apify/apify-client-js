import http from 'node:http';
import https from 'node:https';
import os from 'node:os';
import { Readable } from 'node:stream';
import { brotliCompress, constants, gzip, zstdCompress } from 'node:zlib';

import type { Runtime } from './types.js';

const isBunOrDeno = Boolean(process.versions.bun || process.versions.deno);

/**
 * The Node.js implementation of {@link Runtime}. Deno and Bun resolve the `node` condition too and
 * provide the built-ins it uses.
 */
export const runtime: Runtime = {
    isNode: true,

    fetchFailsWithCause: !isBunOrDeno,

    platform: `${os.platform()}; Node/${process.version}`,

    async compress(data, { algorithm, quality }) {
        return new Promise((resolve, reject) => {
            const done = (error: Error | null, result: Buffer) => (error ? reject(error) : resolve(result));
            switch (algorithm) {
                case 'br':
                    brotliCompress(data, { params: { [constants.BROTLI_PARAM_QUALITY]: quality } }, done);
                    break;
                case 'gzip':
                    gzip(data, { level: quality }, done);
                    break;
                case 'zstd':
                    zstdCompress(data, { params: { [constants.ZSTD_c_compressionLevel]: quality } }, done);
                    break;
                default:
                    reject(new Error(`Unrecognized compression algorithm: ${String(algorithm)}`));
            }
        });
    },

    async createHttpAgents({ timeoutMillis }) {
        // We want to keep sockets alive for better performance.
        const agentOptions: http.AgentOptions & { noDelay: boolean } = {
            keepAlive: true,
            // Timeout for inactive sockets
            // Prevents socket leaks from idle connections
            timeout: timeoutMillis,
            // Keep alive timeout for free sockets (15 seconds)
            // Node.js will close unused sockets after this period
            keepAliveMsecs: 15_000,
            // Maximum number of sockets per host
            maxSockets: 256,
            maxFreeSockets: 256,
            // LIFO scheduling - reuse most recently used sockets for better performance
            scheduling: 'lifo',
            // Disable Nagle's algorithm for lower latency. The agent hands the option to `net.createConnection()`.
            noDelay: true,
        };

        return { httpAgent: new http.Agent(agentOptions), httpsAgent: new https.Agent(agentOptions) };
    },

    readableFromWeb(body) {
        if (!body) return Readable.from([]);
        return Readable.fromWeb(body as Parameters<typeof Readable.fromWeb>[0]);
    },

    unusedProxyHint() {
        const names = ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy'].filter((name) => process.env[name]);
        if (names.length === 0) return undefined;
        // The `fetch` of Bun and Deno reads these variables on its own.
        if (isBunOrDeno) return undefined;

        const [major, minor] = process.versions.node.split('.').map(Number);
        const supported = major >= 24 || (major === 22 && minor >= 21);
        const flags = [...process.execArgv, ...(process.env.NODE_OPTIONS ?? '').split(/\s+/)];
        const enabled = process.env.NODE_USE_ENV_PROXY === '1' || flags.includes('--use-env-proxy');
        // An older Node.js ignores the switch, so the proxy stays unused there even with it set.
        if (supported && enabled) return undefined;

        const fix = supported
            ? 'Start Node.js with NODE_USE_ENV_PROXY=1 to send the requests through it.'
            : `Node.js ${process.versions.node} cannot route fetch() through it: upgrade to Node.js 22.21 or 24, ` +
              'then start it with NODE_USE_ENV_PROXY=1.';
        return (
            `The request failed, and the proxy set in ${names[0]} was not used, since fetch() in Node.js ignores the ` +
            `proxy environment variables by default. ${fix} ` +
            'See https://docs.apify.com/api/client/js/docs/concepts/custom-http-clients#proxies for the other options.'
        );
    },

    openBlobBody(blob, onSourceError) {
        return Readable.from(readBlob(blob, onSourceError), { objectMode: false });
    },
};

/**
 * Yields the bytes of a blob. Ending the iteration early, which destroying the `Readable` around it does, cancels
 * the read and releases a file the blob reads from. Only a failing read is reported: an error the `Readable` is
 * destroyed with is thrown in at the `yield` and belongs to the transport. A `for await` loop would surface both at
 * the same place, so the loop calls `next()` itself to catch only the read.
 */
async function* readBlob(blob: Blob, onSourceError: (error: unknown) => void): AsyncGenerator<Uint8Array> {
    const chunks = blob.stream()[Symbol.asyncIterator]();
    try {
        while (true) {
            let chunk: IteratorResult<Uint8Array>;
            try {
                chunk = await chunks.next();
            } catch (error) {
                onSourceError(error);
                throw error;
            }
            if (chunk.done) return;
            yield chunk.value;
        }
    } finally {
        await chunks.return?.();
    }
}
