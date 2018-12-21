import sinon from 'sinon';
import _ from 'underscore';
import { expect } from 'chai';
import * as utils from '../build/utils';
import ApifyClient from '../build';

const APIFY_INSTANCE_KEYS = [
    'acts',
    'tasks',
    'crawlers',
    'keyValueStores',
    'datasets',
    'requestQueues',
    'logs',
    'users',
    'setOptions',
    'getOptions',
    'getDefaultOptions',
    'stats',
];

describe('ApifyClient', () => {
    it('should be possible to initiate it both with and without "new"', () => {
        const apifyClientWith = new ApifyClient();
        const apifyClientWithout = ApifyClient();

        expect(_.keys(apifyClientWith)).to.be.eql(APIFY_INSTANCE_KEYS);
        expect(_.keys(apifyClientWithout)).to.be.eql(APIFY_INSTANCE_KEYS);
    });

    it('should correctly set all options', () => {
        const instanceOpts = { storeId: 'someStore', crawlerId: 'someCrawler', actId: 'someAct' };

        instanceOpts._overrideMethodGroups = {
            group1: {
                method1: (requestPromise, params) => Promise.resolve(params),
            },
        };

        const apifyClient = new ApifyClient(instanceOpts);

        const defaultOpts = apifyClient.getDefaultOptions();
        const callOpts = { storeId: 'newStore', recordKey: 'someKey' };
        const expected = Object.assign({}, defaultOpts, instanceOpts, callOpts);

        return apifyClient
            .group1
            .method1(callOpts)
            .then(options => expect(options).to.be.eql(expected));
    });

    it('should be possible to change options using apifyClient.setOptions(opts)', () => {
        const methods = {
            group1: {
                method1: (requestPromise, params) => Promise.resolve(params.baseUrl),
            },
        };

        const apifyClient1 = new ApifyClient({
            baseUrl: 'http://something-1.com/api-1',
            _overrideMethodGroups: methods,
        }, methods);

        const apifyClient2 = new ApifyClient({
            baseUrl: 'http://something-2.com/api-2',
            _overrideMethodGroups: methods,
        }, methods);

        return Promise
            .all([
                apifyClient1.group1.method1(),
                apifyClient2.group1.method1(),
            ])
            .then(([baseUrl1, baseUrl2]) => {
                expect(baseUrl1).to.be.eql('http://something-1.com/api-1');
                expect(baseUrl2).to.be.eql('http://something-2.com/api-2');

                apifyClient1.setOptions({ baseUrl: 'http://something-3.com/api-3' });

                return Promise
                    .all([
                        apifyClient1.group1.method1(),
                        apifyClient2.group1.method1(),
                    ])
                    .then(([anotherBaseUrl1, anotherBaseUrl2]) => {
                        expect(anotherBaseUrl1).to.be.eql('http://something-3.com/api-3');
                        expect(anotherBaseUrl2).to.be.eql('http://something-2.com/api-2');
                    });
            });
    });

    it('apifyClient.getOptions() works', () => {
        const origOpts = {
            foo: 'bar',
            foo2: 'bar2',
        };
        const apifyClient = new ApifyClient(origOpts);

        // Simplest usage
        const gotOpts = apifyClient.getOptions();
        expect(origOpts).to.be.eql(_.pick(gotOpts, _.keys(origOpts)));

        // Updating the returned object must have no effect
        gotOpts.foo = 'newValue';
        const gotOpts2 = apifyClient.getOptions();
        expect(origOpts).to.be.eql(_.pick(gotOpts2, _.keys(origOpts)));

        // It should work event when setOptions() are called
        apifyClient.setOptions({ foo2: 'newValue2' });
        const gotOpts3 = apifyClient.getOptions();
        expect(gotOpts3.foo2).to.be.eql('newValue2');
    });

    it('should be possible to use with promises', () => {
        const apifyClient = new ApifyClient({
            protocol: 'http',
            host: 'myhost',
            _overrideMethodGroups: {
                group1: {
                    method1: () => Promise.resolve('someResponse'),
                },
            },
        });

        return apifyClient
            .group1
            .method1()
            .then(response => expect(response).to.be.eql('someResponse'));
    });

    it('should be possible handle errors when used with promises', () => {
        const apifyClient = new ApifyClient({
            protocol: 'http',
            host: 'myhost',
            _overrideMethodGroups: {
                group1: {
                    method1: () => Promise.reject(new Error('my-error')),
                },
            },
        });

        return apifyClient
            .group1
            .method1()
            .then(
                () => { throw new Error('error-not-handled'); },
                err => expect(err.message).to.be.eql('my-error'),
            );
    });

    it('should be possible to use with callbacks', (done) => {
        const apifyClient = new ApifyClient({
            protocol: 'http',
            host: 'myhost',
            _overrideMethodGroups: {
                group1: {
                    method1: () => Promise.resolve('someResponse'),
                },
            },
        });

        apifyClient
            .group1
            .method1({}, (error, response) => {
                expect(error).to.be.eql(null);
                expect(response).to.be.eql('someResponse');
                done();
            });
    });

    it('should be possible handle errors when used with callbacks', (done) => {
        const apifyClient = new ApifyClient({
            protocol: 'http',
            host: 'myhost',
            _overrideMethodGroups: {
                group1: {
                    method1: () => Promise.reject(new Error('my-error')),
                },
            },
        });

        apifyClient
            .group1
            .method1({}, (error, response) => {
                expect(error.message).to.be.eql('my-error');
                expect(response).to.be.eql(undefined);
                done();
            });
    });

    it('should passed preconfigured utils.requestPromise to each method', () => {
        const requestPromiseMock = sinon.mock(utils, 'requestPromise');
        const expected = {
            method: 'get',
            url: 'http://example.com',
            expBackOffMillis: 999,
            expBackOffMaxRepeats: 99,
        };

        requestPromiseMock
            .expects('requestPromise')
            .once()
            .withArgs(expected)
            .returns(Promise.resolve());

        const apifyClient = new ApifyClient({
            baseUrl: 'https://api.apify.com',
            foo: 'this-wont-got-passed-to-requestPromise',
            expBackOffMillis: 999,
            expBackOffMaxRepeats: 99,
            _overrideMethodGroups: {
                group1: {
                    method1: requestPromise => requestPromise({ method: 'get', url: 'http://example.com' }),
                },
            },
        });

        return apifyClient
            .group1
            .method1()
            .then(() => requestPromiseMock.restore());
    });

    it('should remove trailing forward slash from baseUrl', () => {
        const apifyClient = new ApifyClient({
            baseUrl: 'something/',
            _overrideMethodGroups: {
                group1: {
                    method1: (requestPromise, options) => Promise.resolve(options.baseUrl),
                },
            },
        });

        return apifyClient
            .group1
            .method1()
            .then(baseUrl => expect(baseUrl).to.be.eql('something'));
    });
});
