import sinon from 'sinon';
import request from 'request-promise-native';
import { gunzipSync } from 'zlib';
import { expect } from 'chai';
import _ from 'underscore';
import ApifyClientError, {
    APIFY_ERROR_NAME,
    REQUEST_FAILED_ERROR_TYPE_V1,
    REQUEST_FAILED_ERROR_TYPE_V2,
    REQUEST_FAILED_ERROR_MESSAGE,
    INVALID_PARAMETER_ERROR_TYPE_V1,
    INVALID_PARAMETER_ERROR_TYPE_V2,
    NOT_FOUND_STATUS_CODE,
} from '../build/apify_error';
import * as utils from '../build/utils';

describe('utils.safeJsonParse()', () => {
    it('works', () => {
        expect(utils.safeJsonParse('{ "foo": "bar" }')).to.be.eql({ foo: 'bar' });
        expect(utils.safeJsonParse('{ "foo" "bar" }')).to.be.eql({});
        expect(utils.safeJsonParse('{')).to.be.eql({});
    });
});

describe('utils.newApifyClientErrorFromResponse()', () => {
    it('works with body as object', () => {
        const error = utils.newApifyClientErrorFromResponse(404, { type: 'SOME_TYPE', message: 'Some message.' });
        expect(error.details.statusCode).to.be.eql(404);
        expect(error.type).to.be.eql('SOME_TYPE');
        expect(error.message).to.be.eql('Some message.');
    });

    it('works with body as JSON string', () => {
        const error = utils.newApifyClientErrorFromResponse(404, JSON.stringify({ type: 'SOME_TYPE', message: 'Some message.' }));
        expect(error.details.statusCode).to.be.eql(404);
        expect(error.type).to.be.eql('SOME_TYPE');
        expect(error.message).to.be.eql('Some message.');
    });

    it('works withhout type and message in body', () => {
        const error = utils.newApifyClientErrorFromResponse(404, { foo: 'bar' });
        expect(error.details.statusCode).to.be.eql(404);
        expect(error.type).to.be.eql(REQUEST_FAILED_ERROR_TYPE_V2);
        expect(error.message).to.be.eql(REQUEST_FAILED_ERROR_MESSAGE);
    });

    it('works withhout type in body', () => {
        const error = utils.newApifyClientErrorFromResponse(404, { foo: 'bar', message: 'Some message.' });
        expect(error.details.statusCode).to.be.eql(404);
        expect(error.type).to.be.eql(REQUEST_FAILED_ERROR_TYPE_V2);
        expect(error.message).to.be.eql('Some message.');
    });

    it('works withhout type and message in body for API V1', () => {
        const error = utils.newApifyClientErrorFromResponse(404, { foo: 'bar' }, true);
        expect(error.details.statusCode).to.be.eql(404);
        expect(error.type).to.be.eql(REQUEST_FAILED_ERROR_TYPE_V1);
        expect(error.message).to.be.eql(REQUEST_FAILED_ERROR_MESSAGE);
    });

    it('works withhout type in body for API V1', () => {
        const error = utils.newApifyClientErrorFromResponse(404, { foo: 'bar', message: 'Some message.' }, true);
        expect(error.details.statusCode).to.be.eql(404);
        expect(error.type).to.be.eql(REQUEST_FAILED_ERROR_TYPE_V1);
        expect(error.message).to.be.eql('Some message.');
    });

    it('works withhout message in body', () => {
        const error = utils.newApifyClientErrorFromResponse(404, { foo: 'bar', type: 'SOME_TYPE' });
        expect(error.details.statusCode).to.be.eql(404);
        expect(error.type).to.be.eql('SOME_TYPE');
        expect(error.message).to.be.eql(REQUEST_FAILED_ERROR_MESSAGE);
    });

    it('works with error as subobject', () => {
        const error = utils.newApifyClientErrorFromResponse(404, { error: { type: 'SOME_TYPE', message: 'Some message.' } });
        expect(error.details.statusCode).to.be.eql(404);
        expect(error.type).to.be.eql('SOME_TYPE');
        expect(error.message).to.be.eql('Some message.');
    });
});

describe('utils.requestPromise()', () => {
    it('works as expected when request succeeds', () => {
        const method = 'DELETE';
        const opts = { method, foo: 'bar', promise: Promise };
        const expectedBody = { foo: 'something', bar: 123 };

        const stub = sinon
            .stub(request, method.toLowerCase())
            .callsFake((passedOpts) => {
                expect(passedOpts).to.be.eql(Object.assign({}, opts, { resolveWithResponse: true }));
                return Promise.resolve({ body: expectedBody });
            });

        return utils
            .requestPromise(opts)
            .then((body) => {
                expect(body).to.be.eql(expectedBody);
                stub.restore();
            });
    });

    it('works as expected with full response when request succeeds', () => {
        const method = 'DELETE';
        const opts = { method, foo: 'bar', resolveWithResponse: true, promise: Promise };
        const expectedBody = { foo: 'something', bar: 123 };
        const expectedResponse = { statusCode: 123, foo: 'bar', body: expectedBody };

        const stub = sinon
            .stub(request, method.toLowerCase())
            .callsFake((passedOpts) => {
                expect(passedOpts).to.be.eql(Object.assign({}, opts, { resolveWithResponse: true }));
                return Promise.resolve(expectedResponse);
            });

        return utils
            .requestPromise(opts)
            .then((response) => {
                expect(response.body).to.be.eql(expectedBody);
                expect(response).to.be.eql(expectedResponse);
                stub.restore();
            });
    });

    it('works as expected when request throws an error 8 times and then succeeds', () => {
        const method = 'POST';
        const opts = { method, foo: 'bar', expBackOffMaxRepeats: 8, expBackOffMillis: 5 };
        const errorMsg = 'some-error';
        const expectedBody = 'foo-bar';

        let iteration = 0;

        const stub = sinon
            .stub(request, method.toLowerCase())
            .callsFake((passedOpts) => {
                expect(passedOpts).to.be.eql(Object.assign({}, opts, { resolveWithResponse: true }));
                iteration++;
                if (iteration < 8) return Promise.reject(new Error(errorMsg), null, {});
                return Promise.resolve({ body: expectedBody });
            });

        return utils
            .requestPromise(opts)
            .then((body) => {
                expect(body).to.be.eql(expectedBody);
                expect(iteration).to.be.eql(8);
                stub.restore();
            });
    });

    it('works as expected when request throws an error 9 times so it fails', () => {
        const method = 'POST';
        const opts = {
            method,
            url: 'http://example.com/a/b',
            qs: { foo: 'bar' },
            foo: 'bar',
            promise: Promise,
            expBackOffMaxRepeats: 8,
            expBackOffMillis: 5,
        };
        const error = new Error('some-error');

        const stub = sinon
            .stub(request, method.toLowerCase())
            .callsFake((passedOpts) => {
                expect(passedOpts).to.be.eql(Object.assign({}, opts, { resolveWithResponse: true }));
                return Promise.reject(error);
            });

        return utils
            .requestPromise(opts)
            .then(() => {
                throw new Error('Should fail!!!');
            }, (err) => {
                expect(err.name).to.be.eql(APIFY_ERROR_NAME);
                expect(err.type).to.be.eql(REQUEST_FAILED_ERROR_TYPE_V2);
                expect(err.details.iteration).to.be.eql(opts.expBackOffMaxRepeats);
                expect(err.details.statusCode).to.be.eql(undefined);
                expect(err.details.error).to.be.eql(error);
                expect(err.details.hasBody).to.be.eql(false);
                expect(err.details.method).to.be.eql(method);
                expect(err.details.error).to.be.eql(error);
                expect(err.details.url).to.be.eql('http://example.com/a/b');
                expect(err.details.qs).to.be.eql({ foo: 'bar' });
                stub.restore();
            });
    });

    it('works as expected when request throws an error for API V1', () => {
        const method = 'POST';
        const opts = { method, foo: 'bar', promise: Promise, isApiV1: true, expBackOffMaxRepeats: 8, expBackOffMillis: 5 };
        const error = new Error('some-error');

        const stub = sinon
            .stub(request, method.toLowerCase())
            .callsFake((passedOpts) => {
                expect(passedOpts).to.be.eql(Object.assign({}, opts, { resolveWithResponse: true }));
                return Promise.reject(error);
            });

        return utils
            .requestPromise(opts)
            .then(() => {
                throw new Error('Should fail!!!');
            }, (err) => {
                expect(err.name).to.be.eql(APIFY_ERROR_NAME);
                expect(err.type).to.be.eql(REQUEST_FAILED_ERROR_TYPE_V1);
                expect(err.details.iteration).to.be.eql(opts.expBackOffMaxRepeats);
                expect(err.details.statusCode).to.be.eql(undefined);
                expect(err.details.error).to.be.eql(error);
                stub.restore();
            });
    });

    it('works as expected when response contains error code and error details', () => {
        const method = 'POST';
        const opts = { method, foo: 'bar', promise: Promise };
        const type = 'SOME-TYPE';
        const message = 'Some message';
        const statusCode = 404;

        const stub = sinon
            .stub(request, method.toLowerCase())
            .callsFake((passedOpts) => {
                expect(passedOpts).to.be.eql(Object.assign({}, opts, { resolveWithResponse: true }));
                return Promise.resolve({ statusCode, body: JSON.stringify({ type, message }) });
            });

        return utils
            .requestPromise(opts)
            .then(() => {
                throw new Error('Error not catched!!!');
            }, (err) => {
                expect(err.details.statusCode).to.be.eql(statusCode);
                expect(err.message).to.be.eql(message);
                expect(err.type).to.be.eql(type);
                expect(err.name).to.be.eql(APIFY_ERROR_NAME);
                stub.restore();
            });
    });

    it('works as expected when response contains only error code', () => {
        const method = 'POST';
        const opts = { method, foo: 'bar', promise: Promise };
        const statusCode = 404;

        const stub = sinon
            .stub(request, method.toLowerCase())
            .callsFake((passedOpts) => {
                expect(passedOpts).to.be.eql(Object.assign({}, opts, { resolveWithResponse: true }));
                return Promise.resolve({ statusCode: 404, body: '' });
            });

        return utils
            .requestPromise(opts)
            .then(() => {
                throw new Error('Error not catched!!!');
            }, (err) => {
                expect(err.details.statusCode).to.be.eql(statusCode);
                expect(err.message).to.be.eql(REQUEST_FAILED_ERROR_MESSAGE);
                expect(err.type).to.be.eql(REQUEST_FAILED_ERROR_TYPE_V2);
                expect(err.name).to.be.eql(APIFY_ERROR_NAME);
                stub.restore();
            });
    });

    it('fails when method parameter is not provided', async () => {
        let hasFailed = false;

        try {
            await utils.requestPromise({ method: null });
        } catch (err) {
            expect(err.name).to.be.eql(APIFY_ERROR_NAME);
            expect(err.type).to.be.eql(INVALID_PARAMETER_ERROR_TYPE_V2);
            expect(err.message).to.be.eql('"options.method" parameter must be provided');
            hasFailed = true;
        }

        expect(hasFailed).to.be.eql(true);
    });

    it('fails when method parameter is not provided for API V1', async () => {
        let hasFailed = false;

        try {
            await utils.requestPromise({ method: null, isApiV1: true });
        } catch (err) {
            expect(err.name).to.be.eql(APIFY_ERROR_NAME);
            expect(err.type).to.be.eql(INVALID_PARAMETER_ERROR_TYPE_V1);
            expect(err.message).to.be.eql('"options.method" parameter must be provided');
            hasFailed = true;
        }

        expect(hasFailed).to.be.eql(true);
    });

    it('supports exponential backoff', () => {
        const method = 'DELETE';
        const opts = { method, foo: 'bar', expBackOffMillis: 5, expBackOffMaxRepeats: 8, promise: Promise };
        const expectedBody = { foo: 'something', bar: 123 };

        let iteration = 0;

        const stub = sinon
            .stub(request, method.toLowerCase())
            .callsFake((passedOpts) => {
                expect(passedOpts).to.be.eql(Object.assign({}, opts, { resolveWithResponse: true }));
                iteration++;
                if (iteration < 8) return Promise.resolve({ statusCode: 500 });
                return Promise.resolve({ body: expectedBody });
            });

        return utils
            .requestPromise(opts)
            .then((body) => {
                expect(body).to.be.eql(expectedBody);
                expect(iteration).to.be.eql(8);
                stub.restore();
            });
    });

    it('supports limit of exponential backoff iterations', () => {
        const method = 'DELETE';
        const opts = { method, foo: 'bar', expBackOffMillis: 5, expBackOffMaxRepeats: 3, promise: Promise };
        const expectedBody = { foo: 'something', bar: 123 };

        let iteration = 0;

        const stub = sinon
            .stub(request, method.toLowerCase())
            .callsFake((passedOpts) => {
                expect(passedOpts).to.be.eql(Object.assign({}, opts, { resolveWithResponse: true }));
                iteration++;
                if (iteration <= 4) return Promise.resolve({ statusCode: 500 });
                return Promise.resolve({ body: expectedBody });
            });

        return utils
            .requestPromise(opts)
            .then(
                () => { throw new Error('This should fail.'); },
                (err) => {
                    expect(iteration).to.be.eql(4);
                    expect(err.type).to.be.eql(REQUEST_FAILED_ERROR_TYPE_V2);
                    expect(err.message).to.be.eql(`Server request failed with ${iteration} tries.`);
                    expect(err.details.statusCode).to.be.eql(500);
                    stub.restore();
                },
            );
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
