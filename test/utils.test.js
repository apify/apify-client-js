const { ApifyApiError } = require('../src/apify_api_error');
const utils = require('../src/utils');

describe('utils.pluckData()', () => {
    test('works', () => {
        expect(utils.pluckData({ foo: 'bar', data: 'something' })).toEqual('something');
        expect(() => utils.pluckData({ foo: 'bar' })).toThrow();
        expect(() => utils.pluckData(1)).toThrow();
        expect(() => utils.pluckData('string')).toThrow();
        expect(() => utils.pluckData(null)).toThrow();
        expect(() => utils.pluckData(undefined)).toThrow();
    });
});

describe('utils.catchNotFoundOrThrow()', () => {
    test('works', () => {
        const recordNotFoundError = new ApifyApiError({ status: 404, data: { error: { type: 'record-not-found' } } });
        const recordOrTokenNotFoundError = new ApifyApiError({ status: 404, data: { error: { type: 'record-or-token-not-found' } } });
        const otherError = new ApifyApiError({ status: 404, data: { error: { type: 'page-not-found' } } });
        const internalError = new ApifyApiError({ status: 500, data: { error: { type: 'internal-error' } } });
        const otherGenericError = new Error('blabla');

        expect(utils.catchNotFoundOrThrow(recordNotFoundError)).toBeUndefined();
        expect(utils.catchNotFoundOrThrow(recordOrTokenNotFoundError)).toBeUndefined();
        expect(() => utils.catchNotFoundOrThrow(otherError)).toThrowError(otherError);
        expect(() => utils.catchNotFoundOrThrow(internalError)).toThrowError(internalError);
        expect(() => utils.catchNotFoundOrThrow(otherGenericError)).toThrowError(otherGenericError);
    });
});

const expectDatesDame = (d1, d2) => expect(d1).toEqual(d2);

describe('utils.parseDateFields()', () => {
    test('works', () => {
        const date = new Date('2018-01-11T14:44:48.997Z');
        const original = { fooAt: date, barat: date };
        const parsed = utils.parseDateFields(JSON.parse(JSON.stringify(original)));

        expect(parsed.fooAt).toBeInstanceOf(Date);
        expect(typeof parsed.barat).toBe('string');
        expectDatesDame(parsed.fooAt, date);
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

        const parsed = utils.parseDateFields(JSON.parse(JSON.stringify(original)));

        expect(parsed.data.foo[0].fooAt).toBeInstanceOf(Date);
        expect(typeof parsed.data.foo[0].barat).toBe('string');
        expect(typeof parsed.data.foo[0].tooDeep.fooAt).toBe('string');
        expectDatesDame(parsed.data.foo[0].fooAt, date);
        expect(parsed.data.foo[1].fooAt).toBeInstanceOf(Date);
        expect(typeof parsed.data.foo[1].barat).toBe('string');
        expect(typeof parsed.data.foo[1].tooDeep.fooAt).toBe('string');
        expectDatesDame(parsed.data.foo[1].fooAt, date);
    });

    test('doesn\'t parse falsy values', () => {
        const original = { fooAt: null, barAt: '' };
        const parsed = utils.parseDateFields(JSON.parse(JSON.stringify(original)));

        expect(parsed.fooAt).toEqual(null);
        expect(parsed.barAt).toEqual('');
    });

    test('doesn\'t mangle non-date strings', () => {
        const original = { fooAt: 'three days ago', barAt: '30+ days' };
        const parsed = utils.parseDateFields(original);

        expect(parsed.fooAt).toEqual('three days ago');
        expect(parsed.barAt).toEqual('30+ days');
    });
});

describe('utils.stringifyWebhooksToBase64()', () => {
    test('works', () => {
        const webhooks = [
            {
                foo1: 'bar1',
            },
            {
                foo2: 'bar2',
            },
        ];
        const base64String = utils.stringifyWebhooksToBase64(webhooks);

        expect(base64String).toBe(Buffer.from(JSON.stringify(webhooks), 'utf8').toString('base64'));
        expect(JSON.parse(Buffer.from(base64String, 'base64').toString('utf8'))).toStrictEqual(webhooks);
    });
});
