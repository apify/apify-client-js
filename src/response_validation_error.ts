import type { z } from 'zod';

import { formatZodError } from './argument_validation_error.js';

/**
 * Thrown when an API response does not match the schema the client expects for it.
 *
 * The schemas are generated from the Apify OpenAPI specification, so this error means the API returned
 * something the specification does not describe -- a missing required field, a different type, a value
 * outside the documented range. Unknown fields and unknown enum values are not errors: the schemas let
 * both through, so the client keeps working when the API grows.
 *
 * The `message` names the request and every offending field with the value it received. The structured
 * {@link https://zod.dev | zod} issues are available on `issues`, and the original `ZodError` on `cause`,
 * for programmatic inspection.
 */
export class ResponseValidationError extends Error {
    /** Structured issues from the underlying schema check. */
    readonly issues: z.ZodError['issues'];

    /** HTTP method of the request whose response failed validation, upper-cased. */
    readonly method: string;

    /** URL of the request whose response failed validation, without its query string. */
    readonly url: string;

    constructor(error: z.ZodError, value: unknown, request: { method: string; url: string }) {
        const method = request.method.toUpperCase();
        super(
            `Response from ${method} ${request.url} does not match the API schema:\n${formatZodError(error, value)}`,
            {
                cause: error,
            },
        );
        this.name = 'ResponseValidationError';
        this.issues = error.issues;
        this.method = method;
        this.url = request.url;
    }
}
