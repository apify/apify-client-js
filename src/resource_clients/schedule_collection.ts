import ow from 'ow';
import { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import { PaginatedList } from '../utils';
import { Schedule, ScheduleCreateOrUpdateData } from './schedule';

/**
 * @hideconstructor
 */
export class ScheduleCollectionClient extends ResourceCollectionClient {
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'schedules',
            ...options,
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/schedules/schedules-collection/get-list-of-schedules
     */
    async list(options: ScheduleCollectionListOptions = {}): Promise<PaginatedList<Schedule>> {
        ow(options, ow.object.exactShape({
            limit: ow.optional.number,
            offset: ow.optional.number,
            desc: ow.optional.boolean,
        }));

        return this._list(options);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/schedules/schedules-collection/create-schedule
     */
    async create(schedule?: ScheduleCreateOrUpdateData): Promise<Schedule> {
        ow(schedule, ow.optional.object);

        return this._create(schedule);
    }
}

export interface ScheduleCollectionListOptions {
    limit?: number;
    offset?: number;
    desc?: boolean;
}
