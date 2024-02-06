import { ACT_JOB_STATUSES, ACT_JOB_TERMINAL_STATUSES } from '@apify/consts';

import { ApiClient } from './api_client';
import { ApifyApiError } from '../apify_api_error';
import { ApifyRequestConfig } from '../http_client';
import {
    pluckData,
    parseDateFields,
    catchNotFoundOrThrow,
} from '../utils';

/**
 * We need to supply some number for the API,
 * because it would not accept "Infinity".
 * 999999 seconds is more than 10 days.
 */
const MAX_WAIT_FOR_FINISH = 999999;

/**
 * Resource client.
 * @private
 */
export class ResourceClient extends ApiClient {
    protected async _get<T, R>(options: T = {} as T): Promise<R | undefined> {
        const requestOpts: ApifyRequestConfig = {
            url: this._url(),
            method: 'GET',
            params: this._params(options),
        };
        try {
            const response = await this.httpClient.call(requestOpts);
            return parseDateFields(pluckData(response.data)) as R;
        } catch (err) {
            catchNotFoundOrThrow(err as ApifyApiError);
        }

        return undefined;
    }

    protected async _update<T, R>(newFields: T): Promise<R> {
        const response = await this.httpClient.call({
            url: this._url(),
            method: 'PUT',
            params: this._params(),
            data: newFields,
        });
        return parseDateFields(pluckData(response.data)) as R;
    }

    protected async _delete(): Promise<void> {
        try {
            await this.httpClient.call({
                url: this._url(),
                method: 'DELETE',
                params: this._params(),
            });
        } catch (err) {
            catchNotFoundOrThrow(err as ApifyApiError);
        }
    }

    /**
     * This function is used in Build and Run endpoints so it's kept
     * here to stay DRY.
     */
    protected async _waitForFinish<
        R extends { status: typeof ACT_JOB_STATUSES[keyof typeof ACT_JOB_STATUSES]; },
    >(options: WaitForFinishOptions = {}): Promise<R> {
        const {
            waitSecs = MAX_WAIT_FOR_FINISH,
        } = options;
        const waitMillis = waitSecs * 1000;
        let job: R | undefined;

        const startedAt = Date.now();
        const shouldRepeat = () => {
            const millisSinceStart = Date.now() - startedAt;
            if (millisSinceStart >= waitMillis) return false;
            const hasJobEnded = job && ACT_JOB_TERMINAL_STATUSES.includes(job.status as typeof ACT_JOB_TERMINAL_STATUSES[number]);
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
            if (!job) await new Promise((resolve) => setTimeout(resolve, 250));
        } while (shouldRepeat());

        if (!job) {
            const constructorName = this.constructor.name;
            const jobName = constructorName.match(/(\w+)Client/)![1].toLowerCase();
            throw new Error(`Waiting for ${jobName} to finish failed. Cannot fetch actor ${jobName} details from the server.`);
        }

        return job;
    }
}

export interface WaitForFinishOptions {
    waitSecs?: number;
}
