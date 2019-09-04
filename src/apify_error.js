import _ from 'underscore';
import { VError } from 'verror';

export const APIFY_ERROR_NAME = 'ApifyClientError';

export const INVALID_PARAMETER_ERROR_TYPE_V1 = 'INVALID_PARAMETER';
export const INVALID_PARAMETER_ERROR_TYPE_V2 = 'invalid-parameter';
export const REQUEST_FAILED_ERROR_TYPE_V1 = 'REQUEST_FAILED';
export const REQUEST_FAILED_ERROR_TYPE_V2 = 'request-failed';
export const REQUEST_FAILED_ERROR_MESSAGE = 'Server request failed.';
export const NOT_FOUND_STATUS_CODE = 404;

export default class ApifyClientError extends VError {
    constructor(type, message, details, cause) {
        if (cause) super(cause, message);
        else super(message);
        this.name = APIFY_ERROR_NAME;
        this.type = type;
        this.details = details;
        this.stack = VError.fullStack(this);
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
