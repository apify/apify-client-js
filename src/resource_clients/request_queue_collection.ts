import ow from 'ow';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import type { PaginatedList, PaginationOptions } from '../utils';
import type { RequestQueue } from './request_queue';

export class RequestQueueCollectionClient extends ResourceCollectionClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'request-queues',
            ...options,
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/request-queues/queue-collection/get-list-of-request-queues
     *
     * Use as a promise. It will always do only 1 API call:
     * const paginatedList = await client.list(options);
     *
     * Use as an async iterator. It can do multiple API calls if needed:
     * for await (const singleItem of client.list(options)) {...}
     *
     */
    list(
        options: RequestQueueCollectionListOptions = {},
    ): Promise<RequestQueueCollectionListResult> & AsyncIterable<RequestQueue> {
        ow(
            options,
            ow.object.exactShape({
                unnamed: ow.optional.boolean,
                limit: ow.optional.number,
                offset: ow.optional.number,
                desc: ow.optional.boolean,
            }),
        );

        return this._getPaginatedIterator(options);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/request-queues/queue-collection/create-request-queue
     */
    async getOrCreate(name?: string): Promise<RequestQueue> {
        ow(name, ow.optional.string);

        return this._getOrCreate(name);
    }
}

export interface RequestQueueCollectionListOptions extends PaginationOptions {
    unnamed?: boolean;
    desc?: boolean;
}

export type RequestQueueCollectionListResult = PaginatedList<RequestQueue & { username?: string }> & {
    unnamed: boolean;
};
