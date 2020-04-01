const mapValues = require('lodash/mapValues');
const { VError } = require('verror');

const APIFY_ERROR_NAME = 'ApifyClientError';

exports.APIFY_ERROR_NAME = APIFY_ERROR_NAME;
exports.INVALID_PARAMETER_ERROR_TYPE = 'invalid-parameter';
exports.REQUEST_FAILED_ERROR_TYPE = 'request-failed';
exports.REQUEST_FAILED_ERROR_MESSAGE = 'Server request failed.';
exports.NOT_FOUND_STATUS_CODE = 404;

class ApifyClientError extends VError {
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
            mapValues(this.details, (val, key) => {
                items.push(`${key}=${JSON.stringify(val)}`);
            });
            details = `(${items.join(', ')})`;
        }

        return `[${this.name}] ${APIFY_ERROR_NAME}: ${this.message} ${details}`;
    }
}

exports.ApifyClientError = ApifyClientError;
