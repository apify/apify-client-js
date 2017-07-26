import sinon from 'sinon';
import request from 'request';
import { gunzipSync } from 'zlib';
import { expect } from 'chai';
import ApifyError, {
    APIFY_ERROR_NAME,
    REQUEST_FAILED_ERROR_TYPE,
    REQUEST_FAILED_ERROR_MESSAGE,
    INVALID_PARAMETER_ERROR_TYPE,
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

describe('utils.newApifyErrorFromResponse()', () => {
    it('works with body as object', () => {
        const error = utils.newApifyErrorFromResponse(404, { type: 'SOME_TYPE', message: 'Some message.' });
        expect(error.details.statusCode).to.be.eql(404);
        expect(error.type).to.be.eql('SOME_TYPE');
        expect(error.message).to.be.eql('Some message.');
    });

    it('works with body as JSON string', () => {
        const error = utils.newApifyErrorFromResponse(404, JSON.stringify({ type: 'SOME_TYPE', message: 'Some message.' }));
        expect(error.details.statusCode).to.be.eql(404);
        expect(error.type).to.be.eql('SOME_TYPE');
        expect(error.message).to.be.eql('Some message.');
    });

    it('works withhout type and message in body', () => {
        const error = utils.newApifyErrorFromResponse(404, { foo: 'bar' });
        expect(error.details.statusCode).to.be.eql(404);
        expect(error.type).to.be.eql(REQUEST_FAILED_ERROR_TYPE);
        expect(error.message).to.be.eql(REQUEST_FAILED_ERROR_MESSAGE);
    });

    it('works withhout type in body', () => {
        const error = utils.newApifyErrorFromResponse(404, { foo: 'bar', message: 'Some message.' });
        expect(error.details.statusCode).to.be.eql(404);
        expect(error.type).to.be.eql(REQUEST_FAILED_ERROR_TYPE);
        expect(error.message).to.be.eql('Some message.');
    });

    it('works withhout message in body', () => {
        const error = utils.newApifyErrorFromResponse(404, { foo: 'bar', type: 'SOME_TYPE' });
        expect(error.details.statusCode).to.be.eql(404);
        expect(error.type).to.be.eql('SOME_TYPE');
        expect(error.message).to.be.eql(REQUEST_FAILED_ERROR_MESSAGE);
    });
});

describe('utils.requestPromise()', () => {
    it('works as expected when request succeeds', () => {
        const method = 'DELETE';
        const opts = { method, foo: 'bar', promise: Promise };
        const expectedBody = { foo: 'something', bar: 123 };

        const stub = sinon
            .stub(request, method.toLowerCase())
            .callsFake((passedOpts, callback) => {
                expect(passedOpts).to.be.eql(opts);
                callback(null, {}, expectedBody);
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
            .callsFake((passedOpts, callback) => {
                expect(passedOpts).to.be.eql(opts);
                callback(null, expectedResponse, expectedBody);
            });

        return utils
            .requestPromise(opts)
            .then((response) => {
                expect(response.body).to.be.eql(expectedBody);
                expect(response).to.be.eql(expectedResponse);
                stub.restore();
            });
    });

    it('works as expected when request throws an error', () => {
        const method = 'POST';
        const opts = { method, foo: 'bar', promise: Promise };
        const errorMsg = 'some-error';

        const stub = sinon
            .stub(request, method.toLowerCase())
            .callsFake((passedOpts, callback) => {
                expect(passedOpts).to.be.eql(opts);
                callback(new Error(errorMsg));
            });

        return utils
            .requestPromise(opts)
            .then(() => {
                throw new Error('Error not catched!!!');
            }, (err) => {
                expect(err.name).to.be.eql(APIFY_ERROR_NAME);
                expect(err.type).to.be.eql(REQUEST_FAILED_ERROR_TYPE);
                expect(err.message).to.be.eql(errorMsg);
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
            .callsFake((passedOpts, callback) => {
                expect(passedOpts).to.be.eql(opts);
                callback(null, { statusCode }, JSON.stringify({ type, message }));
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
            .callsFake((passedOpts, callback) => {
                expect(passedOpts).to.be.eql(opts);
                callback(null, { statusCode: 404 }, '');
            });

        return utils
            .requestPromise(opts)
            .then(() => {
                throw new Error('Error not catched!!!');
            }, (err) => {
                expect(err.details.statusCode).to.be.eql(statusCode);
                expect(err.message).to.be.eql(REQUEST_FAILED_ERROR_MESSAGE);
                expect(err.type).to.be.eql(REQUEST_FAILED_ERROR_TYPE);
                expect(err.name).to.be.eql(APIFY_ERROR_NAME);
                stub.restore();
            });
    });

    it('fails when method parameter is not provided', () => {
        let hasFailed = false;

        try {
            utils.requestPromise({ method: null, promise: Promise });
        } catch (err) {
            expect(err.name).to.be.eql(APIFY_ERROR_NAME);
            expect(err.type).to.be.eql(INVALID_PARAMETER_ERROR_TYPE);
            expect(err.message).to.be.eql('"options.method" parameter must be provided');
            hasFailed = true;
        }

        expect(hasFailed).to.be.eql(true);
    });

    it('fails when request[method] doesn\'t exist', () => {
        let hasFailed = false;

        try {
            utils.requestPromise({ method: 'something', promise: Promise });
        } catch (err) {
            expect(err.name).to.be.eql(APIFY_ERROR_NAME);
            expect(err.type).to.be.eql(INVALID_PARAMETER_ERROR_TYPE);
            expect(err.message).to.be.eql('"options.method" is not a valid http request method');
            hasFailed = true;
        }

        expect(hasFailed).to.be.eql(true);
    });

    it('fails when promise parameter is not provided', () => {
        let hasFailed = false;

        try {
            utils.requestPromise({ method: 'get' });
        } catch (err) {
            expect(err.name).to.be.eql(APIFY_ERROR_NAME);
            expect(err.type).to.be.eql(INVALID_PARAMETER_ERROR_TYPE);
            expect(err.message).to.be.eql('"options.promise" parameter must be provided');
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
            .callsFake((passedOpts, callback) => {
                const expectedOpts = Object.assign({}, opts, { expBackOffMillis: opts.expBackOffMillis * (2 ** iteration) });

                expect(passedOpts).to.be.eql(expectedOpts);

                iteration++;

                if (iteration < 8) return callback(null, { statusCode: 500 }, {});

                callback(null, {}, expectedBody);
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
            .callsFake((passedOpts, callback) => {
                const expectedOpts = Object.assign({}, opts, { expBackOffMillis: opts.expBackOffMillis * (2 ** iteration) });

                expect(passedOpts).to.be.eql(expectedOpts);

                iteration++;

                if (iteration <= 4) return callback(null, { statusCode: 500 }, {});

                callback(null, {}, expectedBody);
            });

        return utils
            .requestPromise(opts)
            .then(
                () => { throw new Error('This should fail.'); },
                (err) => {
                    expect(iteration).to.be.eql(4);
                    expect(err.type).to.be.eql(REQUEST_FAILED_ERROR_TYPE);
                    expect(err.message).to.be.eql(`Server request failed with ${iteration} tries.`);
                    expect(err.details.statusCode).to.be.eql(500);
                    stub.restore();
                },
            );
    });
});

describe('utils.checkParamOrThrow()', () => {
    it('works when type is correct', () => {
        utils.checkParamOrThrow(2, 'paramName', 'Number');
        utils.checkParamOrThrow(2, 'paramName', 'Maybe Number');
        utils.checkParamOrThrow(null, 'paramName', 'Maybe Number');
    });

    it('throws correct error', () => {
        let error;

        try {
            utils.checkParamOrThrow(2, 'paramName', 'String');
        } catch (err) {
            error = err;
        }

        expect(error.name).to.be.eql(APIFY_ERROR_NAME);
        expect(error.type).to.be.eql(INVALID_PARAMETER_ERROR_TYPE);
        expect(error.message).to.be.eql('Parameter "paramName" of type String must be provided');


        try {
            utils.checkParamOrThrow(2, 'paramName', 'String', 'Error message');
        } catch (err) {
            error = err;
        }

        expect(error.name).to.be.eql(APIFY_ERROR_NAME);
        expect(error.type).to.be.eql(INVALID_PARAMETER_ERROR_TYPE);
        expect(error.message).to.be.eql('Error message');
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
        const notFoundError = new ApifyError('not-found', 'Some message', { statusCode: NOT_FOUND_STATUS_CODE });
        const otherError = new ApifyError('any-error', 'Some message', { statusCode: 555 });
        const otherGenericError = new Error('blabla');

        expect(utils.catchNotFoundOrThrow(notFoundError)).to.be.eql(null);
        expect(() => utils.catchNotFoundOrThrow(otherError)).to.throw(otherError);
        expect(() => utils.catchNotFoundOrThrow(otherGenericError)).to.throw(otherGenericError);
    });
});

describe('utils.pluckData()', () => {
    it('works', () => {
        const buffer = new Buffer([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]);
        const str = 'foobar';

        const testBuffer = utils
            .gzipPromise(Promise, buffer)
            .then(gzipped => gunzipSync(gzipped))
            .then(ungzipped => expect(ungzipped).to.be.eql(buffer));

        const testString = utils
            .gzipPromise(Promise, str)
            .then(gzipped => gunzipSync(gzipped))
            .then(ungzipped => expect(ungzipped.toString()).to.be.eql(str));

        return Promise.all([testBuffer, testString]);
    });
});

describe('utils.decodeBody/encodeBody()', () => {
    it('works', () => {
        const { encodeBody, decodeBody } = utils;

        const inputObj = { foo: 'bar' };
        const inputStr = JSON.stringify(inputObj);

        expect(encodeBody(inputObj, 'application/json')).to.be.eql(inputStr);
        expect(encodeBody(inputObj, 'application/something')).to.be.eql(inputObj);

        expect(decodeBody(inputStr, 'application/json')).to.be.eql(inputObj);
        expect(decodeBody(inputStr, 'application/something')).to.be.eql(inputStr);
    });
});
