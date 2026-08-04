import type { z } from 'zod';

/** Formats a zod issue path like `groups[0]` or `countryCode`. */
function formatIssuePath(path: readonly PropertyKey[]): string {
    let out = '';
    for (const key of path) {
        if (typeof key === 'number') out += `[${key}]`;
        else out += out ? `.${String(key)}` : String(key);
    }
    return out;
}

/** Reads the value at `path` from the validated input, to include in the error. */
function valueAtPath(root: unknown, path: readonly PropertyKey[]): unknown {
    let current = root;
    for (const key of path) {
        if (current === null || typeof current !== 'object') return undefined;
        current = (current as Record<PropertyKey, unknown>)[key];
    }
    return current;
}

/** Renders a primitive received value for an error; skips objects/Dates (noisy). */
function describeReceived(value: unknown): string | undefined {
    switch (typeof value) {
        case 'string':
            // An empty string would render as bare backticks - make it visible.
            return value === '' ? "''" : value;
        case 'number':
        case 'boolean':
        case 'bigint':
            return String(value);
        default:
            return undefined;
    }
}

/**
 * Renders the issue's own sentence, except where zod's contradicts itself: a value of the expected type
 * that fails that type's implicit constraint is still reported as the wrong *type*, giving "expected
 * number, received number" for `Infinity` / `NaN` and "expected date, received Date" for an invalid
 * `Date`. Name the constraint that actually failed instead.
 */
function describeIssue(issue: z.ZodError['issues'][number], value: unknown): string {
    if (issue.code === 'invalid_type') {
        if (issue.expected === 'number' && typeof value === 'number') {
            return 'Invalid input: expected a finite number';
        }
        // A tag check, not `instanceof`, so a `Date` from another realm is named too.
        if (issue.expected === 'date' && Object.prototype.toString.call(value) === '[object Date]') {
            return 'Invalid input: expected a valid date';
        }
    }
    return issue.message;
}

/** Renders one issue as a line each; a union expands into a line per failed arm. */
function formatIssue(issue: z.ZodError['issues'][number], root: unknown, basePath: readonly PropertyKey[]): string[] {
    const path = [...basePath, ...issue.path];
    // A union's own message is a bare "Invalid input" - the useful part is in `errors`,
    // whose paths are relative to the union, hence passing `path` down as the base.
    if (issue.code === 'invalid_union') {
        return issue.errors.flatMap((arm) => arm.flatMap((nested) => formatIssue(nested, root, path)));
    }

    const location = path.length ? ` at \`${formatIssuePath(path)}\`` : '';
    const value = valueAtPath(root, path);
    const received = describeReceived(value);
    const got = received === undefined ? '' : `, got \`${received}\``;
    return [`${describeIssue(issue, value)}${location}${got}`];
}

/**
 * Formats a `ZodError` as a plain, human-readable message that names the
 * offending field *and* the value it received (e.g. ``must match pattern
 * /^[A-Z]{2}$/ at `countryCode`, got `CZE` ``) - closer to the old `ow` errors
 * than zod's default, which omits the received value.
 */
function formatZodError(error: z.ZodError, root: unknown): string {
    return error.issues.flatMap((issue) => formatIssue(issue, root, [])).join('\n');
}

/**
 * Thrown when an argument fails schema validation.
 *
 * Its `message` is a human-readable sentence naming the offending field and the
 * value it received (rather than a raw JSON dump). The structured
 * {@link https://zod.dev | zod} issues are available on `issues`, and the
 * original `ZodError` on `cause`, for programmatic inspection.
 *
 * This class is intentionally kept in sync with the identical copies in
 * `@crawlee/core` and the Apify SDK - `apify-client` sits below both in the
 * dependency graph, so it cannot import theirs.
 */
export class ArgumentValidationError extends Error {
    /** Structured issues from the underlying schema check. */
    readonly issues: z.ZodError['issues'];

    constructor(error: z.ZodError, value: unknown) {
        super(formatZodError(error, value), { cause: error });
        this.name = 'ArgumentValidationError';
        this.issues = error.issues;
    }
}
