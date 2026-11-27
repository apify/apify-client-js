import type { Runtime } from './types.js';

/**
 * The {@link Runtime} for browsers and edge runtimes, built on Web APIs only.
 */
export const runtime: Runtime = {
    isNode: false,

    fetchFailsWithCause: false,

    // Browsers do not let a page set the `User-Agent` header.
    platform: undefined,

    // No request compression: brotli, gzip and zstd have no Web API, and a `content-encoding` request header is not
    // on the list of headers the Apify API allows in a cross-origin request, so a browser would fail the
    // preflight. The client compresses in Node.js alone, so nothing reaches this.
    async compress(): Promise<never> {
        throw new Error('Request body compression is only available in Node.js.');
    },

    // The XHR and fetch adapters of axios do not use agents.
    async createHttpAgents() {
        return undefined;
    },

    streamToWeb(): never {
        throw new Error('A Readable stream is only available in Node.js.');
    },

    // A browser applies the proxy settings of the system on its own.
    unusedProxyHint() {
        return undefined;
    },

    openBlobBody(blob) {
        return blob;
    },

    openStreamBody(stream) {
        if (!canSendStreamBody()) {
            throw new TypeError(
                'This runtime cannot send a ReadableStream as a request body. ' +
                    'Read it into a Blob or bytes first, for example with `await new Response(stream).blob()`.',
            );
        }
        return stream;
    },
};

/**
 * Whether `fetch` sends a `ReadableStream` body as a stream. A runtime that does not, such as Firefox and Safari,
 * never reads the `duplex` option and sends the stream converted to a string, under a text content type.
 */
function canSendStreamBody(): boolean {
    // Cloudflare Workers, Deno and Bun stream such a body too, without ever reading `duplex`.
    if (/^(Cloudflare-Workers$|Deno\/|Bun\/)/.test(globalThis.navigator?.userAgent ?? '')) return true;

    let duplexRead = false;
    try {
        const request = new Request('https://api.apify.com', {
            method: 'POST',
            body: new ReadableStream(),
            get duplex() {
                duplexRead = true;
                return 'half';
            },
        } as RequestInit);
        return duplexRead && !request.headers.has('content-type');
    } catch {
        return false;
    }
}
