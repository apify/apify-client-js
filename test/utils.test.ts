import { Readable } from 'node:stream';

import type {
    PaginatedList,
    RequestQueue,
    RequestQueueClientRequestSchema,
    WebhookDispatch,
    WebhookUpdateData,
} from 'apify-client';
import { ApifyApiError, ResponseValidationError } from 'apify-client';
import { describe, expect, test } from 'vitest';

import type { ApifyResponse } from '../src/http_client.js';
import * as schemas from '../src/schemas.js';
import * as utils from '../src/utils.js';
import * as fixtures from './mock_server/fixtures.js';

describe('utils.pluckData()', () => {
    test('works', () => {
        expect(utils.pluckData({ foo: 'bar', data: 'something' } as any)).toEqual('something');
        expect(() => utils.pluckData({ foo: 'bar' } as any)).toThrow();
        expect(() => utils.pluckData(1 as any)).toThrow();
        expect(() => utils.pluckData('string' as any)).toThrow();
        expect(() => utils.pluckData(null as any)).toThrow();
        expect(() => utils.pluckData(undefined as any)).toThrow();
    });
});

describe('utils.catchNotFoundOrThrow()', () => {
    test('swallows a NotFoundError and rethrows anything else', () => {
        const response = (status: number, type: string) => ({ status, data: { error: { type } } }) as any;
        const recordNotFoundError = ApifyApiError.fromResponse(response(404, 'record-not-found'), 0);
        const pageNotFoundError = ApifyApiError.fromResponse(response(404, 'page-not-found'), 0);
        const internalError = ApifyApiError.fromResponse(response(500, 'internal-error'), 0);
        const otherGenericError = new Error('blabla');

        expect(utils.catchNotFoundOrThrow(recordNotFoundError)).toBeUndefined();
        expect(utils.catchNotFoundOrThrow(pageNotFoundError)).toBeUndefined();
        expect(() => utils.catchNotFoundOrThrow(internalError)).toThrowError(internalError);
        expect(() => utils.catchNotFoundOrThrow(otherGenericError as any)).toThrowError(otherGenericError);
    });
});

describe('utils.parseResponse()', () => {
    const response = (data: unknown) =>
        ({ data: { data }, config: { method: 'GET', url: 'https://api.apify.com/v2/x' } }) as unknown as ApifyResponse;
    const iso = '2019-12-12T07:34:14.202Z';

    test('turns every date-time field the specification declares into a Date, however deep it sits', () => {
        const parsed = utils.parseResponse<PaginatedList<WebhookDispatch>>(
            response(fixtures.webhookDispatchList),
            schemas.ListOfWebhookDispatches(),
        );

        expect(parsed.items[0].createdAt).toEqual(new Date(iso));
        expect(parsed.items[0].calls?.[0].startedAt).toEqual(new Date(iso));
    });

    test('leaves a caller-owned blob alone, whatever its fields are named', () => {
        const userData = { finishedAt: iso, nested: { createdAt: iso } };
        const parsed = utils.parseResponse<RequestQueueClientRequestSchema>(
            response({ ...fixtures.request, userData }),
            schemas.Request(),
        );

        expect(parsed.handledAt).toEqual(new Date(fixtures.request.handledAt));
        expect(parsed.userData).toEqual(userData);
    });

    test('accepts a date-time that carries a time-zone offset instead of a `Z`', () => {
        const parsed = utils.parseResponse<RequestQueueClientRequestSchema>(
            response({ ...fixtures.request, handledAt: '2019-06-16T12:23:31.607+02:00' }),
            schemas.Request(),
        );

        expect(parsed.handledAt).toEqual(new Date('2019-06-16T10:23:31.607Z'));
    });

    test('converts a date-time a published model declares where the specification omits it', () => {
        const expireAt = '2019-06-02T17:15:06.751Z';
        const parsed = utils.parseResponse<RequestQueue>(
            response({ ...fixtures.requestQueue, expireAt }),
            schemas.RequestQueue(),
        );

        expect(parsed.expireAt).toEqual(new Date(expireAt));
    });

    test('rejects a date-time field that does not carry an ISO 8601 date', () => {
        const call = () =>
            utils.parseResponse(response({ ...fixtures.request, handledAt: 'three days ago' }), schemas.Request());

        expect(call).toThrow(ResponseValidationError);
        expect(call).toThrow('at `handledAt`');
    });

    test('rejects a date-time that names no time zone, which a bare `new Date()` would read as local time', () => {
        const call = () =>
            utils.parseResponse(
                response({ ...fixtures.request, handledAt: '2019-06-16T10:23:31.607' }),
                schemas.Request(),
            );

        expect(call).toThrow(ResponseValidationError);
        expect(call).toThrow('at `handledAt`');
    });

    test('rejects a null in a date-time field the specification requires', () => {
        const call = () =>
            utils.parseResponse(response({ ...fixtures.requestQueue, createdAt: null }), schemas.RequestQueue());

        expect(call).toThrow(ResponseValidationError);
        expect(call).toThrow('at `createdAt`');
    });
});

describe('utils.maybeCompressValue()', () => {
    test('returns undefined for small values', async () => {
        expect(await utils.maybeCompressValue('small')).toBeUndefined();
    });

    test('returns undefined for non-string non-Buffer values', async () => {
        expect(await utils.maybeCompressValue({ foo: 'bar' })).toBeUndefined();
    });

    test('compresses large string using brotli in Node.js', async () => {
        const largeValue = 'x'.repeat(2048);
        const result = await utils.maybeCompressValue(largeValue);
        expect(result).not.toBeUndefined();
        expect(result!.encoding).toBe('br');
        expect(result!.data).toBeInstanceOf(Buffer);
        expect(result!.data.length).toBeLessThan(Buffer.byteLength(largeValue));
    });

    test('compresses large Buffer using brotli in Node.js', async () => {
        const largeValue = Buffer.alloc(2048, 'a');
        const result = await utils.maybeCompressValue(largeValue);
        expect(result).not.toBeUndefined();
        expect(result!.encoding).toBe('br');
        expect(result!.data).toBeInstanceOf(Buffer);
        expect(result!.data.length).toBeLessThan(largeValue.length);
    });
});

describe('utils.isCompressibleContentType()', () => {
    test.each([
        { name: 'a missing content type', contentType: undefined, compressible: true },
        { name: 'an empty content type', contentType: '', compressible: true },
        { name: 'JSON', contentType: 'application/json', compressible: true },
        { name: 'text with parameters', contentType: 'text/plain; charset=utf-8', compressible: true },
        { name: 'unknown binary', contentType: 'application/octet-stream', compressible: true },
        { name: 'a structured JSON suffix', contentType: 'application/vnd.api+json', compressible: true },
        { name: 'SVG under a compressed prefix', contentType: 'image/svg+xml', compressible: true },
        { name: 'SVG uppercase with parameters', contentType: 'IMAGE/SVG+XML; charset=utf-8', compressible: true },
        { name: 'a raw bitmap under a compressed prefix', contentType: 'image/bmp', compressible: true },
        { name: 'TIFF under a compressed prefix', contentType: 'image/tiff', compressible: true },
        { name: 'raw audio under a compressed prefix', contentType: 'audio/wav', compressible: true },
        { name: 'raw PCM audio in its registered casing', contentType: 'audio/L24', compressible: true },
        { name: 'MIDI event data under a compressed prefix', contentType: 'audio/midi', compressible: true },
        { name: 'the image prefix', contentType: 'image/png', compressible: false },
        { name: 'the video prefix', contentType: 'video/mp4', compressible: false },
        { name: 'the audio prefix', contentType: 'audio/mpeg', compressible: false },
        { name: 'an archive', contentType: 'application/zip', compressible: false },
        { name: 'a gzip archive', contentType: 'application/x-gzip', compressible: false },
        { name: 'a windows zip archive', contentType: 'application/x-zip-compressed', compressible: false },
        { name: 'a zip container with a suffix', contentType: 'application/epub+zip', compressible: false },
        {
            name: 'an office open xml document',
            contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            compressible: false,
        },
        { name: 'a web font', contentType: 'font/woff2', compressible: false },
        { name: 'surrounding whitespace and mixed case', contentType: '  Image/PNG  ', compressible: false },
    ])('reports $name as compressible: $compressible', ({ contentType, compressible }) => {
        expect(utils.isCompressibleContentType(contentType)).toBe(compressible);
    });
});

describe('utils.isBuffer()', () => {
    test('accepts binary values', () => {
        expect(utils.isBuffer(Buffer.from('abc'))).toBe(true);
        expect(utils.isBuffer(new ArrayBuffer(8))).toBe(true);
        expect(utils.isBuffer(new Uint8Array(8))).toBe(true);
        expect(utils.isBuffer(new Float64Array(8))).toBe(true);
    });

    test('rejects DataView and non-binary values', () => {
        expect(utils.isBuffer(new DataView(new ArrayBuffer(8)))).toBe(false);
        expect(utils.isBuffer('abc')).toBe(false);
        expect(utils.isBuffer([0, 1, 2])).toBe(false);
        expect(utils.isBuffer({})).toBe(false);
        expect(utils.isBuffer(null)).toBe(false);
        expect(utils.isBuffer(undefined)).toBe(false);
    });
});

describe('utils.isStream()', () => {
    test('accepts readable streams and stream-like objects', () => {
        expect(utils.isStream(Readable.from(['abc']))).toBe(true);
        expect(utils.isStream({ on: () => {}, pipe: () => {} })).toBe(true);
    });

    test('rejects objects without both stream methods', () => {
        expect(utils.isStream({ on: () => {} })).toBe(false);
        expect(utils.isStream({ on: true, pipe: true })).toBe(false);
        expect(utils.isStream(Buffer.from('abc'))).toBe(false);
        expect(utils.isStream('abc')).toBe(false);
        expect(utils.isStream(null)).toBe(false);
        expect(utils.isStream(undefined)).toBe(false);
    });
});

describe('utils.stringifyWebhooksToBase64()', () => {
    test('works', () => {
        const webhooks: WebhookUpdateData[] = [
            {
                description: 'My webhook',
            },
            {
                isAdHoc: true,
            },
        ];
        const base64String = utils.stringifyWebhooksToBase64(webhooks)!;

        expect(base64String).toBe(Buffer.from(JSON.stringify(webhooks), 'utf8').toString('base64'));
        expect(JSON.parse(Buffer.from(base64String, 'base64').toString('utf8'))).toStrictEqual(webhooks);
    });
});
