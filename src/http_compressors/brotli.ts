import { z } from 'zod';

import { parseArgument } from '../utils.js';
import { HttpCompressor } from './base.js';

/** Lowest valid brotli quality, the fastest with the least compression. */
const MIN_QUALITY = 0;

/** Highest valid brotli quality, the slowest with the best compression. */
const MAX_QUALITY = 11;

/** Middle of the range, where brotli already beats gzip at a comparable CPU cost. */
const DEFAULT_QUALITY = 6;

const optionsSchema = z.strictObject({
    quality: z.int().min(MIN_QUALITY).max(MAX_QUALITY).default(DEFAULT_QUALITY),
});

/**
 * Compresses request bodies using brotli.
 *
 * Uses the `node:zlib` module, so it works wherever the client runs on Node.js.
 *
 * @example
 * ```javascript
 * import { ApifyClient, BrotliHttpCompressor } from 'apify-client';
 *
 * const client = new ApifyClient({ token: 'my-token', compression: new BrotliHttpCompressor({ quality: 11 }) });
 * ```
 */
export class BrotliHttpCompressor extends HttpCompressor {
    readonly contentEncoding = 'br';

    readonly #quality: number;

    /**
     * @param options - Compressor options.
     * @throws {ArgumentValidationError} If `quality` is out of the valid range.
     */
    constructor(options: BrotliHttpCompressorOptions = {}) {
        super();
        const { quality } = parseArgument(options, optionsSchema, 'BrotliHttpCompressorOptions');
        this.#quality = quality;
    }

    async compress(data: Buffer): Promise<Buffer> {
        const { brotliCompress, constants } = await import('node:zlib');
        const options = { params: { [constants.BROTLI_PARAM_QUALITY]: this.#quality } };

        return new Promise((resolve, reject) => {
            brotliCompress(data, options, (error, result) => (error ? reject(error) : resolve(result)));
        });
    }
}

/**
 * Options for {@link BrotliHttpCompressor}.
 */
export interface BrotliHttpCompressorOptions {
    /**
     * Compression level, from `0` (the fastest) to `11` (the best compression).
     * @default 6
     */
    quality?: number;
}
