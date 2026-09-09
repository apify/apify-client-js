import type http from 'node:http';
import type { Socket } from 'node:net';
import os from 'node:os';
import { promisify } from 'node:util';
import { brotliCompress, constants, gzip } from 'node:zlib';

import type { Runtime } from './types.js';

const brotliCompressAsync = promisify(brotliCompress);
const gzipAsync = promisify(gzip);

const BROTLI_OPTIONS = { params: { [constants.BROTLI_PARAM_QUALITY]: 6 } };

/**
 * The Node.js implementation of {@link Runtime}. Deno and Bun resolve the `node` export condition too and
 * provide the built-ins it uses.
 */
export const runtime: Runtime = {
    isNode: true,

    platform: `${os.platform()}; Node/${process.version}`,

    async compress(data) {
        try {
            return { data: await brotliCompressAsync(data, BROTLI_OPTIONS), encoding: 'br' };
        } catch {
            // Runtimes that only provide a partial `node:zlib` (Node.js compatibility shims) may not implement
            // brotli, but usually do implement gzip.
        }

        try {
            return { data: await gzipAsync(data), encoding: 'gzip' };
        } catch {
            return undefined;
        }
    },

    async createHttpAgents({ timeoutMillis }) {
        // Loaded on the first request rather than with the client: the proxy support pulls in a sizeable
        // dependency tree that a client which never sends a request should not pay for.
        const { ProxyAgent } = await import('proxy-agent');

        // We want to keep sockets alive for better performance.
        // Enhanced agent configuration based on agentkeepalive best practices:
        // - Nagle's algorithm disabled for lower latency
        // - Free socket timeout to prevent socket leaks
        // - LIFO scheduling to reuse recent sockets
        // - Socket TTL for connection freshness
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
