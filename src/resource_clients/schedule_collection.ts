import { z } from 'zod';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import type { PaginatedIterator, PaginationOptions } from '../utils';
import { validate } from '../utils';
import type { Schedule, ScheduleCreateOrUpdateData } from './schedule';

const listOptionsSchema = z
    .object({
        limit: z.number().min(0).optional(),
        offset: z.number().min(0).optional(),
        desc: z.boolean().optional(),
    })
    .strict();
const scheduleCreateSchema = z.object({}).passthrough().optional();

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
        validate(listOptionsSchema, options);

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
        validate(scheduleCreateSchema, schedule);

        return this._create(schedule);
    }
}

export interface ScheduleCollectionListOptions extends PaginationOptions {
    desc?: boolean;
}
