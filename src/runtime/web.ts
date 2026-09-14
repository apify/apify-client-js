import type { Runtime } from './types.js';

/**
 * The {@link Runtime} for browsers and edge runtimes, built on Web APIs only.
 */
export const runtime: Runtime = {
    isNode: false,

    // Browsers do not let a page set the `User-Agent` header.
    platform: undefined,

    // No request compression: brotli has no Web API, and a `content-encoding` request header is not on the
    // list of headers the Apify API allows in a cross-origin request, so a browser would fail the preflight.
    async compress() {
        return undefined;
    },

    // The XHR and fetch adapters of axios do not use agents.
    async createHttpAgents() {
        return undefined;
    },
};
