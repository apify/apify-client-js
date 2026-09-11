import { z } from 'zod';

import type { ApiClientSubResourceOptions } from '../base/api_client.js';
import { ResourceClient } from '../base/resource_client.js';
import type { Schedule, ScheduleAction, ScheduleInvoked } from '../models.js';
import type { DistributiveOptional } from '../utils.js';
import * as schemas from '../schemas.js';
import { anyObjectSchema, parseArgument, parseResponse } from '../utils.js';

export type {
    Schedule,
    ScheduleAction,
    ScheduleActionRunActor,
    ScheduleActionRunActorTask,
    ScheduledActorRunInput,
    ScheduledActorRunOptions,
    ScheduleInvoked,
} from '../models.js';
export { ScheduleActions } from '../models.js';

const scheduleLogSchema = z.array(schemas.ScheduleInvoked());

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
        return this.getResource(schemas.Schedule());
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
        return this.updateResource(schemas.Schedule(), newFields);
    }

    /**
     * Deletes the schedule.
     *
     * @see https://docs.apify.com/api/v2/schedule-delete
     */
    async delete(): Promise<void> {
        return this.deleteResource();
    }

    /**
     * Retrieves the schedule's log.
     *
     * @returns The schedule log, one entry per invocation.
     * @see https://docs.apify.com/api/v2/schedule-log-get
     */
    async getLog(): Promise<ScheduleInvoked[]> {
        const response = await this.httpClient.call({
            url: this.buildUrl('log'),
            method: 'GET',
            params: this.buildParams(),
        });
        return parseResponse(response, scheduleLogSchema);
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
