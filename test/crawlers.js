import { expect } from 'chai';
import ApifyClient from '../build';
import { BASE_PATH } from '../build/crawlers';
import { mockRequest, requestExpectCall, requestExpectErrorCall, verifyAndRestoreRequest } from './_helper';

const basicOptions = {
    baseUrl: 'http://myhost:80/mypath',
};

const credentials = {
    userId: 'DummyUserId',
    token: 'DummyTokenXXXXX',
};

const optionsWithCredentials = Object.assign({}, basicOptions, credentials);

describe('Crawlers', () => {
    before(mockRequest);
    after(verifyAndRestoreRequest);

    describe('List crawlers', () => {
        const sampleBody = [
            {
                _id: 'wKw8QeHiHiyd8YGN8',
                customId: 'Example_RSS',
                createdAt: '2017-04-03T15:02:05.789Z',
                modifiedAt: '2017-04-03T15:02:05.789Z',
            },
            {
                _id: 'EfEjTWAgnDGavzccq',
                customId: 'Example_Hacker_News',
                createdAt: '2017-04-03T15:02:05.789Z',
                modifiedAt: '2017-04-03T15:02:05.789Z',
            },
        ];
        const sampleResponse = { body: sampleBody,
            headers: { date: 'Tue, 30 May 2017 09:34:08 GMT',
                'content-type': 'application/json; charset=utf-8',
                'transfer-encoding': 'chunked',
                connection: 'close',
                server: 'nginx',
                'cache-control': 'no-cache, no-store, must-revalidate',
                pragma: 'no-cache',
                expires: '0',
                'access-control-allow-origin': '*',
                'access-control-allow-headers': 'Content-Type',
                'access-control-allow-methods': 'GET, POST',
                'access-control-expose-headers':
                    'X-Apifier-Pagination-Total, X-Apifier-Pagination-Offset, X-Apifier-Pagination-Count, X-Apifier-Pagination-Limit',
                allow: 'GET, POST',
                'x-apifier-pagination-total': '35',
                'x-apifier-pagination-offset': '0',
                'x-apifier-pagination-count': '35',
                'x-apifier-pagination-limit': '1000',
                vary: 'Accept-Encoding' },
        };

        it('should throw if token is not provided', () => {
            const crawlerClient = new ApifyClient(basicOptions).crawlers;
            return expect(crawlerClient.listCrawlers.bind(crawlerClient, { userId: credentials.userId }))
                .to.throw('Parameter "token" of type String must be provided');
        });

        it('should throw if userId is not Provided', () => {
            const crawlerClient = new ApifyClient(basicOptions).crawlers;
            return expect(crawlerClient.listCrawlers.bind(crawlerClient, { token: credentials.token }))
                .to.throw('Parameter "userId" of type String must be provided');
        });

        it('should be able to use default userId/token', () => {
            requestExpectCall({
                json: true,
                method: 'GET',
                url: `http://myhost:80/mypath${BASE_PATH}/${credentials.userId}/crawlers`,
                qs: { token: credentials.token },
                resolveWithResponse: true,
            }, {}, sampleResponse);

            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;

            return crawlerClient.listCrawlers();
        });

        it('should override default userId/token with credentials passed as parameters', () => {
            requestExpectCall({
                json: true,
                method: 'GET',
                url: `http://myhost:80/mypath${BASE_PATH}/userIdParameter/crawlers`,
                qs: { token: 'tokenParameter' },
                resolveWithResponse: true,
            }, {}, sampleResponse);

            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;

            return crawlerClient.listCrawlers({ userId: 'userIdParameter', token: 'tokenParameter' });
        });

        it('should wrap what API returns', () => {
            requestExpectCall({
                json: true,
                method: 'GET',
                url: `http://myhost:80/mypath${BASE_PATH}/${credentials.userId}/crawlers`,
                qs: { token: credentials.token },
                resolveWithResponse: true,
            }, sampleResponse);

            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;

            const expected = { items: sampleBody,
                total: '35',
                count: '35',
                offset: '0',
                limit: '1000',
            };

            return crawlerClient.listCrawlers().then((response) => {
                expect(response).to.deep.equal(expected);
            });
        });
    });


    describe('Create Crawler', () => {
        it('should throw if token parameter is missing', () => {
            const crawlerClient = new ApifyClient(basicOptions).crawlers;
            return expect(crawlerClient.createCrawler.bind(crawlerClient, { userId: 'dummyUserId' }))
                    .to.throw('Parameter "token" of type String must be provided');
        });

        it('should throw if settings parameter is missing', () => {
            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;
            return expect(crawlerClient.createCrawler.bind(crawlerClient, {}))
                    .to.throw('Parameter "settings" of type Object must be provided');
        });

        it('should throw if settings.customId parameter is missing', () => {
            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;
            return expect(crawlerClient.createCrawler.bind(crawlerClient, { settings: {} }))
                    .to.throw('Parameter "settings.customId" of type String must be provided');
        });

        it('should return what API returns', () => {
            const apiResponse = {
                customId: 'My_crawler',
                comments: 'My testing crawler',
                startUrls: [
                    {
                        key: 'START',
                        value: 'http://example.com',
                    },
                ],
                crawlPurls: [
                    {
                        key: 'PAGE',
                        value: 'http://example.com/test-2/[.*]',
                    },
                ] };

            requestExpectCall({
                json: true,
                method: 'POST',
                url: `http://myhost:80/mypath${BASE_PATH}/${credentials.userId}/crawlers`,
                qs: { token: credentials.token },
                body: { customId: 'dummyCrawler' },
            }, Object.assign({}, apiResponse));

            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;

            return crawlerClient.createCrawler({ settings: { customId: 'dummyCrawler' } }).then((settings) => {
                expect(settings).to.deep.equal(apiResponse);
            });
        });
    });

    describe('Update Crawler Settings', () => {
        it('should throw if token parameter is missing', () => {
            const crawlerClient = new ApifyClient(basicOptions).crawlers;
            return expect(crawlerClient.updateCrawler.bind(crawlerClient, { userId: 'dummyUserId' }))
                    .to.throw('Parameter "token" of type String must be provided');
        });

        it('should throw if settings parameter is missing', () => {
            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;
            return expect(crawlerClient.updateCrawler.bind(crawlerClient, { crawlerId: 'dummyCrawler' }))
                    .to.throw('Parameter "settings" of type Object must be provided');
        });

        it('should return what API returns', () => {
            const apiResponse = {
                customId: 'My_crawler',
                comments: 'dummyComments',
                startUrls: [
                    {
                        key: 'START',
                        value: 'http://example.com',
                    },
                ],
                crawlPurls: [
                    {
                        key: 'PAGE',
                        value: 'http://example.com/test-2/[.*]',
                    },
                ] };

            requestExpectCall({
                json: true,
                method: 'PUT',
                url: `http://myhost:80/mypath${BASE_PATH}/${credentials.userId}/crawlers/dummyCrawler`,
                qs: { token: credentials.token },
                body: { comments: 'dummyComments' },
            }, Object.assign({}, apiResponse));

            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;

            return crawlerClient.updateCrawler({ crawlerId: 'dummyCrawler', settings: { comments: 'dummyComments' } }).then((settings) => {
                expect(settings).to.deep.equal(apiResponse);
            });
        });
    });

    describe('Get Crawler Settings', () => {
        it('should throw if userId is not provided', () => {
            const crawlerClient = new ApifyClient(basicOptions).crawlers;
            return expect(crawlerClient.getCrawlerSettings.bind(crawlerClient)).to.throw('Parameter "userId" of type String must be provided');
        });

        it('should throw if crawlerId is not provided', () => {
            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;
            return expect(crawlerClient.getCrawlerSettings.bind(crawlerClient)).to.throw('Parameter "crawlerId" of type String must be provided');
        });

        it('should return what API returns', () => {
            const apiResponse = {
                customId: 'My_crawler',
                _id: 'zDtOpyeYDO9aDEFdK',
                comments: 'My testing crawler',
                startUrls: [
                    {
                        key: 'START',
                        value: 'http://example.com',
                    },
                ],
                crawlPurls: [
                    {
                        key: 'PAGE',
                        value: 'http://example.com/test-2/[.*]',
                    },
                ],
                pageFunction: 'function(context) { /* ... */ }',
                clickableElementsSelector: '#article a',
                cookiesPersistence: 'PER_PROCESS',
                finishWebhookUrl: 'http://example.com/some/path',
            };

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `http://myhost:80/mypath${BASE_PATH}/${credentials.userId}/crawlers/dummyCrawler`,
                qs: { token: credentials.token },
            }, Object.assign({}, apiResponse));

            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;

            return crawlerClient.getCrawlerSettings({ crawlerId: 'dummyCrawler' }).then((settings) => {
                expect(settings).to.deep.equal(apiResponse);
            });
        });

        it('should forward nosecrets parameters', () => {
            requestExpectCall({
                json: true,
                method: 'GET',
                url: `http://myhost:80/mypath${BASE_PATH}/${credentials.userId}/crawlers/dummyCrawler`,
                qs: { nosecrets: 1, token: credentials.token },
            });

            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;

            return crawlerClient.getCrawlerSettings({ crawlerId: 'dummyCrawler', nosecrets: 1 });
        });

        it('should return null on 404 status code (RECORD_NOT_FOUND)', () => {
            requestExpectErrorCall({
                json: true,
                method: 'GET',
                url: `http://myhost:80/mypath${BASE_PATH}/${credentials.userId}/crawlers/dummyCrawler`,
                qs: { token: credentials.token },
            }, false, 404);

            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;

            return crawlerClient
            .getCrawlerSettings({ crawlerId: 'dummyCrawler', token: credentials.token })
            .then(settings => expect(settings).to.be.eql(null));
        });
    });

    describe('Delete Crawler', () => {
        it('should throw if userId is not provided', () => {
            const crawlerClient = new ApifyClient(basicOptions).crawlers;
            return expect(crawlerClient.deleteCrawler.bind(crawlerClient)).to.throw('Parameter "userId" of type String must be provided');
        });

        it('should throw if crawlerId is not provided', () => {
            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;
            return expect(crawlerClient.deleteCrawler.bind(crawlerClient)).to.throw('Parameter "crawlerId" of type String must be provided');
        });

        it('should return what API returns', () => {
            requestExpectCall({
                json: true,
                method: 'DELETE',
                url: `http://myhost:80/mypath${BASE_PATH}/${credentials.userId}/crawlers/dummyCrawler`,
                qs: { token: credentials.token },
            });

            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;

            return crawlerClient.deleteCrawler({ crawlerId: 'dummyCrawler' });
        });
    });

    describe('Start Execution', () => {
        it('should throw if crawlerId parameter is missing', () => {
            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;
            return expect(crawlerClient.startExecution.bind(crawlerClient)).to.throw('Parameter "crawlerId" of type String must be provided');
        });

        it('should throw if token parameter is missing', () => {
            const crawlerClient = new ApifyClient(basicOptions).crawlers;
            return expect(crawlerClient.startExecution.bind(crawlerClient, { crawler: 'dummyCrawler', userId: 'dummyUserId' }))
                .to.throw('Parameter "token" of type String must be provided');
        });

        it('should call the right url', () => {
            requestExpectCall({
                json: true,
                method: 'POST',
                url: `http://myhost:80/mypath${BASE_PATH}/${credentials.userId}/crawlers/dummyCrawler/execute`,
                qs: { token: credentials.token },
            });

            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;

            return crawlerClient.startExecution({ crawlerId: 'dummyCrawler' });
        });

        it('should forward tag and wait parameters', () => {
            requestExpectCall({
                json: true,
                method: 'POST',
                url: `http://myhost:80/mypath${BASE_PATH}/${credentials.userId}/crawlers/dummyCrawler/execute`,
                qs: { token: credentials.token, tag: 'dummyTag', wait: 30 },
            });

            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;

            return crawlerClient.startExecution({ crawlerId: 'dummyCrawler', tag: 'dummyTag', wait: 30 });
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

            return crawlerClient.startExecution({ crawlerId: 'dummyCrawler' }).then((execution) => {
                expect(execution).to.deep.equal(apiResponse);
            });
        });

        it('should pass settings parameters', () => {
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

            return crawlerClient.startExecution({ crawlerId: 'dummyCrawler', settings: { timeout: 300, customData: { a: 'b' } } });
        });
    });

    describe('Stop Execution', () => {
        it('should throw if executionId parameter is missing', () => {
            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;
            return expect(crawlerClient.stopExecution.bind(crawlerClient)).to.throw('Parameter "executionId" of type String must be provided');
        });

        it('should throw if token parameter is missing', () => {
            const crawlerClient = new ApifyClient(basicOptions).crawlers;
            return expect(crawlerClient.stopExecution.bind(crawlerClient, { executionId: 'dummyExecution' }))
                .to.throw('Parameter "token" of type String must be provided');
        });

        it('should return what API returns', () => {
            const apiResponse = {
                _id: 'br9CKmk457',
                actId: 'i6tjys5XNh',
                startedAt: '2015-10-29T07:34:24.202Z',
                finishedAt: 'null',
                status: 'RUNNING',
                statusMessage: 'null',
                tag: 'my_test_run',
                detailsUrl: 'https://api.apifier.com/v1/execs/br9CKmk457',
                resultsUrl: 'https://api.apifier.com/v1/execs/br9CKmk457/results',
            };

            requestExpectCall({
                json: true,
                method: 'POST',
                url: `http://myhost:80/mypath${BASE_PATH}/execs/dummyExecution/stop`,
                qs: { token: credentials.token },
            }, Object.assign({}, apiResponse));

            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;

            return crawlerClient.stopExecution({ executionId: 'dummyExecution' }).then((execution) => {
                expect(execution).to.deep.equal(apiResponse);
            });
        });
    });

    describe('Get List of Executions', () => {
        it('should throw if userId is not provided', () => {
            const crawlerClient = new ApifyClient(basicOptions).crawlers;
            return expect(crawlerClient.getListOfExecutions.bind(crawlerClient)).to.throw('Parameter "userId" of type String must be provided');
        });

        it('should throw if crawlerId is not provided', () => {
            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;
            return expect(crawlerClient.getListOfExecutions.bind(crawlerClient)).to.throw('Parameter "crawlerId" of type String must be provided');
        });

        it('should wrap what API returns', () => {
            const sampleBody = [
                {
                    _id: 'br9CKmk457',
                    actId: 'i6tjys5XNh',
                    startedAt: '2015-10-29T07:34:24.202Z',
                    finishedAt: 'null',
                    status: 'RUNNING',
                    statusMessage: 'null',
                    tag: 'my_test_run',
                    stats: {
                        downloadedBytes: 74232,
                        pagesInQueue: 1,
                        pagesCrawled: 3,
                        pagesOutputted: 3,
                        pagesFailed: 0,
                        pagesCrashed: 0,
                        totalPageRetries: 0,
                        storageBytes: 24795,
                    },
                    meta: {
                        source: 'API',
                        method: 'POST',
                        clientIp: '1.2.3.4',
                        userAgent: 'curl/7.43.0',
                        scheduleId: '3ioW6u35s8g7kHDoE',
                        scheduledActId: 'vJmysCj4xx98ftgKo',
                        scheduledAt: '2016-12-22T11:30:00.000Z',
                    },
                    detailsUrl: 'https://api.apifier.com/v1/execs/br9CKmk457',
                    resultsUrl: 'https://api.apifier.com/v1/execs/br9CKmk457/results',
                },
            ];
            const sampleResponse = { body: sampleBody,
                headers: { date: 'Tue, 30 May 2017 09:34:08 GMT',
                    'content-type': 'application/json; charset=utf-8',
                    'transfer-encoding': 'chunked',
                    connection: 'close',
                    server: 'nginx',
                    'cache-control': 'no-cache, no-store, must-revalidate',
                    pragma: 'no-cache',
                    expires: '0',
                    'access-control-allow-origin': '*',
                    'access-control-allow-headers': 'Content-Type',
                    'access-control-allow-methods': 'GET, POST',
                    'access-control-expose-headers':
                        'X-Apifier-Pagination-Total, X-Apifier-Pagination-Offset, X-Apifier-Pagination-Count, X-Apifier-Pagination-Limit',
                    allow: 'GET, POST',
                    'x-apifier-pagination-total': '35',
                    'x-apifier-pagination-offset': '0',
                    'x-apifier-pagination-count': '35',
                    'x-apifier-pagination-limit': '1000',
                    vary: 'Accept-Encoding' },
            };

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `http://myhost:80/mypath${BASE_PATH}/${credentials.userId}/crawlers/dummyCrawler/execs`,
                qs: { token: credentials.token },
                resolveWithResponse: true,
            }, sampleBody, sampleResponse);

            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;

            const expected = { items: sampleBody,
                total: '35',
                count: '35',
                offset: '0',
                limit: '1000',
            };

            return crawlerClient.getListOfExecutions({ crawlerId: 'dummyCrawler' }).then((response) => {
                expect(response).to.deep.equal(expected);
            });
        });
    });

    describe('Get Execution Details', () => {
        it('should throw if executionId is not provided', () => {
            const crawlerClient = new ApifyClient().crawlers;
            return expect(crawlerClient.getExecutionDetails.bind(crawlerClient)).to.throw('Parameter "executionId" of type String must be provided');
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

        it('should return null on 404 status code (RECORD_NOT_FOUND)', () => {
            requestExpectErrorCall({
                json: true,
                method: 'GET',
                url: `http://myhost:80/mypath${BASE_PATH}/execs/dummyExecution`,
            }, false, 404);

            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;

            return crawlerClient
            .getExecutionDetails({ executionId: 'dummyExecution' })
            .then(executionDetail => expect(executionDetail).to.be.eql(null));
        });
    });

    describe('Get Last Execution Details', () => {
        it('should throw if userId is not provided', () => {
            const crawlerClient = new ApifyClient(basicOptions).crawlers;
            return expect(crawlerClient.getLastExecution.bind(crawlerClient)).to.throw('Parameter "userId" of type String must be provided');
        });

        it('should throw if crawlerId is not provided', () => {
            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;
            return expect(crawlerClient.getLastExecution.bind(crawlerClient)).to.throw('Parameter "crawlerId" of type String must be provided');
        });

        it('should return what API returns', () => {
            const apiResponse = {
                _id: 'br9CKmk457',
                actId: 'i6tjys5XNh',
                startedAt: '2015-10-29T07:34:24.202Z',
                finishedAt: 'null',
                status: 'RUNNING',
                detailsUrl: 'https://api.apifier.com/v1/execs/br9CKmk457',
                resultsUrl: 'https://api.apifier.com/v1/execs/br9CKmk457/results',
            };

            requestExpectCall({
                json: true,
                method: 'GET',
                url: `http://myhost:80/mypath${BASE_PATH}/${credentials.userId}/crawlers/dummyCrawler/lastExec`,
                qs: { token: credentials.token },
            }, Object.assign({}, apiResponse));

            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;

            return crawlerClient.getLastExecution({ crawlerId: 'dummyCrawler' }).then((execution) => {
                expect(execution).to.deep.equal(apiResponse);
            });
        });
    });

    describe('Get Execution Results', () => {
        const sampleBody =
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

        const sampleResponse = { body: sampleBody,
            headers: { date: 'Tue, 30 May 2017 09:34:08 GMT',
                'content-type': 'application/json; charset=utf-8',
                'transfer-encoding': 'chunked',
                connection: 'close',
                server: 'nginx',
                'cache-control': 'no-cache, no-store, must-revalidate',
                pragma: 'no-cache',
                expires: '0',
                'access-control-allow-origin': '*',
                'access-control-allow-headers': 'Content-Type',
                'access-control-allow-methods': 'GET, POST',
                'access-control-expose-headers':
                      'X-Apifier-Pagination-Total, X-Apifier-Pagination-Offset, X-Apifier-Pagination-Count, X-Apifier-Pagination-Limit',
                allow: 'GET, POST',
                'x-apifier-pagination-total': '35',
                'x-apifier-pagination-offset': '0',
                'x-apifier-pagination-count': '35',
                'x-apifier-pagination-limit': '1000',
                vary: 'Accept-Encoding' },
        };

        const expected = { items: sampleBody,
            total: '35',
            count: '35',
            offset: '0',
            limit: '1000',
        };

        it('should throw if executionId is not provided', () => {
            const crawlerClient = new ApifyClient().crawlers;
            return expect(crawlerClient.getExecutionResults.bind(crawlerClient)).to.throw('Parameter "executionId" of type String must be provided');
        });

        it('should wrap what API returns', () => {
            requestExpectCall({
                json: true,
                method: 'GET',
                url: `http://myhost:80/mypath${BASE_PATH}/execs/dummyExecution/results`,
            }, sampleBody, sampleResponse);

            const crawlerClient = new ApifyClient(basicOptions).crawlers;

            return crawlerClient.getExecutionResults({ executionId: 'dummyExecution' }).then((response) => {
                expect(response).to.deep.equal(expected);
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
                resolveWithResponse: true,
            }, sampleBody, sampleResponse);

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

    describe('Get Last Execution Results', () => {
        const sampleBody =
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

        const sampleResponse = { body: sampleBody,
            headers: { date: 'Tue, 30 May 2017 09:34:08 GMT',
                'content-type': 'application/json; charset=utf-8',
                'transfer-encoding': 'chunked',
                connection: 'close',
                server: 'nginx',
                'cache-control': 'no-cache, no-store, must-revalidate',
                pragma: 'no-cache',
                expires: '0',
                'access-control-allow-origin': '*',
                'access-control-allow-headers': 'Content-Type',
                'access-control-allow-methods': 'GET, POST',
                'access-control-expose-headers':
                        'X-Apifier-Pagination-Total, X-Apifier-Pagination-Offset, X-Apifier-Pagination-Count, X-Apifier-Pagination-Limit',
                allow: 'GET, POST',
                'x-apifier-pagination-total': '35',
                'x-apifier-pagination-offset': '0',
                'x-apifier-pagination-count': '35',
                'x-apifier-pagination-limit': '1000',
                vary: 'Accept-Encoding' },
        };

        const expected = { items: sampleBody,
            total: '35',
            count: '35',
            offset: '0',
            limit: '1000',
        };

        it('should throw if userId is not provided', () => {
            const crawlerClient = new ApifyClient(basicOptions).crawlers;
            return expect(crawlerClient.getLastExecutionResults.bind(crawlerClient)).to.throw('Parameter "userId" of type String must be provided');
        });

        it('should throw if crawlerId is not provided', () => {
            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;
            return expect(crawlerClient.getLastExecutionResults.bind(crawlerClient))
                .to.throw('Parameter "crawlerId" of type String must be provided');
        });

        it('should wrap what API returns', () => {
            requestExpectCall({
                json: true,
                method: 'GET',
                url: `http://myhost:80/mypath${BASE_PATH}/${credentials.userId}/crawlers/dummyCrawler/lastExec/results`,
                qs: { token: credentials.token },
                resolveWithResponse: true,
            }, sampleBody, sampleResponse);

            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;

            return crawlerClient.getLastExecutionResults({ crawlerId: 'dummyCrawler' }).then((results) => {
                expect(results).to.deep.equal(expected);
            });
        });

        it('should put status parameter into query string', () => {
            requestExpectCall({
                json: true,
                method: 'GET',
                url: `http://myhost:80/mypath${BASE_PATH}/${credentials.userId}/crawlers/dummyCrawler/lastExec/results`,
                qs: { token: credentials.token, status: 'RUNNING' },
                resolveWithResponse: true,
            }, sampleBody, sampleResponse);

            const crawlerClient = new ApifyClient(optionsWithCredentials).crawlers;

            return crawlerClient.getLastExecutionResults({ crawlerId: 'dummyCrawler', status: 'RUNNING' });
        });
    });
});
