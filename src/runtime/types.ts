import type http from 'node:http';
import type https from 'node:https';

/**
 * What to compress a request body with, as the built-in `HttpCompressor` implementations ask for it.
 * @internal
 */
export interface CompressionOptions {
    /** Algorithm to compress with, named by the `Content-Encoding` value it produces. */
    algorithm: 'br' | 'gzip';
    /** Compression level, in the range the algorithm defines. */
    quality: number;
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
 * condition and to the Web API one everywhere else (see the `imports` field of `package.json`), so a bundler
 * targeting a browser or an edge runtime never sees the Node.js built-ins the Node.js one uses.
 * @internal
 */
export interface Runtime {
    /**
     * Whether the Node.js implementation was selected, which the `node` condition settles when `#runtime` is
     * resolved - so a Node.js application bundled for a browser or a neutral target reports `false`. Log
     * streaming, the `stream` record option and request body compression are gated on it.
     */
    isNode: boolean;
    /**
     * The platform part of the `User-Agent` header, or `undefined` where the runtime does not let a client
     * set that header (browsers).
     */
    platform: string | undefined;
    /**
     * Compresses a request body. The built-in compressors go through it, so a bundle for a browser or an edge
     * runtime carries no `node:zlib`. Throws where the runtime has no compression, which the client never
     * reaches, since it compresses only where {@link isNode} holds.
     */
    compress(data: Uint8Array, options: CompressionOptions): Promise<Buffer>;
    /**
     * Creates the agents axios's Node.js adapter sends requests through, or resolves to `undefined` where
     * axios does not use agents.
     */
    createHttpAgents(options: { timeoutMillis: number }): Promise<HttpAgents | undefined>;
}
