import log from '@apify/log';

import { ApifyApiError } from './apify_api_error.js';
import { sleep } from './utils.js';

/**
 * Error types the API rejects a run start with while the account has no free memory or concurrent-run slot for it.
 * Both clear as other runs or builds finish.
 */
export const RESOURCE_LIMIT_ERROR_TYPES: ReadonlySet<string> = new Set([
    'actor-memory-limit-exceeded',
    'concurrent-runs-limit-exceeded',
]);

/** Cooldown between two attempts to start a run that was rejected for lack of resources. */
export const WAIT_FOR_RESOURCES_COOLDOWN_MILLIS = 10_000;

/**
 * Makes the `start` request, retrying it every {@link WAIT_FOR_RESOURCES_COOLDOWN_MILLIS} while it fails with one of
 * {@link RESOURCE_LIMIT_ERROR_TYPES}. `true` retries until the request succeeds, a number of seconds bounds the
 * retrying, after which the last error is thrown. Any other error is thrown right away.
 * @internal
 */
export async function startWaitingForResources<T>(
    start: () => Promise<T>,
    waitForResources: boolean | number | undefined,
    signal?: AbortSignal,
): Promise<T> {
    if (waitForResources === undefined || waitForResources === false) return start();

    const deadline = waitForResources === true ? Infinity : Date.now() + waitForResources * 1000;
    for (;;) {
        try {
            return await start();
        } catch (err) {
            if (!(err instanceof ApifyApiError) || !RESOURCE_LIMIT_ERROR_TYPES.has(err.type ?? '')) throw err;
            const remainingMillis = deadline - Date.now();
            if (remainingMillis <= 0) throw err;

            const delayMillis = Math.min(WAIT_FOR_RESOURCES_COOLDOWN_MILLIS, remainingMillis);
            log.info(`Not enough resources to start the run (${err.type}), retrying in ${delayMillis / 1000}s.`);
            await sleep(delayMillis, signal);
            signal?.throwIfAborted();
        }
    }
}
