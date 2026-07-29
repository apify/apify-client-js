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
