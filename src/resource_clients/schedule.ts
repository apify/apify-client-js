import { z } from 'zod';

import type { ApifyApiError } from '../apify_api_error';
import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import type { ApifyRequestConfig } from '../http_client';
import type { Schedule, ScheduleAction, ScheduleInvoked } from '../models';
import type { DistributiveOptional } from '../utils';
import * as schemas from '../schemas';
import { anyObjectSchema, catchNotFoundOrThrow, parseArgument, parseResponse } from '../utils';

export type {
    Schedule,
    ScheduleAction,
    ScheduleActionRunActor,
    ScheduleActionRunActorTask,
    ScheduledActorRunInput,
    ScheduledActorRunOptions,
    ScheduleInvoked,
} from '../models';
export { ScheduleActions } from '../models';

const scheduleLogSchema = z.array(schemas.ScheduleInvoked);

/**
 * Client for managing a specific Schedule.
 *
 * Schedules are used to automatically start Actors or tasks at specified times. This client provides
 * methods to get, update, and delete schedules, as well as retrieve schedule logs.
 *
 * @example
 * ```javascript
 * const client = new ApifyClient({ token: 'my-token' });
 * const scheduleClient = client.schedule('my-schedule-id');
 *
 * // Get schedule details
 * const schedule = await scheduleClient.get();
 *
 * // Update schedule
 * await scheduleClient.update({
 *   cronExpression: '0 12 * * *',
 *   isEnabled: true
 * });
 * ```
 *
 * @see https://docs.apify.com/platform/schedules
 */
export class ScheduleClient extends ResourceClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'schedules',
            ...options,
        });
    }

    /**
     * Retrieves the schedule.
     *
     * @returns The schedule object, or `undefined` if it does not exist.
     * @see https://docs.apify.com/api/v2/schedule-get
     */
    async get(): Promise<Schedule | undefined> {
        return this._get(schemas.Schedule);
    }

    /**
     * Updates the schedule with the specified fields.
     *
     * @param newFields - Fields to update.
     * @returns The updated schedule object.
     * @see https://docs.apify.com/api/v2/schedule-put
     */
    async update(newFields: ScheduleCreateOrUpdateData): Promise<Schedule> {
        parseArgument(newFields, anyObjectSchema);
        return this._update(schemas.Schedule, newFields);
    }

    /**
     * Deletes the schedule.
     *
     * @see https://docs.apify.com/api/v2/schedule-delete
     */
    async delete(): Promise<void> {
        return this._delete();
    }

    /**
     * Retrieves the schedule's log.
     *
     * @returns The schedule log, one entry per invocation, or `undefined` if the schedule does not exist.
     * @see https://docs.apify.com/api/v2/schedule-log-get
     */
    async getLog(): Promise<ScheduleInvoked[] | undefined> {
        const requestOpts: ApifyRequestConfig = {
            url: this._url('log'),
            method: 'GET',
            params: this._params(),
        };
        try {
            const response = await this.httpClient.call(requestOpts);
            return parseResponse(response, scheduleLogSchema);
        } catch (err) {
            catchNotFoundOrThrow(err as ApifyApiError);
        }

        return undefined;
    }
}

/**
 * Data for creating or updating a Schedule.
 * @since Added in 2.6.2
 */
export type ScheduleCreateOrUpdateData = Partial<
    Pick<
        Schedule,
        'name' | 'title' | 'cronExpression' | 'timezone' | 'isEnabled' | 'isExclusive' | 'description' | 'notifications'
    > & {
        actions: DistributiveOptional<ScheduleAction, 'id'>[];
    }
>;
