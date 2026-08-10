import { randomInt } from 'node:crypto';

const ID_CHARS = 'abcdefghijklmnopqrstuvwxyzABCEDFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** Generate a random object ID of the same alphabet and shape the API uses. */
export function randomId(length = 17): string {
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

export async function sleep(millis: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, millis));
}

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

export interface CollectOptions {
    maxAttempts?: number;
    intervalSecs?: number;
}

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
    options: CollectOptions = {},
): Promise<T[]> {
    const { maxAttempts = 5, intervalSecs = 1 } = options;
    const expected = new Set(expectedIds);

    const drain = async (): Promise<T[]> => {
        const collected: T[] = [];
        for await (const item of iterableFactory()) {
            collected.push(item);
        }
        return collected;
    };

    let collected = await drain();
    for (let attempt = 1; attempt < maxAttempts; attempt++) {
        const collectedIds = new Set(collected.map((item) => item.id));
        if ([...expected].every((id) => collectedIds.has(id))) break;
        await sleep(intervalSecs * 1000);
        collected = await drain();
    }
    return collected;
}
