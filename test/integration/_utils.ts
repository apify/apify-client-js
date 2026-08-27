import { randomInt } from 'node:crypto';

const ID_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** Generate a random ID of `length` characters, drawn from the alphabet the API uses for object IDs. */
export function randomId(length: number): string {
    let id = '';
    for (let i = 0; i < length; i++) {
        id += ID_CHARS[randomInt(ID_CHARS.length)];
    }
    return id;
}

const NAME_PREFIX = 'js-client-test';
const API_NAME_LIMIT = 63;
const RANDOM_ID_LENGTH = 8;
const LABEL_LENGTH_LIMIT = API_NAME_LIMIT - `${NAME_PREFIX}--`.length - RANDOM_ID_LENGTH;

/**
 * Generate a unique resource name containing the given label.
 *
 * Keeps the result within the API limit of 63 characters, so callers can pass a descriptive label
 * without having to count.
 */
export function getRandomResourceName(label: string): string {
    const normalized = label.replaceAll('_', '-');
    if (normalized.length > LABEL_LENGTH_LIMIT) {
        throw new Error(`Max label length is ${LABEL_LENGTH_LIMIT}, but got ${normalized.length}`);
    }
    return `${NAME_PREFIX}-${normalized}-${randomId(RANDOM_ID_LENGTH)}`;
}

async function sleep(millis: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, millis));
}

/**
 * Every status a run may legitimately report right after it was started.
 *
 * Assert against this set - rather than a single status - whenever the test does not control the
 * outcome of the run. Under load the platform can move a run through to a terminal state before the
 * `start()` response is even read, and it can legitimately fail or be aborted without that meaning
 * the client is broken. Narrow assertions belong only where the test does control the outcome, such
 * as after `waitForFinish()` or `call()`.
 */
export const ANY_RUN_STATUS = [
    'READY',
    'RUNNING',
    'SUCCEEDED',
    'TIMED-OUT',
    'TIMING-OUT',
    'FAILED',
    'ABORTING',
    'ABORTED',
] as const;

/**
 * Options that turn off the log redirection `call()` performs by default.
 *
 * `ActorClient.call()` streams the run log to stdout unless `log` is `null`, which costs two extra
 * API requests per call and floods the CI output. Pass this wherever the redirected log is not what
 * the test is checking.
 */
export const NO_LOG_REDIRECT = { log: null } as const;

export interface PollOptions {
    /** Total seconds to keep polling before giving up. */
    timeoutSecs?: number;
    /** Seconds to wait between polls. */
    pollIntervalSecs?: number;
    /** Multiplies the interval after each poll, to cover a long timeout with few calls. */
    backoffFactor?: number;
}

/**
 * Poll `fn` until `condition(result)` holds or the timeout expires.
 *
 * Returns the last polled result either way, so the caller runs its own assertion and gets a useful
 * failure message. Use this instead of a fixed sleep when waiting for eventually-consistent state,
 * such as a freshly created resource appearing in a listing. For waits whose length varies by orders
 * of magnitude, such as an Actor run container starting up, pass a `backoffFactor` above 1.
 */
export async function pollUntilCondition<T>(
    fn: () => Promise<T>,
    condition: (value: T) => boolean = (value) => Boolean(value),
    options: PollOptions = {},
): Promise<T> {
    const { timeoutSecs = 30, pollIntervalSecs = 1, backoffFactor = 1 } = options;
    const deadline = Date.now() + timeoutSecs * 1000;
    let delayMillis = pollIntervalSecs * 1000;

    let result = await fn();
    while (!condition(result)) {
        const remaining = deadline - Date.now();
        if (remaining <= 0) break;
        await sleep(Math.min(delayMillis, remaining));
        delayMillis *= backoffFactor;
        result = await fn();
    }
    return result;
}

const COLLECT_MAX_ATTEMPTS = 5;
const COLLECT_INTERVAL_SECS = 1;

/**
 * Drain an async-iterable listing until every expected ID is present.
 *
 * Handles eventual consistency on listing endpoints: under parallel load a freshly created resource
 * may be missing from the listing for a short window. Each attempt builds a fresh iterable via
 * `iterableFactory` and drains it, stopping early once all `expectedIds` are found. The most recent
 * collection is returned regardless, so the caller can assert with a helpful message.
 *
 * Loops on attempt count rather than a wall-clock deadline: drains take HTTP time, and charging that
 * against a deadline would mean fewer retries under load - exactly when they are needed most.
 */
export async function collectUntilPresent<T extends { id: string }>(
    iterableFactory: () => AsyncIterable<T>,
    expectedIds: Iterable<string>,
): Promise<T[]> {
    const expected = [...expectedIds];

    const drain = async (): Promise<T[]> => {
        const collected: T[] = [];
        for await (const item of iterableFactory()) {
            collected.push(item);
        }
        return collected;
    };

    let collected = await drain();
    for (let attempt = 1; attempt < COLLECT_MAX_ATTEMPTS; attempt++) {
        const collectedIds = new Set(collected.map((item) => item.id));
        if (expected.every((id) => collectedIds.has(id))) break;
        await sleep(COLLECT_INTERVAL_SECS * 1000);
        collected = await drain();
    }
    return collected;
}
