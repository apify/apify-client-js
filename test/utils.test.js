import { gunzipSync } from 'zlib';
import _ from 'lodash';
import ApifyClientError, {

    REQUEST_FAILED_ERROR_TYPE,
    REQUEST_FAILED_ERROR_MESSAGE,

    NOT_FOUND_STATUS_CODE,
} from '../build/apify_error';
import * as utils from '../build/utils';

describe('utils.safeJsonParse()', () => {
    test('works', () => {
        expect(utils.safeJsonParse('{ "foo": "bar" }')).toEqual({ foo: 'bar' });
        expect(utils.safeJsonParse('{ "foo" "bar" }')).toEqual({});
        expect(utils.safeJsonParse('{')).toEqual({});
    });
});

describe('utils.newApifyClientErrorFromResponse()', () => {
    test('works with body as object', () => {
        const details = { statusCode: 404 };
        const error = utils.newApifyClientErrorFromResponse({ type: 'SOME_TYPE', message: 'Some message.' }, details);
        expect(error.details).toEqual(details);
        expect(error.type).toEqual('SOME_TYPE');
        expect(error.message).toEqual('Some message.');
    });

    test('works with body as JSON string', () => {
        const error = utils.newApifyClientErrorFromResponse(
            JSON.stringify({ type: 'SOME_TYPE', message: 'Some message.' }), { statusCode: 404 },
        );
        expect(error.details.statusCode).toEqual(404);
        expect(error.type).toEqual('SOME_TYPE');
        expect(error.message).toEqual('Some message.');
    });

    test('works withhout type and message in body', () => {
        const error = utils.newApifyClientErrorFromResponse({ foo: 'bar' }, { statusCode: 404 });
        expect(error.details.statusCode).toEqual(404);
        expect(error.type).toEqual(REQUEST_FAILED_ERROR_TYPE);
        expect(error.message).toEqual(REQUEST_FAILED_ERROR_MESSAGE);
    });

    test('works withhout type in body', () => {
        const error = utils.newApifyClientErrorFromResponse({ foo: 'bar', message: 'Some message.' }, { statusCode: 404 });
        expect(error.details.statusCode).toEqual(404);
        expect(error.type).toEqual(REQUEST_FAILED_ERROR_TYPE);
        expect(error.message).toEqual('Some message.');
    });

    test('works withhout message in body', () => {
        const error = utils.newApifyClientErrorFromResponse({ foo: 'bar', type: 'SOME_TYPE' }, { statusCode: 404 });
        expect(error.details.statusCode).toEqual(404);
        expect(error.type).toEqual('SOME_TYPE');
        expect(error.message).toEqual(REQUEST_FAILED_ERROR_MESSAGE);
    });

    test('works with error as subobject', () => {
        const error = utils.newApifyClientErrorFromResponse({ error: { type: 'SOME_TYPE', message: 'Some message.' } }, { statusCode: 404 });
        expect(error.details.statusCode).toEqual(404);
        expect(error.type).toEqual('SOME_TYPE');
        expect(error.message).toEqual('Some message.');
    });
});

describe('utils.checkParamOrThrow()', () => {
    test('works when type is correct', () => {
        function aaa() {}

        utils.checkParamOrThrow(2, 'paramName1', 'Number');
        utils.checkParamOrThrow(2, 'paramName2', 'Maybe Number');
        utils.checkParamOrThrow(null, 'paramName3', 'Maybe Number');

        utils.checkParamOrThrow(Buffer.alloc(120), 'paramName4', 'Buffer');
        utils.checkParamOrThrow(null, 'paramName5', 'Maybe Buffer');
        utils.checkParamOrThrow(Buffer.alloc(120), 'paramName6', 'Buffer|String');
        utils.checkParamOrThrow('aaa', 'paramName7', 'Buffer|String');
        utils.checkParamOrThrow(null, 'paramName8', 'Maybe Buffer|String');
        utils.checkParamOrThrow(Buffer.alloc(120), 'paramName8', 'Maybe Buffer|String');
        utils.checkParamOrThrow('aaa', 'paramName9', 'Maybe Buffer|String');
        utils.checkParamOrThrow(() => {}, 'paramName10', 'Function');
        utils.checkParamOrThrow(aaa, 'paramName11', 'Function');
        utils.checkParamOrThrow(null, 'paramName12', 'Maybe Function|String');
        utils.checkParamOrThrow(null, 'paramName13', 'Maybe Function');
        utils.checkParamOrThrow(_.isFunction, 'paramName14', 'Function');
        utils.checkParamOrThrow(() => {}, 'paramName15', 'Function');
    });

    test('throws correct error', () => {
        expect(
            () => utils.checkParamOrThrow(2, 'paramName10', 'String'),
        ).toThrowError('Parameter "paramName10" of type String must be provided');
        expect(
            () => utils.checkParamOrThrow(2, 'paramName11', 'String', 'Error message'),
        ).toThrowError('Error message');
        expect(
            () => utils.checkParamOrThrow(2, 'paramName12', 'Maybe Buffer'),
        ).toThrowError('Parameter "paramName12" of type Maybe Buffer must be provided');
        expect(
            () => utils.checkParamOrThrow(null, 'paramName13', 'Buffer'),
        ).toThrowError('Parameter "paramName13" of type Buffer must be provided');
        expect(
            () => utils.checkParamOrThrow(Buffer.alloc(120), 'paramName14', 'String'),
        ).toThrowError('Parameter "paramName14" of type String must be provided');
        expect(
            () => utils.checkParamOrThrow(Buffer.alloc(120), 'paramName15', 'Function'),
        ).toThrowError('Parameter "paramName15" of type Function must be provided');
    });
});

describe('utils.pluckData()', () => {
    test('works', () => {
        expect(utils.pluckData({ foo: 'bar', data: 'something' })).toEqual('something');
        expect(utils.pluckData({ foo: 'bar' })).toEqual(null);
        expect(utils.pluckData(1)).toEqual(null);
        expect(utils.pluckData('string')).toEqual(null);
        expect(utils.pluckData(null)).toEqual(null);
        expect(utils.pluckData(undefined)).toEqual(null);
    });
});

describe('utils.catchNotFoundOrThrow()', () => {
    test('works', () => {
        const notFoundError = new ApifyClientError('not-found', 'Some message', { statusCode: NOT_FOUND_STATUS_CODE });
        const otherError = new ApifyClientError('any-error', 'Some message', { statusCode: 555 });
        const otherGenericError = new Error('blabla');

        expect(utils.catchNotFoundOrThrow(notFoundError)).toEqual(null);
        expect(() => utils.catchNotFoundOrThrow(otherError)).toThrowError(otherError);
        expect(() => utils.catchNotFoundOrThrow(otherGenericError)).toThrowError(otherGenericError);
    });
});

describe('utils.gzipPromise()', () => {
    test('works', () => {
        const buffer = Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]);
        const str = 'foobar';

        const testBuffer = utils
            .gzipPromise(buffer)
            .then(gzipped => gunzipSync(gzipped))
            .then(ungzipped => expect(ungzipped).toEqual(buffer));

        const testString = utils
            .gzipPromise(str)
            .then(gzipped => gunzipSync(gzipped))
            .then(ungzipped => expect(ungzipped.toString()).toEqual(str));

        return Promise.all([testBuffer, testString]);
    });
});

describe('utils.parseBody()', () => {
    test('works', () => {
        const { parseBody } = utils;

        const inputObj = { foo: 'bar' };
        const inputJson = JSON.stringify(inputObj);
        const inputJsonBuffer = Buffer.from(inputJson);
        const inputStr = 'some string';
        const inputBuffer = Buffer.from(inputStr);

        expect(parseBody(inputJson, 'application/json')).toEqual(inputObj);
        expect(parseBody(inputJsonBuffer, 'application/json')).toEqual(inputObj);
        expect(parseBody(inputJsonBuffer, 'application/json; charset=something')).toEqual(inputObj);
        expect(parseBody(inputJsonBuffer, 'application/json; charset=utf-8')).toEqual(inputObj);
        expect(parseBody(inputJson, 'application/something')).toEqual(inputJson);

        expect(parseBody(inputBuffer, 'text/plain')).toEqual(inputStr);
        expect(parseBody(inputBuffer, 'text/plain; charset=something')).toEqual(inputStr);
        expect(parseBody(inputBuffer, 'text/plain; charset=utf-8')).toEqual(inputStr);
        expect(parseBody(inputBuffer, 'text/xxxxx; charset=utf-8')).toEqual(inputStr);
        expect(parseBody(inputBuffer, 'text/something')).toEqual(inputStr);

        expect(parseBody(inputBuffer, 'text/html')).toEqual(inputStr);
        expect(parseBody(inputBuffer, 'text/html; charset=something')).toEqual(inputStr);
        expect(parseBody(inputBuffer, 'text/html; charset=utf-8')).toEqual(inputStr);

        expect(parseBody(inputBuffer, 'application/xml')).toEqual(inputStr);
        expect(parseBody(inputBuffer, 'application/xml; charset=something')).toEqual(inputStr);
        expect(parseBody(inputBuffer, 'application/xml; charset=utf-8')).toEqual(inputStr);
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
