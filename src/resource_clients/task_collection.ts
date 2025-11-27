import ow from 'ow';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import type { PaginatedIterator, PaginationOptions } from '../utils';
import type { Task, TaskUpdateData } from './task';

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
     * @param options - Pagination and sorting options.
     * @returns A paginated iterator of tasks.
     * @see https://docs.apify.com/api/v2/actor-tasks-get
     *
     * Awaiting the return value (as you would with a Promise) will result in a single API call. The amount of fetched
     * items in a single API call is limited.
     * ```javascript
     * const paginatedList = await client.list(options);
     *```
     *
     * Asynchronous iteration is also supported. This will fetch additional pages if needed until all items are
     * retrieved.
     *
     * ```javascript
     * for await (const singleItem of client.list(options)) {...}
     * ```
     */
    list(options: TaskCollectionListOptions = {}): PaginatedIterator<TaskList> {
        ow(
            options,
            ow.object.exactShape({
                limit: ow.optional.number,
                offset: ow.optional.number,
                desc: ow.optional.boolean,
            }),
        );

        return this._listPaginated(options);
    }

    /**
     * Creates a new task.
     *
     * @param task - The task data.
     * @returns The created task object.
     * @see https://docs.apify.com/api/v2/actor-tasks-post
     */
    async create(task: TaskCreateData): Promise<Task> {
        ow(task, ow.object);

        return this._create(task);
    }
}

export interface TaskCollectionListOptions extends PaginationOptions {
    desc?: boolean;
}

export type TaskList = Omit<Task, 'options' | 'input'>;

export interface TaskCreateData extends TaskUpdateData {
    actId: string;
}
