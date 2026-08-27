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

/**
 * How much of a received string the message renders. A rejected argument can be arbitrarily large - a
 * whole JSON payload passed where an object was expected - and its full text would swamp the message.
 */
const MAX_RECEIVED_STRING_LENGTH = 80;

/** Renders a primitive received value for an error; skips objects/Dates (noisy). */
function describeReceived(value: unknown): string | undefined {
    switch (typeof value) {
        case 'string':
            // An empty string would render as bare backticks - make it visible.
            if (value === '') return "''";
            return value.length > MAX_RECEIVED_STRING_LENGTH
                ? `${value.slice(0, MAX_RECEIVED_STRING_LENGTH)}...`
                : value;
        case 'number':
        case 'boolean':
            return String(value);
        case 'bigint':
            // Keep the `n` suffix, so a rejected bigint is not mistaken for a number.
            return `${value}n`;
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

/**
 * How many issue lines the message renders, before a closing "... and N more" line. Validating a
 * large array - a dataset push, a request batch - can fail on every element, and rendering all of
 * them would make the message megabytes long. The full set stays on `issues` either way.
 */
const MAX_RENDERED_LINES = 10;

/**
 * How deep into the value the lines for `issue` would sit, as a path length. Computed without
 * rendering anything, so a union can weigh its arms before any string is built.
 */
function deepestIssueDepth(issue: z.ZodError['issues'][number], baseDepth: number): number {
    const depth = baseDepth + issue.path.length;
    if (issue.code === 'invalid_union') {
        let deepest = -1;
        for (const arm of issue.errors) {
            for (const nested of arm) deepest = Math.max(deepest, deepestIssueDepth(nested, depth));
        }
        return deepest;
    }
    return depth;
}

/** Collects one line per issue into `lines`; a union expands into a line per deepest-failing arm. */
function collectIssueLines(
    issue: z.ZodError['issues'][number],
    root: unknown,
    basePath: readonly PropertyKey[],
    lines: string[],
    counter: { total: number },
): void {
    const path = [...basePath, ...issue.path];
    // A union's own message is a bare "Invalid input" - the useful part is in `errors`,
    // whose paths are relative to the union, hence passing `path` down as the base.
    if (issue.code === 'invalid_union') {
        // Only the arms that reached deepest are reported. An arm that failed nearer the root rejected a
        // shape the value never had - for `[{ ok: 1 }, 2]` against `object | string | array`, the object
        // and string arms fail on the whole array, and only the array arm can point at `[1]`. When every
        // arm fails at the same depth, as for an argument of an outright wrong type, they are all kept.
        const armDepths = issue.errors.map((arm) =>
            arm.reduce((deepest, nested) => Math.max(deepest, deepestIssueDepth(nested, path.length)), -1),
        );
        const deepest = Math.max(...armDepths);
        for (const [index, arm] of issue.errors.entries()) {
            if (armDepths[index] !== deepest) continue;
            for (const nested of arm) collectIssueLines(nested, root, path, lines, counter);
        }
        return;
    }

    counter.total += 1;
    if (lines.length >= MAX_RENDERED_LINES) return;

    const location = path.length ? ` at \`${formatIssuePath(path)}\`` : '';
    const value = valueAtPath(root, path);
    const received = describeReceived(value);
    const got = received === undefined ? '' : `, got \`${received}\``;
    lines.push(`${describeIssue(issue, value)}${location}${got}`);
}

/**
 * Formats a `ZodError` as a plain, human-readable message that names the
 * offending field *and* the value it received (e.g. ``must match pattern
 * /^[A-Z]{2}$/ at `countryCode`, got `CZE` ``) - closer to the old `ow` errors
 * than zod's default, which omits the received value.
 * @internal
 */
export function formatZodError(error: z.ZodError, root: unknown, label?: string): string {
    const lines: string[] = [];
    const counter = { total: 0 };
    for (const issue of error.issues) collectIssueLines(issue, root, [], lines, counter);

    // The label names the validated interface, the way ow's errors ended with "in object `X`".
    const rendered = label ? lines.map((line) => `${line} in \`${label}\``) : [...lines];
    const hidden = counter.total - lines.length;
    if (hidden > 0) rendered.push(`... and ${hidden} more problem${hidden === 1 ? '' : 's'}`);
    return rendered.join('\n');
}

/**
 * Thrown when an argument fails schema validation.
 *
 * Its `message` is a human-readable sentence naming the offending field and the
 * value it received (rather than a raw JSON dump). The structured
 * {@link https://zod.dev | zod} issues are available on `issues`, and the
 * original `ZodError` on `cause`, for programmatic inspection.
 *
 * `apify-client` sits below `@crawlee/core` and the Apify SDK in the dependency
 * graph, so it defines its own error type rather than importing one from them.
 */
export class ArgumentValidationError extends Error {
    /** Structured issues from the underlying schema check. */
    readonly issues: z.ZodError['issues'];

    constructor(error: z.ZodError, value: unknown, label?: string) {
        super(formatZodError(error, value, label), { cause: error });
        this.name = 'ArgumentValidationError';
        this.issues = error.issues;
    }
}
