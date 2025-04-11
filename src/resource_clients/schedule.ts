import ow from 'ow';

import type { ApifyApiError } from '../apify_api_error';
import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import type { ApifyRequestConfig } from '../http_client';
import type { Timezone } from '../timezones';
import type {
    DistributiveOptional} from '../utils';
import {
    cast,
    catchNotFoundOrThrow,
    parseDateFields,
    pluckData,
} from '../utils';

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
     * https://docs.apify.com/api/v2#/reference/schedules/schedule-object/get-schedule
     */
    async get(): Promise<Schedule | undefined> {
        return this._get();
    }

    /**
     * https://docs.apify.com/api/v2#/reference/schedules/schedule-object/update-schedule
     */
    async update(newFields: ScheduleCreateOrUpdateData): Promise<Schedule> {
        ow(newFields, ow.object);
        return this._update(newFields);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/schedules/schedule-object/delete-schedule
     */
    async delete(): Promise<void> {
        return this._delete();
    }

    /**
     * https://docs.apify.com/api/v2#/reference/schedules/schedule-log/get-schedule-log
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

export interface Schedule {
    id: string;
    userId: string;
    name: string;
    title?: string;
    cronExpression: string;
    timezone: Timezone;
    isEnabled: boolean;
    isExclusive: boolean;
    description?: string;
    createdAt: Date;
    modifiedAt: Date;
    nextRunAt: string;
    lastRunAt: string;
    actions: ScheduleAction[];
    notifications: {
        email: boolean;
    };
}

export type ScheduleCreateOrUpdateData = Partial<
    Pick<
        Schedule,
        | 'name'
        | 'title'
        | 'cronExpression'
        | 'timezone'
        | 'isEnabled'
        | 'isExclusive'
        | 'description'
        | 'notifications'
    > & {
        actions: DistributiveOptional<ScheduleAction, 'id'>[];
    }
>;

export enum ScheduleActions {
    RunActor = 'RUN_ACTOR',
    RunActorTask = 'RUN_ACTOR_TASK',
}

interface BaseScheduleAction<Type extends ScheduleActions> {
    id: string;
    type: Type;
}

export type ScheduleAction = ScheduleActionRunActor | ScheduleActionRunActorTask;

export interface ScheduleActionRunActor extends BaseScheduleAction<ScheduleActions.RunActor> {
    actorId: string;
    runInput?: ScheduledActorRunInput;
    runOptions?: ScheduledActorRunOptions;
}

export interface ScheduledActorRunInput {
    body: string;
    contentType: string;
}

export interface ScheduledActorRunOptions {
    build: string;
    timeoutSecs: number;
    memoryMbytes: number;
}

export interface ScheduleActionRunActorTask extends BaseScheduleAction<ScheduleActions.RunActorTask> {
    actorTaskId: string;
    input?: string;
}
