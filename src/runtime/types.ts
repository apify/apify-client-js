import type http from 'node:http';
import type https from 'node:https';

/**
 * A request body compressed for transport, with the `content-encoding` value that declares it.
 * @internal
 */
export interface CompressedValue {
    data: Uint8Array;
    encoding: 'br' | 'gzip';
}

/**
 * The agents axios's Node.js adapter sends requests through.
 * @internal
 */
export interface HttpAgents {
    httpAgent: http.Agent;
    httpsAgent: https.Agent;
}

/**
 * The runtime-specific part of the client. `#runtime` resolves to the Node.js implementation under the `node`
 * export condition and to the Web API one everywhere else (see the `imports` field of `package.json`), so a
 * bundler targeting a browser or an edge runtime never sees the Node.js built-ins the Node.js one uses.
 * @internal
 */
export interface Runtime {
    /**
     * Whether the client runs on Node.js, or on a runtime that provides its API such as Deno or Bun. The
     * features that need a Node.js `Readable` response - log streaming and the `stream` record option - are
     * gated on it.
     */
    isNode: boolean;
    /**
     * The platform part of the `User-Agent` header, or `undefined` where the runtime does not let a client
     * set that header (browsers).
     */
    platform: string | undefined;
    /**
     * Compresses a request body, or resolves to `undefined` where compression is not available. Compression
     * is a best-effort optimization, so it never throws.
     */
    compress(data: Uint8Array): Promise<CompressedValue | undefined>;
    /**
     * Creates the agents axios's Node.js adapter sends requests through, or resolves to `undefined` where
     * axios does not use agents.
     */
    createHttpAgents(options: { timeoutMillis: number }): Promise<HttpAgents | undefined>;
}
