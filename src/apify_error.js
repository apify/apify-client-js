import _ from 'underscore';

export const APIFY_ERROR_NAME = 'ApifyClientError';

export const INVALID_PARAMETER_ERROR_TYPE = 'invalid-parameter';
export const REQUEST_FAILED_ERROR_TYPE = 'request-failed';
export const REQUEST_FAILED_ERROR_MESSAGE = 'Server request failed.';
export const NOT_FOUND_STATUS_CODE = 404;

export default class ApifyClientError extends Error {
    constructor(type, message, details) {
        super(message);
        this.name = APIFY_ERROR_NAME;
        this.type = type;
        this.details = details;

        Error.captureStackTrace(this, ApifyClientError);
    }

    toString() {
        let details = '';

        if (this.details) {
            const items = [];
            _.mapObject(this.details, (val, key) => {
                items.push(`${key}=${JSON.stringify(val)}`);
            });
            details = `(${items.join(', ')})`;
        }

        return `[${this.name}] ${APIFY_ERROR_NAME}: ${this.message} ${details}`;
    }
}
