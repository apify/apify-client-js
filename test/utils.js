import sinon from 'sinon';
import request from 'request-promise-native';
import { gunzipSync } from 'zlib';
import { expect } from 'chai';
import _ from 'underscore';
import ApifyClientError, {
    APIFY_ERROR_NAME,
    REQUEST_FAILED_ERROR_TYPE,
    REQUEST_FAILED_ERROR_MESSAGE,
    INVALID_PARAMETER_ERROR_TYPE,
    NOT_FOUND_STATUS_CODE,
} from '../build/apify_error';
import { newEmptyStats, DEFAULT_RATE_LIMIT_ERRORS } from './_helper';
import * as utils from '../build/utils';

const { CLIENT_USER_AGENT, CONTENT_TYPE_JSON_HEADER } = utils;

describe('utils.safeJsonParse()', () => {
    it('works', () => {
        expect(utils.safeJsonParse('{ "foo": "bar" }')).to.be.eql({ foo: 'bar' });
        expect(utils.safeJsonParse('{ "foo" "bar" }')).to.be.eql({});
        expect(utils.safeJsonParse('{')).to.be.eql({});
    });
});

describe('utils.newApifyClientErrorFromResponse()', () => {
    it('works with body as object', () => {
        const details = { statusCode: 404 };
        const error = utils.newApifyClientErrorFromResponse({ type: 'SOME_TYPE', message: 'Some message.' }, details);
        expect(error.details).to.be.eql(details);
        expect(error.type).to.be.eql('SOME_TYPE');
        expect(error.message).to.be.eql('Some message.');
    });

    it('works with body as JSON string', () => {
        const error = utils.newApifyClientErrorFromResponse(
            JSON.stringify({ type: 'SOME_TYPE', message: 'Some message.' }), { statusCode: 404 });
        expect(error.details.statusCode).to.be.eql(404);
        expect(error.type).to.be.eql('SOME_TYPE');
        expect(error.message).to.be.eql('Some message.');
    });

    it('works withhout type and message in body', () => {
        const error = utils.newApifyClientErrorFromResponse({ foo: 'bar' }, { statusCode: 404 });
        expect(error.details.statusCode).to.be.eql(404);
        expect(error.type).to.be.eql(REQUEST_FAILED_ERROR_TYPE);
        expect(error.message).to.be.eql(REQUEST_FAILED_ERROR_MESSAGE);
    });

    it('works withhout type in body', () => {
        const error = utils.newApifyClientErrorFromResponse({ foo: 'bar', message: 'Some message.' }, { statusCode: 404 });
        expect(error.details.statusCode).to.be.eql(404);
        expect(error.type).to.be.eql(REQUEST_FAILED_ERROR_TYPE);
        expect(error.message).to.be.eql('Some message.');
    });

    it('works withhout message in body', () => {
        const error = utils.newApifyClientErrorFromResponse({ foo: 'bar', type: 'SOME_TYPE' }, { statusCode: 404 });
        expect(error.details.statusCode).to.be.eql(404);
        expect(error.type).to.be.eql('SOME_TYPE');
        expect(error.message).to.be.eql(REQUEST_FAILED_ERROR_MESSAGE);
    });

    it('works with error as subobject', () => {
        const error = utils.newApifyClientErrorFromResponse({ error: { type: 'SOME_TYPE', message: 'Some message.' } }, { statusCode: 404 });
        expect(error.details.statusCode).to.be.eql(404);
        expect(error.type).to.be.eql('SOME_TYPE');
        expect(error.message).to.be.eql('Some message.');
    });
});

describe('utils.checkParamOrThrow()', () => {
    it('works when type is correct', () => {
        function aaa() {}

        utils.checkParamOrThrow(2, 'paramName1', 'Number');
        utils.checkParamOrThrow(2, 'paramName2', 'Maybe Number');
        utils.checkParamOrThrow(null, 'paramName3', 'Maybe Number');

        utils.checkParamOrThrow(new Buffer(120), 'paramName4', 'Buffer');
        utils.checkParamOrThrow(null, 'paramName5', 'Maybe Buffer');
        utils.checkParamOrThrow(new Buffer(120), 'paramName6', 'Buffer|String');
        utils.checkParamOrThrow('aaa', 'paramName7', 'Buffer|String');
        utils.checkParamOrThrow(null, 'paramName8', 'Maybe Buffer|String');
        utils.checkParamOrThrow(new Buffer(120), 'paramName8', 'Maybe Buffer|String');
        utils.checkParamOrThrow('aaa', 'paramName9', 'Maybe Buffer|String');
        utils.checkParamOrThrow(() => {}, 'paramName10', 'Function');
        utils.checkParamOrThrow(aaa, 'paramName11', 'Function');
        utils.checkParamOrThrow(null, 'paramName12', 'Maybe Function|String');
        utils.checkParamOrThrow(null, 'paramName13', 'Maybe Function');
        utils.checkParamOrThrow(_.isFunction, 'paramName14', 'Function');
        utils.checkParamOrThrow(() => {}, 'paramName15', 'Function');
    });

    it('throws correct error', () => {
        expect(
            () => utils.checkParamOrThrow(2, 'paramName10', 'String'),
        ).to.throw('Parameter "paramName10" of type String must be provided');
        expect(
            () => utils.checkParamOrThrow(2, 'paramName11', 'String', 'Error message'),
        ).to.throw('Error message');
        expect(
            () => utils.checkParamOrThrow(2, 'paramName12', 'Maybe Buffer'),
        ).to.throw('Parameter "paramName12" of type Maybe Buffer must be provided');
        expect(
            () => utils.checkParamOrThrow(null, 'paramName13', 'Buffer'),
        ).to.throw('Parameter "paramName13" of type Buffer must be provided');
        expect(
            () => utils.checkParamOrThrow(new Buffer(120), 'paramName14', 'String'),
        ).to.throw('Parameter "paramName14" of type String must be provided');
        expect(
            () => utils.checkParamOrThrow(new Buffer(120), 'paramName15', 'Function'),
        ).to.throw('Parameter "paramName15" of type Function must be provided');
    });
});

describe('utils.pluckData()', () => {
    it('works', () => {
        expect(utils.pluckData({ foo: 'bar', data: 'something' })).to.be.eql('something');
        expect(utils.pluckData({ foo: 'bar' })).to.be.eql(null);
        expect(utils.pluckData(1)).to.be.eql(null);
        expect(utils.pluckData('string')).to.be.eql(null);
        expect(utils.pluckData(null)).to.be.eql(null);
        expect(utils.pluckData(undefined)).to.be.eql(null);
    });
});

describe('utils.catchNotFoundOrThrow()', () => {
    it('works', () => {
        const notFoundError = new ApifyClientError('not-found', 'Some message', { statusCode: NOT_FOUND_STATUS_CODE });
        const otherError = new ApifyClientError('any-error', 'Some message', { statusCode: 555 });
        const otherGenericError = new Error('blabla');

        expect(utils.catchNotFoundOrThrow(notFoundError)).to.be.eql(null);
        expect(() => utils.catchNotFoundOrThrow(otherError)).to.throw(otherError);
        expect(() => utils.catchNotFoundOrThrow(otherGenericError)).to.throw(otherGenericError);
    });
});

describe('utils.gzipPromise()', () => {
    it('works', () => {
        const buffer = new Buffer([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]);
        const str = 'foobar';

        const testBuffer = utils
            .gzipPromise(buffer)
            .then(gzipped => gunzipSync(gzipped))
            .then(ungzipped => expect(ungzipped).to.be.eql(buffer));

        const testString = utils
            .gzipPromise(str)
            .then(gzipped => gunzipSync(gzipped))
            .then(ungzipped => expect(ungzipped.toString()).to.be.eql(str));

        return Promise.all([testBuffer, testString]);
    });
});

describe('utils.parseBody()', () => {
    it('works', () => {
        const { parseBody } = utils;

        const inputObj = { foo: 'bar' };
        const inputJson = JSON.stringify(inputObj);
        const inputJsonBuffer = Buffer.from(inputJson);
        const inputStr = 'some string';
        const inputBuffer = Buffer.from(inputStr);

        expect(parseBody(inputJson, 'application/json')).to.be.eql(inputObj);
        expect(parseBody(inputJsonBuffer, 'application/json')).to.be.eql(inputObj);
        expect(parseBody(inputJsonBuffer, 'application/json; charset=something')).to.be.eql(inputObj);
        expect(parseBody(inputJsonBuffer, 'application/json; charset=utf-8')).to.be.eql(inputObj);
        expect(parseBody(inputJson, 'application/something')).to.be.eql(inputJson);

        expect(parseBody(inputBuffer, 'text/plain')).to.be.eql(inputStr);
        expect(parseBody(inputBuffer, 'text/plain; charset=something')).to.be.eql(inputStr);
        expect(parseBody(inputBuffer, 'text/plain; charset=utf-8')).to.be.eql(inputStr);
        expect(parseBody(inputBuffer, 'text/xxxxx; charset=utf-8')).to.be.eql(inputStr);
        expect(parseBody(inputBuffer, 'text/something')).to.be.eql(inputStr);

        expect(parseBody(inputBuffer, 'text/html')).to.be.eql(inputStr);
        expect(parseBody(inputBuffer, 'text/html; charset=something')).to.be.eql(inputStr);
        expect(parseBody(inputBuffer, 'text/html; charset=utf-8')).to.be.eql(inputStr);

        expect(parseBody(inputBuffer, 'application/xml')).to.be.eql(inputStr);
        expect(parseBody(inputBuffer, 'application/xml; charset=something')).to.be.eql(inputStr);
        expect(parseBody(inputBuffer, 'application/xml; charset=utf-8')).to.be.eql(inputStr);
    });
});

const expectDatesDame = (d1, d2) => expect(d1).to.be.eql(d2);

describe('utils.parseDateFields()', () => {
    it('works', () => {
        const date = new Date('2018-01-11T14:44:48.997Z');
        const original = { fooAt: date, barat: date };
        const parsed = utils.parseDateFields(JSON.parse(JSON.stringify(original)));

        expect(parsed.fooAt).to.be.a('date');
        expect(parsed.barat).to.be.a('string');
        expectDatesDame(parsed.fooAt, date);
    });

    it('works with depth enough', () => {
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

        expect(parsed.data.foo[0].fooAt).to.be.a('date');
        expect(parsed.data.foo[0].barat).to.be.a('string');
        expect(parsed.data.foo[0].tooDeep.fooAt).to.be.a('string');
        expectDatesDame(parsed.data.foo[0].fooAt, date);
        expect(parsed.data.foo[1].fooAt).to.be.a('date');
        expect(parsed.data.foo[1].barat).to.be.a('string');
        expect(parsed.data.foo[1].tooDeep.fooAt).to.be.a('string');
        expectDatesDame(parsed.data.foo[1].fooAt, date);
    });

    it('doesn\'t parse falsy values', () => {
        const original = { fooAt: null, barAt: '' };
        const parsed = utils.parseDateFields(JSON.parse(JSON.stringify(original)));

        expect(parsed.fooAt).to.be.eql(null);
        expect(parsed.barAt).to.be.eql('');
    });
});


describe('utils.stringifyWebhooksToBase64()', () => {
    it('works', () => {
        const webhooks = [
            {
                foo1: 'bar1',
            },
            {
                foo2: 'bar2',
            },
        ];
        const base64String = utils.stringifyWebhooksToBase64(webhooks);

        expect(base64String).to.equal(Buffer.from(JSON.stringify(webhooks), 'utf8').toString('base64'));
        expect(JSON.parse(Buffer.from(base64String, 'base64').toString('utf8'))).to.deep.equal(webhooks);
    });
});
