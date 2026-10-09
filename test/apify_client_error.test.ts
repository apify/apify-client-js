import type { ApifyResponse } from 'apify-client';
import {
    ApifyApiError,
    ApifyClientError,
    ArgumentValidationError,
    ConflictError,
    ForbiddenError,
    InvalidRequestError,
    InvalidResponseBodyError,
    NotFoundError,
    RateLimitError,
    ResponseValidationError,
    ServerError,
    UnauthorizedError,
} from 'apify-client';
import { describe, expect, test } from 'vitest';
import { z } from 'zod';

function apiErrorResponse(status: number): ApifyResponse {
    return {
        status,
        headers: {},
        data: { error: { type: 'some-type', message: 'Something went wrong' } },
        config: { url: 'https://api.apify.com/v2/acts', method: 'GET' },
    };
}

describe('ApifyClientError', () => {
    test.each([
        { status: 400, ErrorClass: InvalidRequestError },
        { status: 401, ErrorClass: UnauthorizedError },
        { status: 403, ErrorClass: ForbiddenError },
        { status: 404, ErrorClass: NotFoundError },
        { status: 409, ErrorClass: ConflictError },
        { status: 429, ErrorClass: RateLimitError },
        { status: 500, ErrorClass: ServerError },
        { status: 418, ErrorClass: ApifyApiError },
    ])('the $ErrorClass.name thrown for HTTP $status is an ApifyClientError', ({ status, ErrorClass }) => {
        const error = ApifyApiError.fromResponse(apiErrorResponse(status), 1);

        expect(error.constructor).toBe(ErrorClass);
        expect(error).toBeInstanceOf(ApifyApiError);
        expect(error).toBeInstanceOf(ApifyClientError);
        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe(ErrorClass.name);
        expect(error.message).toBe('Something went wrong');
    });

    test('InvalidResponseBodyError is an ApifyClientError', () => {
        const cause = new SyntaxError('Unexpected end of JSON input');
        const error = new InvalidResponseBodyError({ status: 200, headers: {}, body: new Uint8Array() }, cause);

        expect(error).toBeInstanceOf(ApifyClientError);
        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('InvalidResponseBodyError');
        expect(error.cause).toBe(cause);
    });

    test('ResponseValidationError is an ApifyClientError', () => {
        const value = { id: 42 };
        const zodError = z.object({ id: z.string() }).safeParse(value).error!;
        const error = new ResponseValidationError(zodError, value, { method: 'GET', url: 'https://example.com' });

        expect(error).toBeInstanceOf(ApifyClientError);
        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('ResponseValidationError');
        expect(error.cause).toBe(zodError);
    });

    test('ArgumentValidationError stays outside the hierarchy', () => {
        const value = { limit: 'ten' };
        const error = new ArgumentValidationError(z.object({ limit: z.number() }).safeParse(value).error!, value);

        expect(error).not.toBeInstanceOf(ApifyClientError);
    });

    test('adds no own properties to the errors that extend it', () => {
        expect(Object.keys(new ApifyClientError('message'))).toEqual([]);
    });
});
