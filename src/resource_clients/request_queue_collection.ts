import ow from 'ow';
import { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import { PaginatedList } from '../utils';
import { RequestQueue } from './request_queue';

/**
 * @hideconstructor
 */
export class RequestQueueCollectionClient extends ResourceCollectionClient {
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'request-queues',
            ...options,
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/request-queues/queue-collection/get-list-of-request-queues
     */
    async list(options: RequestQueueCollectionListOptions = {}): Promise<RequestQueueCollectionListResult> {
        ow(options, ow.object.exactShape({
            unnamed: ow.optional.boolean,
            limit: ow.optional.number,
            offset: ow.optional.number,
            desc: ow.optional.boolean,
        }));

        return this._list(options);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/request-queues/queue-collection/create-request-queue
     */
    async getOrCreate(name?: string): Promise<RequestQueue> {
        ow(name, ow.optional.string);

        return this._getOrCreate(name);
    }
}

export interface RequestQueueCollectionListOptions {
    unnamed?: boolean;
    limit?: number;
    offset?: number;
    desc?: boolean;
}

export type RequestQueueCollectionListResult = PaginatedList<RequestQueue & { username?: string; }> & { unnamed: boolean; }
