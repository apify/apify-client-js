import request from 'request';
import _ from 'underscore';

/**
 * Parses simple map { a: 'aa', b: 'bb' } to query string ?a=aa&b=bb.
 */
export const objectToQueryString = (object) => {
    const query = _.chain(object)
                   .mapObject((val, key) => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`)
                   .toArray()
                   .value()
                   .join('&');

    return query ? `?${query}` : '';
};

/**
 * Promised version of request(options) function.
 */
export const requestPromise = (PromisesDependency, options) => {
    const method = _.isString(options.method) ? options.method.toLowerCase() : options.method;

    if (!method) throw new Error('"options.method" parameter must be provided');
    if (!request[method]) throw new Error('"options.method" is not a valid http request method');

    return new PromisesDependency((resolve, reject) => {
        // We have to use request[method]({ ... }) instead of request({ method, ... })
        // to be able to mock request when unit testing requestPromise().
        request[method](options, (error, response, body) => {
            if (error) return reject(error);

            resolve(body);
        });
    });
};
