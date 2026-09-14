import type { AddressInfo } from 'node:net';
import { brotliCompressSync, brotliDecompressSync, constants, gunzipSync, gzipSync } from 'node:zlib';

import {
    ApifyClient,
    ArgumentValidationError,
    BrotliHttpCompressor,
    GzipHttpCompressor,
    HttpCompressor,
} from 'apify-client';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';

import { resolveCompressor } from '../src/http_compressors/resolve.js';
import { MIN_COMPRESS_BYTES } from '../src/utils.js';
import { mockServer } from './mock_server/server.js';

const payload = Buffer.from('hello world');

/** Long and repetitive, so the compression quality changes the output bytes. */
const repetitivePayload = Buffer.from('lorem ipsum dolor sit amet '.repeat(500));

describe('GzipHttpCompressor', () => {
    test('reports gzip as its content encoding', () => {
        expect(new GzipHttpCompressor().contentEncoding).toBe('gzip');
    });

    test.each([
        { name: 'the fastest', quality: 1 },
        { name: 'the best', quality: 9 },
    ])('round-trips data at $name quality', async ({ quality }) => {
        const compressed = await new GzipHttpCompressor({ quality }).compress(payload);
        expect(gunzipSync(compressed)).toEqual(payload);
    });

    test('passes the quality through to zlib', async () => {
        const fastest = await new GzipHttpCompressor({ quality: 1 }).compress(repetitivePayload);
        const best = await new GzipHttpCompressor({ quality: 9 }).compress(repetitivePayload);

        expect(fastest).toEqual(gzipSync(repetitivePayload, { level: 1 }));
        expect(best).toEqual(gzipSync(repetitivePayload, { level: 9 }));
    });

    test('defaults to level 6', async () => {
        const compressed = await new GzipHttpCompressor().compress(repetitivePayload);
        expect(compressed).toEqual(gzipSync(repetitivePayload, { level: 6 }));
    });

    test.each([
        { name: 'below the minimum', quality: 0 },
        { name: 'above the maximum', quality: 10 },
        { name: 'negative', quality: -1 },
        { name: 'fractional', quality: 5.5 },
    ])('rejects a quality $name', ({ quality }) => {
        expect(() => new GzipHttpCompressor({ quality })).toThrow(ArgumentValidationError);
    });
});

describe('BrotliHttpCompressor', () => {
    test('reports br as its content encoding', () => {
        expect(new BrotliHttpCompressor().contentEncoding).toBe('br');
    });

    test.each([
        { name: 'the fastest', quality: 0 },
        { name: 'the best', quality: 11 },
    ])('round-trips data at $name quality', async ({ quality }) => {
        const compressed = await new BrotliHttpCompressor({ quality }).compress(payload);
        expect(brotliDecompressSync(compressed)).toEqual(payload);
    });

    test('passes the quality through to zlib', async () => {
        const brotli = (quality: number) =>
            brotliCompressSync(repetitivePayload, { params: { [constants.BROTLI_PARAM_QUALITY]: quality } });

        expect(await new BrotliHttpCompressor({ quality: 0 }).compress(repetitivePayload)).toEqual(brotli(0));
        expect(await new BrotliHttpCompressor({ quality: 11 }).compress(repetitivePayload)).toEqual(brotli(11));
    });

    test('defaults to quality 6', async () => {
        const compressed = await new BrotliHttpCompressor().compress(repetitivePayload);
        expect(compressed).toEqual(
            brotliCompressSync(repetitivePayload, { params: { [constants.BROTLI_PARAM_QUALITY]: 6 } }),
        );
    });

    test.each([
        { name: 'negative', quality: -1 },
        { name: 'above the maximum', quality: 12 },
        { name: 'fractional', quality: 5.5 },
    ])('rejects a quality $name', ({ quality }) => {
        expect(() => new BrotliHttpCompressor({ quality })).toThrow(ArgumentValidationError);
    });
});

describe('resolveCompressor()', () => {
    test("resolves 'gzip' to a GzipHttpCompressor", () => {
        expect(resolveCompressor('gzip')).toBeInstanceOf(GzipHttpCompressor);
    });

    test("resolves 'brotli' to a BrotliHttpCompressor", () => {
        expect(resolveCompressor('brotli')).toBeInstanceOf(BrotliHttpCompressor);
    });

    test('passes an HttpCompressor instance through unchanged', () => {
        const compressor = new BrotliHttpCompressor({ quality: 11 });
        expect(resolveCompressor(compressor)).toBe(compressor);
    });
});

describe('ApifyClient compression option', () => {
    let baseUrl: string;

    beforeAll(async () => {
        const server = await mockServer.start();
        baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
    });

    afterAll(async () => {
        await mockServer.close();
    });

    class IdentityCompressor extends HttpCompressor {
        readonly contentEncoding = 'identity';

        async compress(data: Buffer): Promise<Buffer> {
            return data;
        }
    }

    // Serializes to well above the compression threshold, so the body goes through the compressor.
    const largeBody = Array.from({ length: 200 }, (_, index) => ({ index, url: `https://example.com/item/${index}` }));

    test('defaults to brotli', () => {
        expect(new ApifyClient().httpClient.httpCompressor).toBeInstanceOf(BrotliHttpCompressor);
    });

    test.each([
        { compression: 'gzip', contentEncoding: 'gzip' },
        { compression: 'brotli', contentEncoding: 'br' },
    ] as const)('sends a large body compressed with $compression', async ({ compression, contentEncoding }) => {
        const client = new ApifyClient({ baseUrl, compression, maxRetries: 0 });

        await client.dataset('some-id').pushItems(largeBody);

        // The mock server decodes the body by its `Content-Encoding`, so a body in any other encoding would not
        // parse back into the items.
        const request = mockServer.getLastRequest();
        expect(request?.headers['content-encoding']).toBe(contentEncoding);
        expect(request?.body).toEqual(largeBody);
    });

    test('replaces a caller-set content-length with the size of the compressed body', async () => {
        const client = new ApifyClient({ baseUrl, maxRetries: 0 });
        const body = JSON.stringify(largeBody);

        await client.httpClient.call({
            url: `${baseUrl}/v2/key-value-stores/some-id/records/some-key`,
            method: 'PUT',
            data: body,
            headers: { 'content-type': 'application/json', 'content-length': String(Buffer.byteLength(body)) },
            // A stale content-length leaves the server waiting for bytes that never arrive, so a short timeout
            // turns that into a fast failure instead of a hang.
            timeoutSecs: 5,
        });

        const request = mockServer.getLastRequest();
        expect(request?.headers['content-encoding']).toBe('br');
        expect(Number(request?.headers['content-length'])).toBeLessThan(Buffer.byteLength(body));
        expect(request?.body).toEqual(largeBody);
    });

    test('sends a large body through a custom compressor and labels it with its content encoding', async () => {
        const compressor = new IdentityCompressor();
        const compress = vi.spyOn(compressor, 'compress');
        const client = new ApifyClient({ baseUrl, compression: compressor, maxRetries: 0 });
        expect(client.httpClient.httpCompressor).toBe(compressor);

        await client.dataset('some-id').pushItems(largeBody);

        expect(compress).toHaveBeenCalledOnce();
        const [data] = compress.mock.calls[0];
        expect(Buffer.isBuffer(data)).toBe(true);
        expect(JSON.parse(data.toString())).toEqual(largeBody);
        const request = mockServer.getLastRequest();
        expect(request?.headers['content-encoding']).toBe('identity');
        expect(request?.body).toEqual(largeBody);
    });

    test('fails the request with the error the compressor throws', async () => {
        const compressor = new IdentityCompressor();
        const compress = vi.spyOn(compressor, 'compress').mockRejectedValue(new Error('compression failed'));
        const client = new ApifyClient({ baseUrl, compression: compressor, maxRetries: 2 });

        await expect(client.dataset('some-id').pushItems(largeBody)).rejects.toThrow('compression failed');
        // Retries are on, so a single call is what proves a compressor error is not retried.
        expect(compress).toHaveBeenCalledOnce();
    });

    test('compresses a body of exactly the threshold size', async () => {
        const compressor = new IdentityCompressor();
        const compress = vi.spyOn(compressor, 'compress');
        const client = new ApifyClient({ baseUrl, compression: compressor, maxRetries: 0 });

        await client
            .keyValueStore('some-id')
            .setRecord({ key: 'some-key', value: Buffer.alloc(MIN_COMPRESS_BYTES, 'a') });

        expect(compress).toHaveBeenCalledOnce();
        expect(mockServer.getLastRequest()?.headers['content-encoding']).toBe('identity');
    });

    test.each([
        {
            name: 'a body below the threshold',
            value: Buffer.alloc(MIN_COMPRESS_BYTES - 1, 'a'),
            contentType: 'application/octet-stream',
        },
        { name: 'an already-compressed content type', value: Buffer.alloc(4096, 'a'), contentType: 'image/png' },
    ])('leaves the compressor out for $name', async ({ value, contentType }) => {
        const compressor = new IdentityCompressor();
        const compress = vi.spyOn(compressor, 'compress');
        const client = new ApifyClient({ baseUrl, compression: compressor, maxRetries: 0 });

        await client.keyValueStore('some-id').setRecord({ key: 'some-key', value, contentType });

        expect(compress).not.toHaveBeenCalled();
        expect(mockServer.getLastRequest()?.headers['content-encoding']).toBeUndefined();
    });

    test.each([
        { name: 'an unknown algorithm', compression: 'deflate' },
        { name: 'an object that is not a compressor', compression: { contentEncoding: 'gzip' } },
    ])('rejects $name', ({ compression }) => {
        expect(() => new ApifyClient({ compression: compression as any })).toThrow(ArgumentValidationError);
    });
});
