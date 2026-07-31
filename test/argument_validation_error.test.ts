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
        // Only assert on the location and value, since zod owns the leading sentence.
        expect(error.message).toContain('at `countryCode`, got `CZE`');
    });

    test('message points at the offending array element', () => {
        const arraySchema = z.object({ groups: z.array(z.object({ name: z.string() })) });
        const value = { groups: [{ name: 'ok' }, { name: 7 }] };
        const error = new ArgumentValidationError(arraySchema.safeParse(value).error!, value);

        expect(error.message).toContain('at `groups[1].name`, got `7`');
    });

    test('message lists every failed arm of a union', () => {
        const unionSchema = z.array(z.union([z.object({}).passthrough(), z.string()]));
        const value = [1];
        const error = new ArgumentValidationError(unionSchema.safeParse(value).error!, value);

        expect(error.message).toContain('expected object, received number at `[0]`, got `1`');
        expect(error.message).toContain('expected string, received number at `[0]`, got `1`');
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
