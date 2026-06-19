import ow from 'ow';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import type { PaginatedIterator, PaginationOptions } from '../utils';
import type { Schedule, ScheduleCreateOrUpdateData } from './schedule';

/**
 * Client for managing the collection of Schedules in your account.
 *
 * Schedules are used to automatically start Actors or tasks at specified times.
 * This client provides methods to list and create schedules.
 *
 * @example
 * ```javascript
 * const client = new ApifyClient({ token: 'my-token' });
 * const schedulesClient = client.schedules();
 *
 * // List all schedules
 * const { items } = await schedulesClient.list();
 *
 * // Create a new schedule
 * const newSchedule = await schedulesClient.create({
 *   actorId: 'my-actor-id',
 *   cronExpression: '0 9 * * *',
 *   isEnabled: true
 * });
 * ```
 *
 * @see https://docs.apify.com/platform/schedules
 */
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
     * Lists all schedules.
     *
     * Awaiting the return value (as you would with a Promise) will result in a single API call. The amount of fetched
     * items in a single API call is limited.
     * ```javascript
     * const paginatedList = await client.list(options);
     * ```
     *
     * Asynchronous iteration is also supported. This will fetch additional pages if needed until all items are
     * retrieved.
     *
     * ```javascript
     * for await (const singleItem of client.list(options)) {...}
     * ```
     *
     * @param options - Pagination and sorting options.
     * @returns A paginated iterator of schedules.
     * @see https://docs.apify.com/api/v2/schedules-get
     */
    list(options: ScheduleCollectionListOptions = {}): PaginatedIterator<Schedule> {
        ow(
            options,
            ow.object.exactShape({
                limit: ow.optional.number.not.negative,
                offset: ow.optional.number.not.negative,
                desc: ow.optional.boolean,
            }),
        );

        return this._listPaginated(options);
    }

    /**
     * Creates a new schedule.
     *
     * @param schedule - The schedule data.
     * @returns The created schedule object.
     * @see https://docs.apify.com/api/v2/schedules-post
     */
    async create(schedule?: ScheduleCreateOrUpdateData): Promise<Schedule> {
        ow(schedule, ow.optional.object);

        return this._create(schedule);
    }
}

export interface ScheduleCollectionListOptions extends PaginationOptions {
    desc?: boolean;
}
