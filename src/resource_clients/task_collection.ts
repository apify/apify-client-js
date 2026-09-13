import { z } from 'zod';

import type { ApiClientSubResourceOptions } from '../base/api_client.js';
import { ResourceCollectionClient } from '../base/resource_collection_client.js';
import type { TaskList } from '../models.js';
import type { TimeoutOptions } from '../timeouts.js';
import type { PaginatedIterator, PaginationOptions } from '../utils.js';
import * as schemas from '../schemas.js';
import { timeoutOptionsSchema, timeoutOptionsShape } from '../timeouts.js';
import { anyObjectSchema, paginationOptionsShape, parseArgument } from '../utils.js';
import type { Task, TaskUpdateData } from './task.js';

const listOptionsSchema = z.strictObject({
    ...paginationOptionsShape,
    desc: z.boolean().optional(),
    ...timeoutOptionsShape,
});

export type { TaskList } from '../models.js';

/**
 * Client for managing the collection of Actor tasks in your account.
 *
 * Tasks are pre-configured Actor runs with saved input and options. This client provides
 * methods to list and create tasks.
 *
 * @example
 * ```javascript
 * const client = new ApifyClient({ token: 'my-token' });
 * const tasksClient = client.tasks();
 *
 * // List all tasks
 * const { items } = await tasksClient.list();
 *
 * // Create a new task
 * const newTask = await tasksClient.create({
 *   actId: 'my-actor-id',
 *   name: 'my-task',
 *   input: { url: 'https://example.com' }
 * });
 * ```
 *
 * @see https://docs.apify.com/platform/actors/running/tasks
 */
export class TaskCollectionClient extends ResourceCollectionClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'actor-tasks',
            ...options,
        });
    }

    /**
     * Lists all Tasks.
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
     * @param options.timeoutSecs - Timeout for each API request. Default is `'medium'`.
     * @returns A paginated iterator of tasks.
     * @see https://docs.apify.com/api/v2/actor-tasks-get
     */
    list(options: TaskCollectionListOptions = {}): PaginatedIterator<TaskList> {
        const parsed = parseArgument(options, listOptionsSchema, 'TaskCollectionListOptions');

        return this.listResourcesPaginated(schemas.ListOfTasks(), parsed, 'medium');
    }

    /**
     * Creates a new task.
     *
     * @param task - The task data.
     * @param options - Request options
     * @param options.timeoutSecs - Timeout for the API request. Default is `'medium'`.
     * @returns The created task object.
     * @see https://docs.apify.com/api/v2/actor-tasks-post
     */
    async create(task: TaskCreateData, options: TimeoutOptions = {}): Promise<Task> {
        parseArgument(task, anyObjectSchema);
        const { timeoutSecs = 'medium' } = parseArgument(options, timeoutOptionsSchema, 'TimeoutOptions');

        return this.createResource(schemas.Task(), task, timeoutSecs);
    }
}

export interface TaskCollectionListOptions extends PaginationOptions, TimeoutOptions {
    desc?: boolean;
}

/**
 * @since Added in 2.3.0
 */
export interface TaskCreateData extends TaskUpdateData {
    actId: string;
}
