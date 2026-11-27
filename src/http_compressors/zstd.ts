import { z } from 'zod';

import { runtime } from '#runtime';
import { parseArgument } from '../utils.js';
import type { HttpCompressor } from './base.js';

/** Lowest valid zstd quality, the fastest with the least compression. */
const MIN_QUALITY = 1;

/**
 * Highest quality the compressor accepts. zstd itself goes up to 22, but levels 20 to 22 use a window above the 8 MB
 * that RFC 9659 requires HTTP decoders to support, so a record stored at those levels could fail to decode in a
 * browser that accepts zstd. Level 19 is the last one within the limit.
 */
const MAX_QUALITY = 19;

/** zstd's own default. Fast, with a ratio close to gzip at its best level. */
const DEFAULT_QUALITY = 3;

const optionsSchema = z.strictObject({
    quality: z.int().min(MIN_QUALITY).max(MAX_QUALITY).default(DEFAULT_QUALITY),
});

/**
 * Compresses request bodies using zstd.
 *
 * Built on the `node:zlib` module, so it works wherever the client runs on Node.js.
 *
 * @example
 * ```javascript
 * import { ApifyClient, ZstdHttpCompressor } from 'apify-client';
 *
 * const client = new ApifyClient({ token: 'my-token', compression: new ZstdHttpCompressor({ quality: 19 }) });
 * ```
 */
export class ZstdHttpCompressor implements HttpCompressor {
    readonly contentEncoding = 'zstd';

    readonly #quality: number;

    /**
     * @param options - Compressor options.
     * @throws {ArgumentValidationError} If `quality` is out of the valid range.
     */
    constructor(options: ZstdHttpCompressorOptions = {}) {
        const { quality } = parseArgument(options, optionsSchema, 'ZstdHttpCompressorOptions');
        this.#quality = quality;
    }

    async compress(data: Buffer): Promise<Buffer> {
        return runtime.compress(data, { algorithm: 'zstd', quality: this.#quality });
    }
}

/**
 * Options for {@link ZstdHttpCompressor}.
 */
export interface ZstdHttpCompressorOptions {
    /**
     * Compression level, from `1` (the fastest) to `19` (the best compression). zstd's levels 20 to 22 are not
     * accepted: their window exceeds the 8 MB that HTTP decoders are required to support.
     * @default 3
     */
    quality?: number;
}
