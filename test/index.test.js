import sinon from 'sinon';
import _ from 'lodash';
import * as utils from '../build/utils';
import ApifyClient from '../build';

const APIFY_INSTANCE_KEYS = [
    'acts',
    'actors',
    'tasks',
    'keyValueStores',
    'datasets',
    'requestQueues',
    'logs',
    'users',
    'webhooks',
    'webhookDispatches',
    'setOptions',
    'getOptions',
    'getDefaultOptions',
    'stats',
];

describe('ApifyClient', () => {
    test.skip('should be possible to initiate it both with and without "new"', () => {
        // TODO: Why? do we want to keep the support
        const apifyClientWith = new ApifyClient();
        const apifyClientWithout = ApifyClient();

        expect(_.keys(apifyClientWith)).toEqual(APIFY_INSTANCE_KEYS);
        expect(_.keys(apifyClientWithout)).toEqual(APIFY_INSTANCE_KEYS);
    });

    test.skip('should be possible to change options using apifyClient.setOptions(opts)', () => {
        // TODO: Why? do we want to keep the support

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
                expect(baseUrl1).toEqual('http://something-1.com/api-1');
                expect(baseUrl2).toEqual('http://something-2.com/api-2');

                apifyClient1.setOptions({ baseUrl: 'http://something-3.com/api-3' });

                return Promise
                    .all([
                        apifyClient1.group1.method1(),
                        apifyClient2.group1.method1(),
                    ])
                    .then(([anotherBaseUrl1, anotherBaseUrl2]) => {
                        expect(anotherBaseUrl1).toEqual('http://something-3.com/api-3');
                        expect(anotherBaseUrl2).toEqual('http://something-2.com/api-2');
                    });
            });
    });

    test('apifyClient.getOptions() works', () => {
        const origOpts = {
            foo: 'bar',
            foo2: 'bar2',
        };
        const apifyClient = new ApifyClient(origOpts);

        // Simplest usage
        const gotOpts = apifyClient.getOptions();
        expect(origOpts).toEqual(_.pick(gotOpts, _.keys(origOpts)));

        // Updating the returned object must have no effect
        gotOpts.foo = 'newValue';
        const gotOpts2 = apifyClient.getOptions();
        expect(origOpts).toEqual(_.pick(gotOpts2, _.keys(origOpts)));

        // It should work event when setOptions() are called
        apifyClient.setOptions({ foo2: 'newValue2' });
        const gotOpts3 = apifyClient.getOptions();
        expect(gotOpts3.foo2).toEqual('newValue2');
    });

    test.skip('should be possible to use with callbacks', (done) => {
        // TODO: Why? do we want to keep the support

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
                expect(error).toEqual(null);
                expect(response).toEqual('someResponse');
                done();
            });
    });

    test.skip('should be possible handle errors when used with callbacks', (done) => {
        // TODO: Remove?
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
                expect(error.message).toEqual('my-error');
                expect(response).toEqual(undefined);
                done();
            });
    });

    test.skip('should passed preconfigured utils.requestPromise to each method', () => {
        // TODO: Remove?

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
});
