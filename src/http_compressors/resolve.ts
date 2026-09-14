import { z } from 'zod';

import type { HttpCompressor } from './base.js';
import { httpCompressorSchema } from './base.js';
import { BrotliHttpCompressor } from './brotli.js';
import { GzipHttpCompressor } from './gzip.js';

/**
 * Compression algorithms the `compression` option of {@link ApifyClient} accepts by name. Each name selects the
 * matching built-in compressor with its default quality: `'brotli'` a {@link BrotliHttpCompressor}, `'gzip'` a
 * {@link GzipHttpCompressor}. The Apify API also accepts `deflate` and `identity`, which a custom
 * {@link HttpCompressor} covers.
 */
export type HttpCompressionAlgorithm = 'brotli' | 'gzip';

/**
 * Schema of the `compression` option: an algorithm name or an {@link HttpCompressor} instance.
 * @internal
 */
export const compressionSchema = z.union([
    z.enum(['brotli', 'gzip'] as const satisfies readonly HttpCompressionAlgorithm[]),
    httpCompressorSchema,
]);

/**
 * Turns the `compression` option into a ready-to-use {@link HttpCompressor}: a name into the matching built-in
 * compressor with its default quality, an instance into itself.
 * @internal
 */
export function resolveCompressor(compression: HttpCompressionAlgorithm | HttpCompressor): HttpCompressor {
    if (typeof compression !== 'string') return compression;

    switch (compression) {
        case 'gzip':
            return new GzipHttpCompressor();
        case 'brotli':
            return new BrotliHttpCompressor();
    }
}
