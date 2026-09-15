import type { HttpResponse } from './http_clients/base.js';

/**
 * Thrown when a response body does not parse as its content type claims, typically a JSON document cut short by a
 * connection dropped mid-response. The client retries such requests, so the error surfaces once the retries are
 * exhausted.
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
