import type { HttpResponse } from './http_clients/base.js';

/**
 * Thrown when the body of a successful response does not parse as its content type claims, for example a non-JSON
 * value stored under `application/json`. The response arrived in full, so the request is not retried. An error
 * status with an unparsable body throws {@link ApifyApiError} for its status code.
 */
export class InvalidResponseBodyError extends Error {
    code: string;

    /** The response whose body did not parse, with the body as the transport returned it. */
    response: HttpResponse;

    declare cause: Error;

    constructor(response: HttpResponse, cause: Error) {
        super(`Response body could not be parsed.\nCause:${cause.message}`);
        this.name = this.constructor.name;
        this.code = 'invalid-response-body';
        this.response = response;
        this.cause = cause;
    }
}
