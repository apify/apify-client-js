import { z } from 'zod';

import { runtime } from '#runtime';
import { parseArgument } from '../utils.js';
import type { HttpCompressor } from './base.js';

/** Lowest valid gzip quality, the fastest with the least compression. */
const MIN_QUALITY = 1;

/** Highest valid gzip quality, the slowest with the best compression. */
const MAX_QUALITY = 9;

/** zlib's own default. The levels above it roughly double the CPU cost for about a percent fewer bytes. */
const DEFAULT_QUALITY = 6;

const optionsSchema = z.strictObject({
    quality: z.int().min(MIN_QUALITY).max(MAX_QUALITY).default(DEFAULT_QUALITY),
});

/**
 * Compresses request bodies using gzip.
 *
 * Built on the `node:zlib` module, so it works wherever the client runs on Node.js.
 *
 * @example
 * ```javascript
 * import { ApifyClient, GzipHttpCompressor } from 'apify-client';
 *
 * const client = new ApifyClient({ token: 'my-token', compression: new GzipHttpCompressor({ quality: 1 }) });
 * ```
 */
export class GzipHttpCompressor implements HttpCompressor {
    readonly contentEncoding = 'gzip';

    readonly #quality: number;

    /**
     * @param options - Compressor options.
     * @throws {ArgumentValidationError} If `quality` is out of the valid range.
     */
    constructor(options: GzipHttpCompressorOptions = {}) {
        const { quality } = parseArgument(options, optionsSchema, 'GzipHttpCompressorOptions');
        this.#quality = quality;
    }

    async compress(data: Buffer): Promise<Buffer> {
        return runtime.compress(data, { algorithm: 'gzip', quality: this.#quality });
    }
}

/**
 * Options for {@link GzipHttpCompressor}.
 */
export interface GzipHttpCompressorOptions {
    /**
     * Compression level, from `1` (the fastest) to `9` (the best compression).
     * @default 6
     */
    quality?: number;
}
