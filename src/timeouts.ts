import { z } from 'zod';

/** Default duration of the `short` timeout tier, in seconds. */
export const DEFAULT_TIMEOUT_SHORT_SECS = 5;

/** Default duration of the `medium` timeout tier, in seconds. */
export const DEFAULT_TIMEOUT_MEDIUM_SECS = 30;

/** Default duration of the `long` timeout tier, in seconds. */
export const DEFAULT_TIMEOUT_LONG_SECS = 360;

/** Default cap on the timeout of a single request attempt, in seconds. */
export const DEFAULT_TIMEOUT_MAX_SECS = 360;

/**
 * Preconfigured timeout tiers. Every client method picks the tier that fits the expected duration of its
 * request: `short` for simple metadata reads and writes, `medium` for listing, batch and trigger operations,
 * `long` for downloads, uploads and streaming. The duration of each tier is set on the {@link ApifyClient}
 * constructor.
 */
export type TimeoutTier = 'short' | 'medium' | 'long';

/**
 * Timeout of a single API request.
 *
 * A tier name picks the duration configured for that tier on the {@link ApifyClient} constructor, a number is
 * an exact duration in seconds, and `'noTimeout'` lets the request run for as long as it takes. A tier or an
 * explicit duration above `timeoutMaxSecs` is capped at it, and the client logs a warning when that happens.
 * The timeout applies to each attempt separately, and doubles with every retry up to the same cap.
 */
export type Timeout = TimeoutTier | 'noTimeout' | number;

/**
 * Options shared by every method that sends a request to the API.
 */
export interface TimeoutOptions {
    /**
     * Timeout for the API request: a tier name (`'short'`, `'medium'`, `'long'`), a number of seconds, or
     * `'noTimeout'`. Defaults to the tier the method is assigned, which its documentation names.
     */
    timeout?: Timeout;
}

/**
 * Schema of {@link Timeout}. Zero is rejected on purpose - `'noTimeout'` is the explicit way to run without one.
 * @internal
 */
export const timeoutSchema = z.union([z.enum(['short', 'medium', 'long', 'noTimeout']), z.number().positive()]);

/**
 * Schema shape of {@link TimeoutOptions}, to spread into the option schema of every method that sends a
 * request. One copy stops it drifting from the interface.
 * @internal
 */
export const timeoutOptionsShape = {
    timeout: timeoutSchema.optional(),
};

/**
 * Schema of {@link TimeoutOptions}, for the methods that take no other option.
 * @internal
 */
export const timeoutOptionsSchema = z.strictObject(timeoutOptionsShape);
