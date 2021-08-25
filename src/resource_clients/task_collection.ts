import ow from 'ow';
import { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import { PaginatedList } from '../utils';
import { Task, TaskUpdateData } from './task';

/**
 * @hideconstructor
 */
export class TaskCollectionClient extends ResourceCollectionClient {
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
     * @return {Promise<PaginationList>}
     */
    async list(options: TaskCollectionListOptions = {}): Promise<PaginatedList<TaskList>> {
        ow(options, ow.object.exactShape({
            limit: ow.optional.number,
            offset: ow.optional.number,
            desc: ow.optional.boolean,
        }));

        return this._list(options);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actor-tasks/task-collection/create-task
     */
    async create(task?: TaskUpdateData): Promise<Task> {
        ow(task, ow.optional.object);

        return this._create(task);
    }
}

export interface TaskCollectionListOptions {
    limit?: number;
    offset?: number;
    desc?: boolean;
}

export type TaskList = Omit<Task, 'options' | 'input'>;
