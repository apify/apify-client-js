import sinon from 'sinon';
import request from 'request';
import { expect } from 'chai';
import * as utils from '../build/utils';

describe('utils.objectToQueryString()', () => {
    it('should create correct query string out of a plain object', () => {
        const obj = {
            val1: 'something',
            val2: 'else',
        };

        expect(utils.objectToQueryString(obj)).to.be.eql('?val1=something&val2=else');
    });

    it('should encode URI components', () => {
        const obj = {
            val1: 'something+else',
            'val&?/': 'ěščřžýá',
        };

        expect(utils.objectToQueryString(obj)).to.be.eql('?val1=something%2Belse&val%26%3F%2F=%C4%9B%C5%A1%C4%8D%C5%99%C5%BE%C3%BD%C3%A1');
    });

    it('handles empty args', () => {
        expect(utils.objectToQueryString({})).to.be.eql('');
        expect(utils.objectToQueryString(null)).to.be.eql('');
        expect(utils.objectToQueryString(undefined)).to.be.eql('');
    });
});

describe('utils.requestPromise()', () => {
    it('works as expected when request succeeds', () => {
        const method = 'DELETE';
        const opts = { method, foo: 'bar' };
        const expected = { foo: 'something', bar: 123 };

        const stub = sinon
            .stub(request, method.toLowerCase())
            .callsFake((passedOpts, callback) => {
                expect(passedOpts).to.be.eql(opts);
                callback(null, {}, expected);
            });

        return utils
            .requestPromise(Promise, opts)
            .then((response) => {
                expect(response).to.be.eql(expected);
                stub.restore();
            });
    });

    it('works as expected when request fails', () => {
        const method = 'POST';
        const opts = { method, foo: 'bar' };

        const stub = sinon
            .stub(request, method.toLowerCase())
            .callsFake((passedOpts, callback) => {
                expect(passedOpts).to.be.eql(opts);
                callback(new Error('some-error'));
            });

        return utils
            .requestPromise(Promise, opts)
            .then(() => {
                throw new Error('Error not catched!!!');
            }, (err) => {
                expect(err.message).to.be.eql('some-error');
                stub.restore();
            });
    });

    it('fails when method parameter is not provided', () => {
        let hasFailed = false;

        try {
            utils.requestPromise(Promise, { method: null });
        } catch (err) {
            expect(err.message).to.be.eql('"options.method" parameter must be provided');
            hasFailed = true;
        }

        expect(hasFailed).to.be.eql(true);
    });

    it('fails when request[method] doesn\'t exist', () => {
        let hasFailed = false;

        try {
            utils.requestPromise(Promise, { method: 'something' });
        } catch (err) {
            expect(err.message).to.be.eql('"options.method" is not a valid http request method');
            hasFailed = true;
        }

        expect(hasFailed).to.be.eql(true);
    });
});
