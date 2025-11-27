import ow from 'ow';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import type { PaginatedIterator } from '../utils';
import type { Task, TaskUpdateData } from './task';

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
     * https://docs.apify.com/api/v2#/reference/actor-tasks/task-collection/get-list-of-tasks
     * @param {object} [options]
     * @param {number} [options.limit]
     * @param {number} [options.offset]
     * @param {boolean} [options.desc]
     * @return {PaginatedIterator<TaskList>}
     *
     * Use as a promise. It will always do only 1 API call:
     * const paginatedList = await client.list(options);
     *
     * Use as an async iterator. It can do multiple API calls if needed:
     * for await (const singleItem of client.list(options)) {...}
     *
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

        return this._getPaginatedIterator(options);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-tasks/task-collection/create-task
     */
    async create(task: TaskCreateData): Promise<Task> {
        ow(task, ow.object);

        return this._create(task);
    }
}

export interface TaskCollectionListOptions {
    limit?: number;
    offset?: number;
    desc?: boolean;
}

export type TaskList = Omit<Task, 'options' | 'input'>;

export interface TaskCreateData extends TaskUpdateData {
    actId: string;
}
