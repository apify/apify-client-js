import type { WebhookUpdateData } from 'apify-client';
import { ApifyApiError } from 'apify-client';
import { describe, expect, test, vi } from 'vitest';

import * as utils from '../src/utils';

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
    test('works', () => {
        const recordNotFoundError = new ApifyApiError(
            { status: 404, data: { error: { type: 'record-not-found' } } } as any,
            0,
        );
        const recordOrTokenNotFoundError = new ApifyApiError(
            {
                status: 404,
                data: { error: { type: 'record-or-token-not-found' } },
            } as any,
            0,
        );
        const otherError = new ApifyApiError({ status: 404, data: { error: { type: 'page-not-found' } } } as any, 0);
        const internalError = new ApifyApiError({ status: 500, data: { error: { type: 'internal-error' } } } as any, 0);
        const otherGenericError = new Error('blabla');

        expect(utils.catchNotFoundOrThrow(recordNotFoundError)).toBeUndefined();
        expect(utils.catchNotFoundOrThrow(recordOrTokenNotFoundError)).toBeUndefined();
        expect(() => utils.catchNotFoundOrThrow(otherError)).toThrowError(otherError);
        expect(() => utils.catchNotFoundOrThrow(internalError)).toThrowError(internalError);
        expect(() => utils.catchNotFoundOrThrow(otherGenericError as any)).toThrowError(otherGenericError);
    });
});

describe('utils.parseDateFields()', () => {
    test('works', () => {
        const date = new Date('2018-01-11T14:44:48.997Z');
        const original = { fooAt: date, barat: date };
        const parsed = utils.parseDateFields(JSON.parse(JSON.stringify(original))) as utils.Dictionary<Date | string>;

        expect(parsed.fooAt).toBeInstanceOf(Date);
        expect(typeof parsed.barat).toBe('string');
        expect(parsed.fooAt).toEqual(date);
    });

    test('works with depth enough', () => {
        const date = new Date('2018-02-22T14:44:48.997Z');
        const original = {
            data: {
                foo: [
                    { fooAt: date, barat: date, tooDeep: { fooAt: date } },
                    { fooAt: date, barat: date, tooDeep: { fooAt: date } },
                ],
            },
        };

        const parsed = utils.parseDateFields(JSON.parse(JSON.stringify(original))) as utils.Dictionary<any>;

        expect(parsed.data.foo[0].fooAt).toBeInstanceOf(Date);
        expect(typeof parsed.data.foo[0].barat).toBe('string');
        expect(typeof parsed.data.foo[0].tooDeep.fooAt).toBe('string');
        expect(parsed.data.foo[0].fooAt).toEqual(date);
        expect(parsed.data.foo[1].fooAt).toBeInstanceOf(Date);
        expect(typeof parsed.data.foo[1].barat).toBe('string');
        expect(typeof parsed.data.foo[1].tooDeep.fooAt).toBe('string');
        expect(parsed.data.foo[1].fooAt).toEqual(date);
    });

    test('does not parse falsy values', () => {
        const original = { fooAt: null, barAt: '' };
        const parsed = utils.parseDateFields(JSON.parse(JSON.stringify(original))) as utils.Dictionary<Date | string>;

        expect(parsed.fooAt).toEqual(null);
        expect(parsed.barAt).toEqual('');
    });

    test('does not mangle non-date strings', () => {
        const original = { fooAt: 'three days ago', barAt: '30+ days' };
        const parsed = utils.parseDateFields(original) as utils.Dictionary<Date | string>;

        expect(parsed.fooAt).toEqual('three days ago');
        expect(parsed.barAt).toEqual('30+ days');
    });

    test('ignores perfectly fine RFC 3339 date', () => {
        const original = { fooAt: 'three days ago', date: '2024-02-18T00:00:00.000Z' };
        const parsed = utils.parseDateFields(original) as utils.Dictionary<Date | string>;

        expect(parsed.fooAt).toEqual('three days ago');
        expect(parsed.date).toEqual('2024-02-18T00:00:00.000Z');
    });

    test('parses custom date field detected by matcher', () => {
        const original = { fooAt: 'three days ago', date: '2024-02-18T00:00:00.000Z' };

        const parsed = utils.parseDateFields(original, (key) => key === 'date') as { fooAt: string; date: Date };

        expect(parsed.fooAt).toEqual('three days ago');
        expect(parsed.date).toBeInstanceOf(Date);
    });

    test('parses custom nested date field detected by matcher', () => {
        const original = { fooAt: 'three days ago', foo: { date: '2024-02-18T00:00:00.000Z' } };

        const parsed = utils.parseDateFields(original, (key) => key === 'date') as { foo: { date: Date } };

        expect(parsed.foo.date).toBeInstanceOf(Date);
    });

    test('does not mangle non-date strings even when detected by matcher', () => {
        const original = { fooAt: 'three days ago', date: '30+ days' };
        const parsed = utils.parseDateFields(original, (key) => key === 'date') as { fooAt: string; date: Date };

        expect(parsed.fooAt).toEqual('three days ago');
        expect(parsed.date).toEqual('30+ days');
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
