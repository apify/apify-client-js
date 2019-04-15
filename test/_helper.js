import _ from 'underscore';
import sinon from 'sinon';
import * as utils from '../build/utils';
import * as requestQueues from '../build/request_queues';
import ApifyClientError, { REQUEST_FAILED_ERROR_TYPE, REQUEST_FAILED_ERROR_MESSAGE } from '../build/apify_error';

let requestMock;

export const DEFAULT_RATE_LIMIT_ERRORS = new Array(
    Math.max(requestQueues.REQUEST_ENDPOINTS_EXP_BACKOFF_MAX_REPEATS, utils.EXP_BACKOFF_MAX_REPEATS),
).fill(0);

export const mockRequest = () => {
    requestMock = sinon.mock(utils, 'requestPromise');
};

export const newEmptyStats = () => {
    return {
        calls: 0,
        requests: 0,
        rateLimitErrors: [...DEFAULT_RATE_LIMIT_ERRORS],
    };
};

export const requestExpectCall = (requestOpts, body, response) => {
    if (!_.isObject(requestOpts)) throw new Error('"requestOpts" parameter must be an object!');
    if (!requestOpts.method) throw new Error('"requestOpts.method" parameter is not set!');

    const expectedRequestOpts = Object.assign({}, requestOpts);
    if (response) expectedRequestOpts.resolveWithFullResponse = true;
    const output = response ? Object.assign({}, response, { body }) : body;

    requestMock
        .expects('requestPromise')
        .once()
        .withArgs(expectedRequestOpts, newEmptyStats())
        .returns(Promise.resolve(output));
};

export const requestExpectErrorCall = (requestOpts, resolveWithFullResponse, statusCode) => {
    if (!_.isObject(requestOpts)) throw new Error('"requestOpts" parameter must be an object!');
    if (!requestOpts.method) throw new Error('"requestOpts.method" parameter is not set!');

    const expectedRequestOpts = Object.assign({}, requestOpts);
    if (resolveWithFullResponse) expectedRequestOpts.resolveWithFullResponse = true;

    const error = new ApifyClientError(REQUEST_FAILED_ERROR_TYPE, REQUEST_FAILED_ERROR_MESSAGE, { statusCode });

    requestMock
        .expects('requestPromise')
        .once()
        .withArgs(expectedRequestOpts, newEmptyStats())
        .returns(Promise.reject(error));
};

export const restoreRequest = () => {
    requestMock.restore();
};
