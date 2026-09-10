import { z } from 'zod';

import type { ApiClientSubResourceOptions } from '../base/api_client.js';
import { ResourceClient } from '../base/resource_client.js';
import type { Schedule, ScheduleAction, ScheduleInvoked } from '../models.js';
import type { TimeoutOptions } from '../timeouts.js';
import type { DistributiveOptional } from '../utils.js';
import * as schemas from '../schemas.js';
import { timeoutOptionsSchema } from '../timeouts.js';
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
     * @param options - Request options
     * @param options.timeout - Timeout for the API request. Default is `'short'`.
     * @returns The schedule object, or `undefined` if it does not exist.
     * @see https://docs.apify.com/api/v2/schedule-get
     */
    async get(options: TimeoutOptions = {}): Promise<Schedule | undefined> {
        const { timeout = 'short' } = parseArgument(options, timeoutOptionsSchema, 'TimeoutOptions');

        return this.getResource(schemas.Schedule(), {}, timeout);
    }

    /**
     * Updates the schedule with the specified fields.
     *
     * @param newFields - Fields to update.
     * @param options - Request options
     * @param options.timeout - Timeout for the API request. Default is `'short'`.
     * @returns The updated schedule object.
     * @see https://docs.apify.com/api/v2/schedule-put
     */
    async update(newFields: ScheduleCreateOrUpdateData, options: TimeoutOptions = {}): Promise<Schedule> {
        parseArgument(newFields, anyObjectSchema);
        const { timeout = 'short' } = parseArgument(options, timeoutOptionsSchema, 'TimeoutOptions');

        return this.updateResource(schemas.Schedule(), newFields, timeout);
    }

    /**
     * Deletes the schedule.
     *
     * @param options - Request options
     * @param options.timeout - Timeout for the API request. Default is `'short'`.
     * @see https://docs.apify.com/api/v2/schedule-delete
     */
    async delete(options: TimeoutOptions = {}): Promise<void> {
        const { timeout = 'short' } = parseArgument(options, timeoutOptionsSchema, 'TimeoutOptions');

        return this.deleteResource(timeout);
    }

    /**
     * Retrieves the schedule's log.
     *
     * @param options - Request options
     * @param options.timeout - Timeout for the API request. Default is `'medium'`.
     * @returns The schedule log, one entry per invocation.
     * @see https://docs.apify.com/api/v2/schedule-log-get
     */
    async getLog(options: TimeoutOptions = {}): Promise<ScheduleInvoked[]> {
        const { timeout = 'medium' } = parseArgument(options, timeoutOptionsSchema, 'TimeoutOptions');

        const response = await this.httpClient.call({
            url: this.buildUrl('log'),
            method: 'GET',
            params: this.buildParams(),
            timeout,
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
