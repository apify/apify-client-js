import ow from 'ow';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import type { PaginatedList } from '../utils';
import type { Schedule, ScheduleCreateOrUpdateData } from './schedule';

export class ScheduleCollectionClient extends ResourceCollectionClient {
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
     * https://docs.apify.com/api/v2#/reference/schedules/schedules-collection/get-list-of-schedules
     */
    list(options: ScheduleCollectionListOptions = {}): Promise<PaginatedList<Schedule>> & AsyncIterable<Schedule> {
        ow(
            options,
            ow.object.exactShape({
                limit: ow.optional.number,
                offset: ow.optional.number,
                desc: ow.optional.boolean,
            }),
        );

        return this._getIterablePagination(options);
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
