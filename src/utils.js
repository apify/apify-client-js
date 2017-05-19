import request from 'request';
import _ from 'underscore';

/**
 * Promised version of request(options) function.
 */
export const requestPromise = (PromisesDependency, options, resolveWithResponse) => {
    const method = _.isString(options.method) ? options.method.toLowerCase() : options.method;

    if (!method) throw new Error('"options.method" parameter must be provided');
    if (!request[method]) throw new Error('"options.method" is not a valid http request method');

    return new PromisesDependency((resolve, reject) => {
        // We have to use request[method]({ ... }) instead of request({ method, ... })
        // to be able to mock request when unit testing requestPromise().
        request[method](options, (error, response, body) => {
            if (error) return reject(error);

            if (response.statusCode >= 300) {
                let message;

                // TODO: this doesn't work because body might be a string, not an object parsed from JSON
                // BTW the exception should be of type ApifyError and contain all error details such as:
                // { message: "Record was not found",
                //   type: "RECORD_NOT_FOUND",
                //   status: 404 }
                // so that the users can work with the errors.
                if (body.type && body.message) message = `[${body.type}] ${body.message}`;
                else if (body.type) message = body.type;
                else if (body.message) message = body.message;
                else message = 'Request failed';

                reject(new Error(message));
            }

            if (resolveWithResponse) resolve({ body, response });
            else resolve(body);
        });
    });
};
