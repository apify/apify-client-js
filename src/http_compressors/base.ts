import { z } from 'zod';

/**
 * Strategy for compressing HTTP request bodies.
 *
 * Extend this class to create a custom compressor. Set `contentEncoding` to the value that should be sent in the
 * `Content-Encoding` header and implement `compress()`. The client calls it only for bodies that are large enough
 * to benefit from compression, whose content type does not already carry its own compression, and which the caller
 * did not send with a `Content-Encoding` of their own.
 *
 * @example
 * ```javascript
 * import { ApifyClient, HttpCompressor } from 'apify-client';
 *
 * class IdentityCompressor extends HttpCompressor {
 *     contentEncoding = 'identity';
 *
 *     async compress(data) {
 *         return data;
 *     }
 * }
 *
 * const client = new ApifyClient({ token: 'my-token', compression: new IdentityCompressor() });
 * ```
 */
export abstract class HttpCompressor {
    /** Value sent in the `Content-Encoding` header, for example `gzip` or `br`. */
    abstract readonly contentEncoding: string;

    /**
     * Compresses a request body.
     *
     * @param data - The raw bytes to compress.
     * @returns The compressed bytes.
     */
    abstract compress(data: Buffer): Promise<Buffer>;
}

/**
 * Schema accepting an {@link HttpCompressor} by shape, so an instance of the class from another copy of the package
 * passes too.
 * @internal
 */
export const httpCompressorSchema = z.custom<HttpCompressor>(
    (value) =>
        typeof value === 'object' &&
        value !== null &&
        typeof (value as HttpCompressor).contentEncoding === 'string' &&
        typeof (value as HttpCompressor).compress === 'function',
    { error: 'Invalid input: expected an HttpCompressor' },
);
