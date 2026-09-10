import type { ACT_JOB_STATUSES } from '@apify/consts';
import { ACT_JOB_TERMINAL_STATUSES } from '@apify/consts';
import type { z } from 'zod';

import type { ApifyApiError } from '../apify_api_error.js';
import type { ApifyRequestConfig } from '../http_client.js';
import type { Timeout, TimeoutOptions, TimeoutTier } from '../timeouts.js';
import { catchNotFoundForResourceOrThrow, catchNotFoundOrThrow, parseResponse } from '../utils.js';
import { ApiClient } from './api_client.js';

/**
 * We need to supply some number for the API,
 * because it would not accept "Infinity".
 * 999999 seconds is more than 10 days.
 */
const MAX_WAIT_FOR_FINISH = 999999;

/** The API holds a `waitForFinish` response for at most a minute, however long the parameter asks for. */
const MAX_WAIT_FOR_FINISH_HOLD_SECS = 60;

/**
 * Resource client.
 * @private
 */
export class ResourceClient extends ApiClient {
    /**
     * Picks the timeout of a request that asks the API to hold its response with `waitForFinish`. The request
     * gets the hold the caller asked for plus the round trip its tier allows, so the client does not abort a
     * request while the API is still holding it - which for `start()` and `build()` would retry a call that
     * creates a resource. An explicit per-call `timeout` is used as given.
     */
    protected timeoutForWaitForFinish(
        timeout: Timeout | undefined,
        tier: TimeoutTier,
        waitForFinishSecs: number | undefined,
    ): Timeout {
        if (timeout !== undefined) return timeout;
        if (waitForFinishSecs === undefined) return tier;

        const holdSecs = Math.min(waitForFinishSecs, MAX_WAIT_FOR_FINISH_HOLD_SECS);
        if (holdSecs <= 0) return tier;

        return holdSecs + this.httpClient.timeoutMillis[tier] / 1000;
    }

    /**
     * A 404 resolves to `undefined` only when the client names its resource by ID. A chained client without one, such
     * as `run.dataset()`, throws it instead (see `catchNotFoundForResourceOrThrow()`).
     */
    protected async getResource<T, R>(schema: z.ZodType, options: T, timeout: Timeout): Promise<R | undefined> {
        const requestOpts: ApifyRequestConfig = {
            url: this.buildUrl(),
            method: 'GET',
            params: this.buildParams(options),
            timeout,
        };
        try {
            const response = await this.httpClient.call(requestOpts);
            return parseResponse<R>(response, schema);
        } catch (err) {
            catchNotFoundForResourceOrThrow(err as ApifyApiError, this.id);
        }

        return undefined;
    }

    protected async updateResource<T, R>(schema: z.ZodType, newFields: T, timeout: Timeout): Promise<R> {
        const response = await this.httpClient.call({
            url: this.buildUrl(),
            method: 'PUT',
            params: this.buildParams(),
            data: newFields,
            timeout,
        });
        return parseResponse<R>(response, schema);
    }

    /**
     * A 404 is swallowed, keeping the DELETE idempotent, only when the client names its resource by ID. A chained client
     * without one throws it instead (see `catchNotFoundForResourceOrThrow()`).
     */
    protected async deleteResource(timeout: Timeout): Promise<void> {
        try {
            await this.httpClient.call({
                url: this.buildUrl(),
                method: 'DELETE',
                params: this.buildParams(),
                timeout,
            });
        } catch (err) {
            catchNotFoundForResourceOrThrow(err as ApifyApiError, this.id);
        }
    }

    /**
     * This function is used in Build and Run endpoints so it's kept
     * here to stay DRY.
     */
    protected async waitForJobFinish<R extends { status: (typeof ACT_JOB_STATUSES)[keyof typeof ACT_JOB_STATUSES] }>(
        schema: z.ZodType,
        options: WaitForFinishOptions = {},
    ): Promise<R> {
        const { waitSecs = MAX_WAIT_FOR_FINISH, timeout = 'noTimeout' } = options;
        const waitMillis = waitSecs * 1000;
        let job: R | undefined;

        const startedAt = Date.now();
        const shouldRepeat = () => {
            const millisSinceStart = Date.now() - startedAt;
            if (millisSinceStart >= waitMillis) return false;
            const hasJobEnded =
                job && ACT_JOB_TERMINAL_STATUSES.includes(job.status as (typeof ACT_JOB_TERMINAL_STATUSES)[number]);
            return !hasJobEnded;
        };

        do {
            const millisSinceStart = Date.now() - startedAt;
            const remainingWaitSeconds = Math.round((waitMillis - millisSinceStart) / 1000);
            const waitForFinish = Math.max(0, remainingWaitSeconds);

            const requestOpts: ApifyRequestConfig = {
                url: this.buildUrl(),
                method: 'GET',
                params: this.buildParams({ waitForFinish }),
                timeout,
            };
            try {
                const response = await this.httpClient.call(requestOpts);
                job = parseResponse<R>(response, schema);
            } catch (err) {
                catchNotFoundOrThrow(err as ApifyApiError);
                job = undefined;
            }

            // It might take some time for database replicas to get up-to-date,
            // so getRun() might return null. Wait a little bit and try it again.
            if (!job)
                await new Promise((resolve) => {
                    setTimeout(resolve, 250);
                });
        } while (shouldRepeat());

        if (!job) {
            const constructorName = this.constructor.name;
            const jobName = constructorName.match(/(\w+)Client/)![1].toLowerCase();
            throw new Error(
                `Waiting for ${jobName} to finish failed. Cannot fetch actor ${jobName} details from the server.`,
            );
        }

        return job;
    }
}

export interface WaitForFinishOptions extends TimeoutOptions {
    waitSecs?: number;
}
