import type { Runtime } from './types.js';

/**
 * The {@link Runtime} for browsers and edge runtimes, built on Web APIs only.
 */
export const runtime: Runtime = {
    isNode: false,

    // Browsers do not let a page set the `User-Agent` header.
    platform: undefined,

    // No request compression: brotli and gzip have no Web API, and a `content-encoding` request header is not
    // on the list of headers the Apify API allows in a cross-origin request, so a browser would fail the
    // preflight. The client compresses in Node.js alone, so nothing reaches this.
    async compress(): Promise<never> {
        throw new Error('Request body compression is only available in Node.js.');
    },

    // The XHR and fetch adapters of axios do not use agents.
    async createHttpAgents() {
        return undefined;
    },
};
