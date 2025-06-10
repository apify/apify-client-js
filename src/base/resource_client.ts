import type { ACT_JOB_STATUSES } from '@apify/consts';
import { ACT_JOB_TERMINAL_STATUSES } from '@apify/consts';

import type { ApifyApiError } from '../apify_api_error';
import type { ApifyRequestConfig } from '../http_client';
import { catchNotFoundOrThrow, parseDateFields, pluckData } from '../utils';
import { ApiClient } from './api_client';

/**
 * We need to supply some number for the API,
 * because it would not accept "Infinity".
 * 999999 seconds is more than 10 days.
 */
const MAX_WAIT_FOR_FINISH = 999999;

export const SMALL_TIMEOUT_SECS = 5; // For fast and common actions. Suitable for idempotent actions.
export const MEDIUM_TIMEOUT_SECS = 30; // For actions that may take longer.
export const DEFAULT_TIMEOUT_SECS = 360; // 6 minutes

/**
 * Resource client.
 * @private
 */
export class ResourceClient extends ApiClient {
    protected async _get<T, R>(options: T = {} as T, timeoutSecs?: number): Promise<R | undefined> {
        const requestOpts: ApifyRequestConfig = {
            url: this._url(),
            method: 'GET',
            params: this._params(options),
            timeout: timeoutSecs !== undefined ? timeoutSecs * 1000 : undefined,
        };
        try {
            const response = await this.httpClient.call(requestOpts);
            return parseDateFields(pluckData(response.data)) as R;
        } catch (err) {
            catchNotFoundOrThrow(err as ApifyApiError);
        }

        return undefined;
    }

    protected async _update<T, R>(newFields: T, timeoutSecs?: number): Promise<R> {
        const response = await this.httpClient.call({
            url: this._url(),
            method: 'PUT',
            params: this._params(),
            data: newFields,
            timeout: timeoutSecs !== undefined ? timeoutSecs * 1000 : undefined,
        });
        return parseDateFields(pluckData(response.data)) as R;
    }

    protected async _delete(timeoutSecs?: number): Promise<void> {
        try {
            await this.httpClient.call({
                url: this._url(),
                method: 'DELETE',
                params: this._params(),
                timeout: timeoutSecs !== undefined ? timeoutSecs * 1000 : undefined,
            });
        } catch (err) {
            catchNotFoundOrThrow(err as ApifyApiError);
        }
    }

    /**
     * This function is used in Build and Run endpoints so it's kept
     * here to stay DRY.
     */
    protected async _waitForFinish<R extends { status: (typeof ACT_JOB_STATUSES)[keyof typeof ACT_JOB_STATUSES] }>(
        options: WaitForFinishOptions = {},
    ): Promise<R> {
        const { waitSecs = MAX_WAIT_FOR_FINISH } = options;
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
                url: this._url(),
                method: 'GET',
                params: this._params({ waitForFinish }),
            };
            try {
                const response = await this.httpClient.call(requestOpts);
                job = parseDateFields(pluckData(response.data)) as R;
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

export interface WaitForFinishOptions {
    waitSecs?: number;
}
