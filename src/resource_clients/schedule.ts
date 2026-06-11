import ow from 'ow';

import type { ApifyApiError } from '../apify_api_error';
import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import type { ApifyRequestConfig } from '../http_client';
import type { Timezone } from '../timezones';
import type { DistributiveOptional } from '../utils';
import { cast, catchNotFoundOrThrow, parseDateFields, pluckData } from '../utils';

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
 * @since Added in 1.0.0
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
     * @since Added in 2.0.1
     */
    async get(): Promise<Schedule | undefined> {
        return this._get();
    }

    /**
     * Updates the schedule with the specified fields.
     *
     * @param newFields - Fields to update.
     * @returns The updated schedule object.
     * @see https://docs.apify.com/api/v2/schedule-put
     * @since Added in 2.0.1
     */
    async update(newFields: ScheduleCreateOrUpdateData): Promise<Schedule> {
        ow(newFields, ow.object);
        return this._update(newFields);
    }

    /**
     * Deletes the schedule.
     *
     * @see https://docs.apify.com/api/v2/schedule-delete
     * @since Added in 2.0.1
     */
    async delete(): Promise<void> {
        return this._delete();
    }

    /**
     * Retrieves the schedule's log.
     *
     * @returns The schedule log as a string, or `undefined` if it does not exist.
     * @see https://docs.apify.com/api/v2/schedule-log-get
     * @since Added in 2.0.1
     */
    async getLog(): Promise<string | undefined> {
        const requestOpts: ApifyRequestConfig = {
            url: this._url('log'),
            method: 'GET',
            params: this._params(),
        };
        try {
            const response = await this.httpClient.call(requestOpts);
            return cast(parseDateFields(pluckData(response.data)));
        } catch (err) {
            catchNotFoundOrThrow(err as ApifyApiError);
        }

        return undefined;
    }
}

/**
 * Represents a schedule for automated Actor or Task runs.
 *
 * Schedules use cron expressions to define when Actors or Tasks should run automatically.
 * @since Added in 1.0.0
 */
export interface Schedule {
    /**
     * @since Added in 2.0.1
     */
    id: string;
    /**
     * @since Added in 2.0.1
     */
    userId: string;
    /**
     * @since Added in 2.0.1
     */
    name: string;
    /**
     * @since Added in 2.6.1
     */
    title?: string;
    /**
     * @since Added in 2.0.1
     */
    cronExpression: string;
    /**
     * @since Added in 2.0.1
     */
    timezone: Timezone;
    /**
     * @since Added in 2.0.1
     */
    isEnabled: boolean;
    /**
     * @since Added in 2.0.1
     */
    isExclusive: boolean;
    /**
     * @since Added in 2.0.1
     */
    description?: string;
    /**
     * @since Added in 2.0.1
     */
    createdAt: Date;
    /**
     * @since Added in 2.0.1
     */
    modifiedAt: Date;
    /**
     * @since Added in 2.0.1
     */
    nextRunAt: string;
    /**
     * @since Added in 2.0.1
     */
    lastRunAt: string;
    /**
     * @since Added in 2.0.1
     */
    actions: ScheduleAction[];
    /**
     * @since Added in 2.9.4
     */
    notifications: {
        email: boolean;
    };
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

/**
 * Types of actions that can be scheduled.
 * @since Added in 2.0.1
 */
export enum ScheduleActions {
    /**
     * @since Added in 2.0.1
     */
    RunActor = 'RUN_ACTOR',
    /**
     * @since Added in 2.0.1
     */
    RunActorTask = 'RUN_ACTOR_TASK',
}

interface BaseScheduleAction<Type extends ScheduleActions> {
    /**
     * @since Added in 2.0.1
     */
    id: string;
    /**
     * @since Added in 2.0.1
     */
    type: Type;
}

/**
 * Union type representing all possible scheduled actions.
 * @since Added in 2.0.1
 */
export type ScheduleAction = ScheduleActionRunActor | ScheduleActionRunActorTask;

/**
 * Scheduled action to run an Actor.
 * @since Added in 2.0.1
 */
export interface ScheduleActionRunActor extends BaseScheduleAction<ScheduleActions.RunActor> {
    /**
     * @since Added in 2.0.1
     */
    actorId: string;
    /**
     * @since Added in 2.0.1
     */
    runInput?: ScheduledActorRunInput;
    /**
     * @since Added in 2.0.1
     */
    runOptions?: ScheduledActorRunOptions;
}

/**
 * Input configuration for a scheduled Actor run.
 * @since Added in 2.0.1
 */
export interface ScheduledActorRunInput {
    /**
     * @since Added in 2.0.1
     */
    body: string;
    /**
     * @since Added in 2.0.1
     */
    contentType: string;
}

/**
 * Run options for a scheduled Actor run.
 * @since Added in 2.0.1
 */
export interface ScheduledActorRunOptions {
    /**
     * @since Added in 2.0.1
     */
    build: string;
    /**
     * @since Added in 2.0.1
     */
    timeoutSecs: number;
    /**
     * @since Added in 2.0.1
     */
    memoryMbytes: number;
    /**
     * @since Added in 2.19.0
     */
    restartOnError?: boolean;
}

/**
 * Scheduled action to run an Actor task.
 * @since Added in 2.0.1
 */
export interface ScheduleActionRunActorTask extends BaseScheduleAction<ScheduleActions.RunActorTask> {
    /**
     * @since Added in 2.0.1
     */
    actorTaskId: string;
    /**
     * @since Added in 2.0.1
     */
    input?: string;
}
