import { describe, expect, test } from 'vitest';
import { z } from 'zod';

import { ArgumentValidationError } from '../src/argument_validation_error';

describe('ArgumentValidationError', () => {
    const schema = z
        .object({
            countryCode: z.string().regex(/^[A-Z]{2}$/),
            retries: z.number().optional(),
        })
        .strict();

    test('message names the offending field and the value it received', () => {
        const value = { countryCode: 'CZE' };
        const error = new ArgumentValidationError(schema.safeParse(value).error!, value);

        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('ArgumentValidationError');
        // The leading sentence comes from zod and differs between its majors, the location and the
        // received value are what this formatter adds.
        expect(error.message).toContain('at `countryCode`, got `CZE`');
    });

    test('exposes structured issues and keeps the ZodError as cause', () => {
        const value = { retries: 'lots' };
        const zodError = schema.safeParse(value).error!;
        const error = new ArgumentValidationError(zodError, value);

        // `issues` is reachable directly, without digging into `cause`.
        expect(error.issues).toBe(zodError.issues);
        expect(error.issues.map((issue) => issue.path)).toContainEqual(['retries']);
        expect(error.cause).toBe(zodError);
    });
});
