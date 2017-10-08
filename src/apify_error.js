export const APIFY_ERROR_NAME = 'ApifyError';

export const INVALID_PARAMETER_ERROR_TYPE_V1 = 'INVALID_PARAMETER';
export const INVALID_PARAMETER_ERROR_TYPE_V2 = 'indalid-parameter';
export const REQUEST_FAILED_ERROR_TYPE_V1 = 'REQUEST_FAILED';
export const REQUEST_FAILED_ERROR_TYPE_V2 = 'request-failed';
export const REQUEST_FAILED_ERROR_MESSAGE = 'Server request failed.';
export const NOT_FOUND_STATUS_CODE = 404;

export default class ApifyError extends Error {
    constructor(type, message, details) {
        super(message);
        this.name = APIFY_ERROR_NAME;
        this.type = type;
        this.details = details;

        Error.captureStackTrace(this, ApifyError);
    }
}
