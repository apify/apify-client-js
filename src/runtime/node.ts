import type http from 'node:http';
import type { Socket } from 'node:net';
import os from 'node:os';
import { brotliCompress, constants, gzip } from 'node:zlib';

import type { Runtime } from './types.js';

/**
 * The Node.js implementation of {@link Runtime}. Deno and Bun resolve the `node` condition too and
 * provide the built-ins it uses.
 */
export const runtime: Runtime = {
    isNode: true,

    platform: `${os.platform()}; Node/${process.version}`,

    async compress(data, { algorithm, quality }) {
        return new Promise((resolve, reject) => {
            const done = (error: Error | null, result: Buffer) => (error ? reject(error) : resolve(result));
            if (algorithm === 'br') {
                brotliCompress(data, { params: { [constants.BROTLI_PARAM_QUALITY]: quality } }, done);
            } else {
                gzip(data, { level: quality }, done);
            }
        });
    },

    async createHttpAgents({ timeoutMillis }) {
        // Loaded on the first request rather than with the client: the proxy support pulls in a sizeable
        // dependency tree that a client which never sends a request should not pay for.
        const { ProxyAgent } = await import('proxy-agent');

        // We want to keep sockets alive for better performance.
        const agentOptions: http.AgentOptions & { scheduling?: 'lifo' | 'fifo' } = {
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
        };

        // ProxyAgent picks the proxy up from the environment variables and supports CONNECT tunneling.
        const agent = new ProxyAgent(agentOptions);

        // Disable Nagle's algorithm for lower latency
        // This sends data immediately instead of buffering small packets
        agent.on('socket', (socket: Socket) => {
            socket.setNoDelay(true);
        });

        return { httpAgent: agent, httpsAgent: agent };
    },
};
