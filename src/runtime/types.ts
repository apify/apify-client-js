import type http from 'node:http';
import type https from 'node:https';
import type { Readable } from 'node:stream';

/**
 * What to compress a request body with, as the built-in `HttpCompressor` implementations ask for it.
 * @internal
 */
export interface CompressionOptions {
    /** Algorithm to compress with, named by the `Content-Encoding` value it produces. */
    algorithm: 'br' | 'gzip' | 'zstd';
    /** Compression level, in the range the algorithm defines. */
    quality: number;
}

/**
 * The agents the Node.js adapter of axios sends requests through.
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
     * redirection, request body compression and the type of a streamed response are gated on it.
     */
    isNode: boolean;
    /**
     * Whether a failed `fetch` rejects with a `TypeError` that names the network error as its `cause`, which is
     * what Node.js does. Bun and Deno resolve the `node` condition too, and their `fetch` does not.
     */
    fetchFailsWithCause: boolean;
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
     * Creates the keep-alive agents the Node.js adapter of axios sends requests through, or resolves to `undefined`
     * where axios does not use agents.
     */
    createHttpAgents(options: { timeoutMillis: number }): Promise<HttpAgents | undefined>;
    /**
     * Turns the body of a `fetch` response into the stream a caller reads it from: a `Readable` in Node.js, and
     * the web stream itself where the runtime has no `Readable`. A response without a body gives an empty stream.
     */
    streamFromWeb(body: ReadableStream<Uint8Array> | null): Readable | ReadableStream<Uint8Array>;
    /**
     * Explains how to make `fetch` use the proxy named in the environment variables, or returns `undefined` when
     * none is set, the runtime already honors them, or it has no environment to read.
     */
    unusedProxyHint(): string | undefined;
    /**
     * Opens a `Blob` request body for one attempt. The Node.js implementation reads the blob into a `Readable` and
     * reports an error the blob raises while it is read to `onSourceError` before the stream fails with it, so the
     * pipeline can tell a failing source apart from a failing connection. The Web API one returns the blob itself,
     * which `fetch` and `XMLHttpRequest` read on their own, and never calls `onSourceError`.
     */
    openBlobBody(blob: Blob, onSourceError: (error: unknown) => void): Readable | Blob;
}
