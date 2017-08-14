import request from 'request';
import _ from 'underscore';
import { parseType, parsedTypeCheck } from 'type-check';
import { gzip } from 'zlib';
import ApifyError, {
    INVALID_PARAMETER_ERROR_TYPE,
    REQUEST_FAILED_ERROR_TYPE,
    REQUEST_FAILED_ERROR_MESSAGE,
    NOT_FOUND_STATUS_CODE,
} from './apify_error';

const RATE_LIMIT_EXCEEDED_STATUS_CODE = 429;
const EXP_BACKOFF_MILLIS = 500;
const EXP_BACKOFF_MAX_REPEATS = 8; // 64s
const CONTENT_TYPE_JSON = 'application/json';
const CONTENT_TYPE_TEXT_PLAIN = 'text/plain';

export const REQUEST_PROMISE_OPTIONS = ['promise', 'expBackOffMillis', 'expBackOffMaxRepeats'];

/**
 * Parses a JSON string. If string is not JSON then catches an error and returns empty object.
 */
export const safeJsonParse = (str) => {
    let parsed;

    try {
        parsed = JSON.parse(str);
    } catch (err) {
        parsed = {};
    }

    return parsed;
};

/**
 * Creates an error from API response body and statusCode.
 * If body is object or JSON string in form
 *
 * { type: 'ITEM_NOT_FOUND', message: 'Requested item was not found.' }
 *
 * then uses it's error type or message or both.
 */
export const newApifyErrorFromResponse = (statusCode, body) => {
    let parsedBody = {};

    if (_.isObject(body)) parsedBody = body;
    else if (_.isString(body)) parsedBody = safeJsonParse(body);

    const error = parsedBody.error || parsedBody;
    const type = error.type || REQUEST_FAILED_ERROR_TYPE;
    const message = error.message || REQUEST_FAILED_ERROR_MESSAGE;

    return new ApifyError(type, message, { statusCode });
};

/**
 * Promised version of request(options) function.
 *
 * If response status code is >= 500 or RATE_LIMIT_EXCEEDED_STATUS_CODE then uses exponential backoff
 * alghorithm to repeat the request.
 *
 * Possible options parameters are:
 * - everything supported by 'request' npm package (mainly 'method', 'url' and 'qs')
 * - resolveWithResponse - to resolve promise with whole response instead of just body
 * - expBackOffMillis - initial wait time before next repeat in a case of error
 * - expBackOffMaxRepeats - maximal number of repeats
 */
export const requestPromise = (options, iteration = 0) => {
    const PromisesDependency = options.promise;
    const expBackOffMillis = options.expBackOffMillis || EXP_BACKOFF_MILLIS;
    const expBackOffMaxRepeats = options.expBackOffMaxRepeats || EXP_BACKOFF_MAX_REPEATS;
    const method = _.isString(options.method) ? options.method.toLowerCase() : options.method;
    const resolveWithResponse = options.resolveWithResponse;

    if (typeof PromisesDependency !== 'function') {
        throw new ApifyError(INVALID_PARAMETER_ERROR_TYPE, '"options.promise" parameter must be provided');
    }

    if (!method) {
        throw new ApifyError(INVALID_PARAMETER_ERROR_TYPE, '"options.method" parameter must be provided');
    }

    if (!request[method]) {
        throw new ApifyError(INVALID_PARAMETER_ERROR_TYPE, '"options.method" is not a valid http request method');
    }

    return new PromisesDependency((resolve, reject) => {
        // We have to use request[method]({ ... }) instead of request({ method, ... })
        // to be able to mock request when unit testing requestPromise().
        request[method](options, (error, response, body) => {
            if (error) return reject(new ApifyError(REQUEST_FAILED_ERROR_TYPE, error.message));

            const statusCode = response.statusCode;

            // If status code is >= 500 or RATE_LIMIT_EXCEEDED_STATUS_CODE then we repeat the request.
            // We use exponential backoff alghorithm with up to `expBackOffMillis` repeats.
            if (statusCode >= 500 || statusCode === RATE_LIMIT_EXCEEDED_STATUS_CODE) {
                if (iteration >= expBackOffMaxRepeats) {
                    const errMessage = `Server request failed with ${iteration + 1} tries.`;
                    reject(new ApifyError(REQUEST_FAILED_ERROR_TYPE, errMessage, { statusCode, iteration }));
                }

                const waitMillis = _.random(expBackOffMillis, expBackOffMillis * 2);
                const repeatCall = () => {
                    const nextCallOptions = Object.assign({}, options, { expBackOffMillis: expBackOffMillis * 2 });

                    requestPromise(nextCallOptions, iteration + 1).then(resolve, reject);
                };

                return setTimeout(repeatCall, waitMillis);
            }

            // For status codes 300-499 except RATE_LIMIT_EXCEEDED_STATUS_CODE we immediately rejects the promise
            // since it's probably caused by invalid url (redirect 3xx) or invalid user input (4xx).
            if (statusCode >= 300) return reject(newApifyErrorFromResponse(statusCode, body));

            if (resolveWithResponse) resolve(response);
            else resolve(body);
        });
    });
};

/**
 * Checks that given parameter is of given type and throws ApifyError.
 * If errorMessage is not provided then error message is created from name and type of param.
 *
 * @param {String} value - user entered value of that parameter
 * @param {String} name - parameter name (crawlerId for options.crawlerId)
 * @param {String} type - "String", "Number", ... (see ee: https://github.com/gkz/type-check)
 * @param {String} errorMessage - optional error message
 */
export const checkParamOrThrow = (value, name, type, errorMessage) => {
    if (!errorMessage) errorMessage = `Parameter "${name}" of type ${type} must be provided`;

    const allowedTypes = parseType(type);

    // This is workaround since Buffer doesn't seem to be possible to define using options.customTypes.
    const allowsBuffer = allowedTypes.filter(item => item.type === 'Buffer').length;

    if (allowsBuffer && Buffer.isBuffer(value)) return;

    // This will ignore Buffer type.
    if (!parsedTypeCheck(allowedTypes, value)) {
        throw new ApifyError(INVALID_PARAMETER_ERROR_TYPE, errorMessage);
    }
};

/**
 * Returns object's data property or null if parameter is not an object.
 */
export const pluckData = obj => (_.isObject(obj) && !_.isUndefined(obj.data) ? obj.data : null);

/**
 * If given HTTP error has NOT_FOUND_STATUS_CODE status code then returns null.
 * Otherwise rethrows error.
 */
export const catchNotFoundOrThrow = (err) => {
    if (err.details && err.details.statusCode === NOT_FOUND_STATUS_CODE) return null;

    throw err;
};

/**
 * Promisified zlib.gzip().
 */
export const gzipPromise = (Promise, buffer) => {
    return new Promise((resolve, reject) => {
        gzip(buffer, (err, gzippedBuffer) => {
            if (err) return reject(err);

            resolve(gzippedBuffer);
        });
    });
};

/**
 * Function for encoding/parsing body.
 */
export const decodeBody = (body, contentType) => {
    switch (contentType) {
        case CONTENT_TYPE_JSON: return JSON.parse(body);
        case CONTENT_TYPE_TEXT_PLAIN: return body.toString();
        default: return body;
    }
};
export const encodeBody = (body, contentType) => {
    switch (contentType) {
        case CONTENT_TYPE_JSON: return JSON.stringify(body);
        default: return body;
    }
};
