import { describe, expect, test } from 'vitest';
import { z } from 'zod';

import { ArgumentValidationError } from '../src/argument_validation_error';

describe('ArgumentValidationError', () => {
    const schema = z.strictObject({
        countryCode: z.string().regex(/^[A-Z]{2}$/),
        retries: z.number().optional(),
    });

    test('message names the offending field and the value it received', () => {
        const value = { countryCode: 'CZE' };
        const error = new ArgumentValidationError(schema.safeParse(value).error!, value);

        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('ArgumentValidationError');
        // Only assert on the location and value, since zod owns the leading sentence.
        expect(error.message).toContain('at `countryCode`, got `CZE`');
    });

    test('message renders an empty string visibly', () => {
        const idSchema = z.string().min(1);
        const error = new ArgumentValidationError(idSchema.safeParse('').error!, '');

        expect(error.message).toContain("got `''`");
    });

    test.each([
        { name: 'Infinity', value: Infinity },
        { name: 'NaN', value: Number.NaN },
    ])('message names the finiteness constraint for $name', ({ value }) => {
        const numberSchema = z.strictObject({ timeoutSecs: z.number() });
        const input = { timeoutSecs: value };
        const error = new ArgumentValidationError(numberSchema.safeParse(input).error!, input);

        // Zod's own sentence for these is the self-contradictory "expected number, received number".
        expect(error.message).toBe(`Invalid input: expected a finite number at \`timeoutSecs\`, got \`${value}\``);
    });

    test('message names the validity constraint for an invalid Date', () => {
        const dateSchema = z.strictObject({ startedBefore: z.date() });
        const input = { startedBefore: new Date('nonsense') };
        const error = new ArgumentValidationError(dateSchema.safeParse(input).error!, input);

        // Zod's own sentence for this one is the self-contradictory "expected date, received Date".
        expect(error.message).toBe('Invalid input: expected a valid date at `startedBefore`');
    });

    test('message points at the offending array element', () => {
        const arraySchema = z.object({ groups: z.array(z.object({ name: z.string() })) });
        const value = { groups: [{ name: 'ok' }, { name: 7 }] };
        const error = new ArgumentValidationError(arraySchema.safeParse(value).error!, value);

        expect(error.message).toContain('at `groups[1].name`, got `7`');
    });

    test('message lists every failed arm of a union', () => {
        const unionSchema = z.array(z.union([z.looseObject({}), z.string()]));
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
