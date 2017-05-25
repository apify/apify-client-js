import sinon from 'sinon';
import _ from 'underscore';
import { expect } from 'chai';
import * as utils from '../build/utils';
import ApifyClient from '../build';
import { BASE_PATH } from '../build/crawlers';

const basicOptions = {
    baseUrl: 'http://myhost:80/mypath',
};

const credentials = {
    userId: 'DummyUserId',
    token: 'DummyTokenXXXXX',
};

const optionsWithCredentials = Object.assign({}, basicOptions, credentials);

describe('Crawlers', () => {
    const requestPromiseMock = sinon.mock(utils, 'requestPromise');

    const requestExpectCall = (requestOpts, body, response) => {
        if (!_.isObject(requestOpts)) throw new Error('"requestOpts" parameter must be an object!');
        if (!requestOpts.method) throw new Error('"requestOpts.method" parameter is not set!');

        const expectedRequestOpts = response ? Object.assign({}, requestOpts, { resolveWithResponse: true, promise: Promise })
                                             : Object.assign({}, requestOpts, { promise: Promise });
        const output = response ? { body, response } : body;

        requestPromiseMock
            .expects('requestPromise')
            .once()
            .withArgs(expectedRequestOpts)
            .returns(Promise.resolve(output));
    };

    after(() => {
        requestPromiseMock.restore();
    });

    describe('List crawlers', () => {
        it('should throw if token is not provided', () => {
            const crawlerClient = new ApifyClient(basicOptions).crawlers;
            return expect(crawlerClient.listCrawlers.bind(crawlerClient, { userId: credentials.userId }))
                .to.throw('Missing required parameter: token');
        });

        it('should throw if userId is not Provided', () => {
            const crawlerClient = new ApifyClient(basicOptions).crawlers;
            return expect(crawlerClient.listCrawlers.bind(crawlerClient, { token: credentials.token }))
                .to.throw('Missing required parameter: userId');
        });

        it('should be able to use default userId/token', () => {
            requestExpectCall({
                json: true,
                method: 'GET',
                url: `http://myhost:80/mypath${BASE_PATH}/${credentials.userId}/crawlers`,
                qs: { token: credentials.token },
            });

            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;

            return crawlerClient.listCrawlers();
        });

        it('should override default userId/token with credentials passed as parameters', () => {
            requestExpectCall({
                json: true,
                method: 'GET',
                url: `http://myhost:80/mypath${BASE_PATH}/userIdParameter/crawlers`,
                qs: { token: 'tokenParameter' },
            });

            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;

            return crawlerClient.listCrawlers({ userId: 'userIdParameter', token: 'tokenParameter' });
        });

        it('should return what API returns', () => {
            const crawlersInResponse = [
                {
                    _id: 'wKw8QeHiHiyd8YGN8',
                    customId: 'Example_RSS',
                    createdAt: '2017-04-03T15:02:05.789Z',
                    modifiedAt: '2017-04-03T15:02:05.789Z',
                    executeUrl: 'https://api.apifier.com/v1/QKTX6JkmM9RLHGvZk/crawlers/Example_RSS/execute?token=ptMAQuc52f6Q78keyuwmAEbWo',
                    lastExecution: null,
                    settingsUrl: 'https://api.apifier.com/v1/QKTX6JkmM9RLHGvZk/crawlers/Example_RSS?token=itsrEEASPj4S2HjPdrxy7ntkY',
                    executionsListUrl: 'https://api.apifier.com/v1/QKTX6JkmM9RLHGvZk/crawlers/Example_RSS/execs?token=Fmk3NMZtZbevqMHpSLafXaM2u',
                    lastExecutionFixedDetailsUrl:
                        'https://api.apifier.com/v1/QKTX6JkmM9RLHGvZk/crawlers/Example_RSS/lastExec?token=Fmk3NMZtZbevqMHpSLafXaM2u',
                    lastExecutionFixedResultsUrl:
                        'https://api.apifier.com/v1/QKTX6JkmM9RLHGvZk/crawlers/Example_RSS/lastExec/results?token=Fmk3NMZtZbevqMHpSLafXaM2u',
                },
                {
                    _id: 'EfEjTWAgnDGavzccq',
                    customId: 'Example_Hacker_News',
                    createdAt: '2017-04-03T15:02:05.789Z',
                    modifiedAt: '2017-04-03T15:02:05.789Z',
                    executeUrl: 'https://api.apifier.com/v1/QKTX6JkmM9RLHGvZk/crawlers/Example_Hacker_News/execute?token=YLo2YBERtAMkyB9zEiufFxsWW',
                    lastExecution: {
                        _id: 'q8uunYKjdwkCTqRBq',
                        startedAt: '2017-05-11T14:55:46.352Z',
                        finishedAt: '2017-05-11T14:56:04.698Z',
                        status: 'SUCCEEDED',
                        pagesCrawled: 5,
                        detailsUrl: 'https://api.apifier.com/v1/execs/q8uunYKjdwkCTqRBq',
                        resultsUrl: 'https://api.apifier.com/v1/execs/q8uunYKjdwkCTqRBq/results',
                    },
                    settingsUrl: 'https://api.apifier.com/v1/QKTX6JkmM9RLHGvZk/crawlers/Example_Hacker_News?token=itsrEEASPj4S2HjPdrxy7ntkY',
                    executionsListUrl:
                        'https://api.apifier.com/v1/QKTX6JkmM9RLHGvZk/crawlers/Example_Hacker_News/execs?token=qmMrJooqaFTdiRktrnxexeoLN',
                    lastExecutionFixedDetailsUrl:
                        'https://api.apifier.com/v1/QKTX6JkmM9RLHGvZk/crawlers/Example_Hacker_News/lastExec?token=qmMrJooqaFTdiRktrnxexeoLN',
                    lastExecutionFixedResultsUrl:
                        'https://api.apifier.com/v1/QKTX6JkmM9RLHGvZk/crawlers/Example_Hacker_News/lastExec/results?token=qmMrJooqaFTdiRktrnxexeoLN',
                },
            ];

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `http://myhost:80/mypath${BASE_PATH}/${credentials.userId}/crawlers`,
                qs: { token: credentials.token },
            }, [].concat(crawlersInResponse));

            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;

            return crawlerClient.listCrawlers().then((crawlers) => {
                expect(crawlers).to.deep.equal(crawlersInResponse);
            });
        });
    });

    describe('Start Execution', () => {
        it('should throw if crawler parameter is missing', () => {
            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;
            return expect(crawlerClient.startCrawler.bind(crawlerClient)).to.throw('Missing required parameter: crawler');
        });

        it('should throw if token parameter is missing', () => {
            const crawlerClient = new ApifyClient(basicOptions).crawlers;
            return expect(crawlerClient.startCrawler.bind(crawlerClient, { crawler: 'dummyCrawler' })).to.throw('Missing required parameter: token');
        });

        it('should call the right url', () => {
            requestExpectCall({
                json: true,
                method: 'POST',
                url: `http://myhost:80/mypath${BASE_PATH}/${credentials.userId}/crawlers/dummyCrawler/execute`,
                qs: { token: credentials.token },
            });

            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;

            return crawlerClient.startCrawler({ crawler: 'dummyCrawler' });
        });

        it('should forward tag and wait parameters', () => {
            requestExpectCall({
                json: true,
                method: 'POST',
                url: `http://myhost:80/mypath${BASE_PATH}/${credentials.userId}/crawlers/dummyCrawler/execute`,
                qs: { token: credentials.token, tag: 'dummyTag', wait: 30 },
            });

            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;

            return crawlerClient.startCrawler({ crawler: 'dummyCrawler', tag: 'dummyTag', wait: 30 });
        });

        it('should return what API returns', () => {
            const apiResponse = {
                _id: 'bmqzTAPKHcYKGg9B6',
                actId: 'CwNxxSNdBYw7NWLjb',
                startedAt: '2017-05-18T12:36:35.833Z',
                finishedAt: null,
                status: 'RUNNING',
            };

            requestExpectCall({
                json: true,
                method: 'POST',
                url: `http://myhost:80/mypath${BASE_PATH}/${credentials.userId}/crawlers/dummyCrawler/execute`,
                qs: { token: credentials.token },
            }, Object.assign({}, apiResponse));

            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;

            return crawlerClient.startCrawler({ crawler: 'dummyCrawler' }).then((execution) => {
                expect(execution).to.deep.equal(apiResponse);
            });
        });

        it('should pass body parameters', () => {
            requestExpectCall({
                json: true,
                method: 'POST',
                url: `http://myhost:80/mypath${BASE_PATH}/${credentials.userId}/crawlers/dummyCrawler/execute`,
                qs: { token: credentials.token },
                body: {
                    timeout: 300,
                    customData: { a: 'b' },
                },
            });

            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;

            return crawlerClient.startCrawler({ crawler: 'dummyCrawler', timeout: 300, customData: { a: 'b' } });
        });

        it('should not pass invalid body parameters', () => {
            requestExpectCall({
                json: true,
                method: 'POST',
                url: `http://myhost:80/mypath${BASE_PATH}/${credentials.userId}/crawlers/dummyCrawler/execute`,
                qs: { token: credentials.token },
            });

            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;

            return crawlerClient.startCrawler({ crawler: 'dummyCrawler', invalidParam: 300 });
        });
    });

    describe('Get Execution Details', () => {
        it('should throw if executionId is not provided', () => {
            const crawlerClient = new ApifyClient().crawlers;
            return expect(crawlerClient.getExecutionDetails.bind(crawlerClient)).to.throw('Missing required parameter: executionId');
        });

        it('should return what API returns', () => {
            const apiResponse = {
                _id: 'br9CKmk457',
                actId: 'i6tjys5XNh',
                startedAt: '2015-10-29T07:34:24.202Z',
                finishedAt: 'null',
                status: 'RUNNING',
            };

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `http://myhost:80/mypath${BASE_PATH}/execs/dummyExecution`,
            }, Object.assign({}, apiResponse));

            const crawlerClient = new ApifyClient(basicOptions).crawlers;

            return crawlerClient.getExecutionDetails({ executionId: 'dummyExecution' }).then((execution) => {
                expect(execution).to.deep.equal(apiResponse);
            });
        });
    });

    describe('Get Execution Results', () => {
        it('should throw if executionId is not provided', () => {
            const crawlerClient = new ApifyClient().crawlers;
            return expect(crawlerClient.getExecutionResults.bind(crawlerClient)).to.throw('Missing required parameter: executionId');
        });

        it('should return what API returns', () => {
            const apiResponse =
                [
                    {
                        id: 'ZCdD6lk9ZaIhC9eP',
                        url: 'https://example.com/example-page',
                        requestedAt: '2016-11-01T13:57:31.220Z',
                        uniqueKey: 'https://example.com/example-page',
                        type: 'StartUrl',
                        label: null,
                        referrerId: null,
                        depth: 0,
                        loadedUrl: 'https://example.com/example-page',
                        loadingStartedAt: '2016-11-01T13:57:31.570Z',
                        loadingFinishedAt: '2016-11-01T13:57:32.818Z',
                        responseStatus: 200,
                        responseHeaders: {
                            'Content-Type': 'text/html; charset=utf-8',
                            'Content-Length': '145',
                            Connection: 'keep-alive',
                            Date: 'Tue, 01 Nov 2016 13:57:32 GMT',
                            etag: 'W/"91-FFPJvYlWM/wKH5W+kRD+xg"',
                        },
                        pageFunctionStartedAt: '2016-11-01T13:57:33.018Z',
                        pageFunctionFinishedAt: '2016-11-01T13:57:33.019Z',
                        pageFunctionResult: {
                            myValue: 'some string extracted from site',
                        },
                        downloadedBytes: 145,
                        storageBytes: 692,
                        loadErrorCode: null,
                        isMainFrame: true,
                        postData: null,
                        contentType: null,
                        method: 'GET',
                        willLoad: true,
                        errorInfo: '',
                        interceptRequestData: null,
                        queuePosition: 'LAST',
                    },
                ];

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `http://myhost:80/mypath${BASE_PATH}/execs/dummyExecution/results`,
            }, [].concat(apiResponse));

            const crawlerClient = new ApifyClient(basicOptions).crawlers;

            return crawlerClient.getExecutionResults({ executionId: 'dummyExecution' }).then((executionResults) => {
                expect(executionResults).to.deep.equal(apiResponse);
            });
        });

        it('should put parameters into query string', () => {
            requestExpectCall({
                json: true,
                method: 'GET',
                url: `http://myhost:80/mypath${BASE_PATH}/execs/dummyExecution/results`,
                qs: {
                    format: 'csv',
                    simplified: 1,
                    offset: 1,
                    limit: 1,
                    desc: 1,
                    attachment: 1,
                    delimiter: ',',
                    bom: 0,
                },
            });

            const crawlerClient = new ApifyClient(basicOptions).crawlers;

            return crawlerClient.getExecutionResults({ executionId: 'dummyExecution',
                format: 'csv',
                simplified: 1,
                offset: 1,
                limit: 1,
                desc: 1,
                attachment: 1,
                delimiter: ',',
                bom: 0 });
        });
    });
});
