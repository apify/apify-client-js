import request from 'request';
import _ from 'underscore';
import ApifyError, {
    INVALID_PARAMETER_ERROR_TYPE,
    REQUEST_FAILED_ERROR_TYPE,
    REQUEST_FAILED_ERROR_MESSAGE,
} from './apify-error';

const RATE_LIMIT_EXCEEDED_STATUS_CODE = 429;
const EXP_BACKOFF_MILLIS = 500;
const EXP_BACKOFF_MAX_REPEATS = 8; // 64s

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

    const type = parsedBody.type || REQUEST_FAILED_ERROR_TYPE;
    const message = parsedBody.message || REQUEST_FAILED_ERROR_MESSAGE;

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
 * - resolveWithResponse - to resolve promise with { body, response } instead of just body
 * - expBackOffMillis - initial wait time before next repeat in a case of error
 * - expBackOffMaxRepeats - maximal number of repeats
 */
export const requestPromise = (PromisesDependency, options, iteration = 0) => {
    const expBackOffMillis = options.expBackOffMillis || EXP_BACKOFF_MILLIS;
    const expBackOffMaxRepeats = options.expBackOffMaxRepeats || EXP_BACKOFF_MAX_REPEATS;
    const method = _.isString(options.method) ? options.method.toLowerCase() : options.method;

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
                    const newOptions = Object.assign({}, options, { expBackOffMillis: expBackOffMillis * 2 });

                    requestPromise(PromisesDependency, newOptions, iteration + 1).then(resolve, reject);
                };

                return setTimeout(repeatCall, waitMillis);
            }

            // For status codes 300-499 except RATE_LIMIT_EXCEEDED_STATUS_CODE we immediately rejects the promise
            // since it's probably caused by invalid url (redirect 3xx) or invalid user input (4xx).
            if (statusCode >= 300) return reject(newApifyErrorFromResponse(statusCode, body));

            if (options.resolveWithResponse) resolve({ body, response });
            else resolve(body);
        });
    });
};
