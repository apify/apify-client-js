import { Readable } from 'node:stream';

import type { WebhookUpdateData } from 'apify-client';
import { ApifyApiError } from 'apify-client';
import { afterEach, describe, expect, test, vi } from 'vitest';

import * as utils from '../src/utils.js';

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
                    { fooAt: date, barat: date, deep: { fooAt: date, tooDeep: { fooAt: date } } },
                    { fooAt: date, barat: date, deep: { fooAt: date, tooDeep: { fooAt: date } } },
                ],
            },
        };

        const parsed = utils.parseDateFields(JSON.parse(JSON.stringify(original))) as utils.Dictionary<any>;

        for (const item of parsed.data.foo) {
            expect(item.fooAt).toBeInstanceOf(Date);
            expect(typeof item.barat).toBe('string');
            expect(item.fooAt).toEqual(date);
            expect(item.deep.fooAt).toBeInstanceOf(Date);
            expect(typeof item.deep.tooDeep.fooAt).toBe('string');
        }
    });

    test('converts dates nested in an array of a list response item', () => {
        const date = new Date('2019-12-12T07:34:14.202Z');
        const listResponse = {
            total: 1,
            items: [{ id: 'a', createdAt: date, calls: [{ startedAt: date, finishedAt: date }] }],
        };

        const parsed = utils.parseDateFields(JSON.parse(JSON.stringify(listResponse))) as utils.Dictionary<any>;

        expect(parsed.items[0].createdAt).toBeInstanceOf(Date);
        expect(parsed.items[0].calls[0].startedAt).toBeInstanceOf(Date);
        expect(parsed.items[0].calls[0].finishedAt).toBeInstanceOf(Date);
        expect(parsed.items[0].calls[0].startedAt).toEqual(date);
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

    test('returns undefined for non-string non-binary values', async () => {
        expect(await utils.maybeCompressValue({ foo: 'bar' })).toBeUndefined();
        expect(await utils.maybeCompressValue(Readable.from(['x'.repeat(2048)]))).toBeUndefined();
    });

    test('compresses large string using brotli in Node.js', async () => {
        const largeValue = 'x'.repeat(2048);
        const result = await utils.maybeCompressValue(largeValue);
        expect(result).not.toBeUndefined();
        expect(result!.encoding).toBe('br');
        expect(result!.data).toBeInstanceOf(Uint8Array);
        expect(result!.data.byteLength).toBeLessThan(Buffer.byteLength(largeValue));
    });

    test.each([
        { kind: 'Buffer', value: Buffer.alloc(2048, 'a') },
        { kind: 'Uint8Array', value: new Uint8Array(2048).fill(0x61) },
        { kind: 'ArrayBuffer', value: new Uint8Array(2048).fill(0x61).buffer },
    ])('compresses a large $kind using brotli in Node.js', async ({ value }) => {
        const result = await utils.maybeCompressValue(value);
        expect(result).not.toBeUndefined();
        expect(result!.encoding).toBe('br');
        expect(result!.data).toBeInstanceOf(Uint8Array);
        expect(result!.data.byteLength).toBeLessThan(2048);
    });
});

describe('utils.bytesToBase64()', () => {
    test('matches the Node.js encoding for an input longer than one slice', () => {
        const bytes = new Uint8Array(100_000).map((_, i) => i * 7919);
        expect(utils.bytesToBase64(bytes)).toBe(Buffer.from(bytes).toString('base64'));
    });

    test('encodes an empty input', () => {
        expect(utils.bytesToBase64(new Uint8Array())).toBe('');
    });
});

describe('utils.concatBytes()', () => {
    test('joins the chunks in order', () => {
        const chunks = [new Uint8Array([1, 2]), new Uint8Array(), new Uint8Array([3])];
        expect(utils.concatBytes(chunks)).toEqual(new Uint8Array([1, 2, 3]));
    });
});

describe('utils.getEnv()', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    test('reads an environment variable', () => {
        expect(utils.getEnv('APIFY_CLIENT_TEST_VARIABLE')).toBeUndefined();
        vi.stubEnv('APIFY_CLIENT_TEST_VARIABLE', 'value');
        expect(utils.getEnv('APIFY_CLIENT_TEST_VARIABLE')).toBe('value');
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

    test('encodes multi-byte characters in a payload longer than one base64 slice', () => {
        const webhooks: WebhookUpdateData[] = [{ description: 'Příliš žluťoučký kůň '.repeat(4000) }];
        const base64String = utils.stringifyWebhooksToBase64(webhooks)!;

        expect(base64String).toBe(Buffer.from(JSON.stringify(webhooks), 'utf8').toString('base64'));
    });
});
