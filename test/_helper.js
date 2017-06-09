import _ from 'underscore';
import sinon from 'sinon';
import * as utils from '../build/utils';
import ApifyError, { REQUEST_FAILED_ERROR_TYPE, REQUEST_FAILED_ERROR_MESSAGE } from '../build/apify_error';

let requestMock;

export const mockRequest = () => {
    requestMock = sinon.mock(utils, 'requestPromise');
};

export const requestExpectCall = (requestOpts, body, response) => {
    if (!_.isObject(requestOpts)) throw new Error('"requestOpts" parameter must be an object!');
    if (!requestOpts.method) throw new Error('"requestOpts.method" parameter is not set!');

    const expectedRequestOpts = Object.assign({}, requestOpts, { promise: Promise });
    if (response) expectedRequestOpts.resolveWithResponse = true;
    const output = response ? Object.assign({}, response, { body }) : body;

    requestMock
        .expects('requestPromise')
        .once()
        .withArgs(expectedRequestOpts)
        .returns(Promise.resolve(output));
};

export const requestExpectErrorCall = (requestOpts, resolveWithResponse, statusCode) => {
    if (!_.isObject(requestOpts)) throw new Error('"requestOpts" parameter must be an object!');
    if (!requestOpts.method) throw new Error('"requestOpts.method" parameter is not set!');

    const expectedRequestOpts = Object.assign({}, requestOpts, { promise: Promise });
    if (resolveWithResponse) expectedRequestOpts.resolveWithResponse = true;

    const error = new ApifyError(REQUEST_FAILED_ERROR_TYPE, REQUEST_FAILED_ERROR_MESSAGE, { statusCode });

    requestMock
        .expects('requestPromise')
        .once()
        .withArgs(expectedRequestOpts)
        .returns(Promise.reject(error));
};

export const verifyAndRestoreRequest = () => {
    requestMock.verify();
    requestMock.restore();
};
