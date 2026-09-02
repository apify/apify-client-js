import { describe, expect, test } from 'vitest';
import { z } from 'zod';

import { ArgumentValidationError } from '../src/argument_validation_error.js';

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

    test('message truncates an oversized received string', () => {
        const value = 'x'.repeat(5000);
        const error = new ArgumentValidationError(z.looseObject({}).safeParse(value).error!, value);

        expect(error.message).toContain(`got \`${'x'.repeat(80)}...\``);
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

    // Shaped like `pushItemsSchema`: a value, or an array of those values.
    const nestedUnionSchema = z.union([
        z.looseObject({}),
        z.string(),
        z.array(z.union([z.looseObject({}), z.string()])),
    ]);

    test('message drops the union arms that failed above the located problem', () => {
        const value = [{ foo: 'bar' }, [1, 2, 3]];
        const error = new ArgumentValidationError(nestedUnionSchema.safeParse(value).error!, value);
        const lines = error.message.split('\n');

        // The object and string arms fail on the whole array, so their lines carry no location.
        expect(lines).toHaveLength(2);
        expect(lines.every((line) => line.endsWith('at `[1]`'))).toBe(true);
    });

    test('message keeps every union arm when they all fail at the same depth', () => {
        const error = new ArgumentValidationError(nestedUnionSchema.safeParse(42).error!, 42);
        const lines = error.message.split('\n');

        // Nothing located the problem more precisely than the argument itself, so no arm is redundant.
        expect(lines).toHaveLength(3);
        expect(lines.every((line) => line.endsWith('got `42`'))).toBe(true);
    });

    test('message appends the label naming the validated interface to every line', () => {
        const value = { countryCode: 'CZE', retries: 'lots' };
        const error = new ArgumentValidationError(schema.safeParse(value).error!, value, 'MyOptions');
        const lines = error.message.split('\n');

        expect(lines).toHaveLength(2);
        expect(lines.every((line) => line.endsWith(' in `MyOptions`'))).toBe(true);
    });

    test('message renders a bigint with its suffix', () => {
        const value = { retries: 1n };
        const error = new ArgumentValidationError(schema.safeParse(value).error!, value);

        expect(error.message).toContain('at `retries`, got `1n`');
    });

    test('message caps the rendered lines when a whole array is invalid', () => {
        const arraySchema = z.array(z.union([z.looseObject({}), z.string()]));
        const value = Array.from({ length: 5000 }, () => 1);
        const error = new ArgumentValidationError(arraySchema.safeParse(value).error!, value);
        const lines = error.message.split('\n');

        expect(lines).toHaveLength(11);
        expect(lines.at(-1)).toBe('... and 9990 more problems');
        // Nothing is lost - the full set stays on `issues`.
        expect(error.issues).toHaveLength(5000);
    });

    test('message does not count the dropped union arms in the hidden tally', () => {
        const value = Array.from({ length: 5000 }, () => [1]);
        const error = new ArgumentValidationError(nestedUnionSchema.safeParse(value).error!, value);
        const lines = error.message.split('\n');

        // Two arms per element, and the two top-level arms are dropped rather than merely hidden.
        expect(lines).toHaveLength(11);
        expect(lines.at(-1)).toBe('... and 9990 more problems');
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
