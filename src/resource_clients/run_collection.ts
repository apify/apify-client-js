import { ACT_JOB_STATUSES } from '@apify/consts';
import ow from 'ow';
import { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import { PaginatedList } from '../utils';
import { ActorRunListItem } from './actor';

/**
 * @hideconstructor
 */
export class RunCollectionClient extends ResourceCollectionClient {
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'runs',
            ...options,
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/run-collection/get-list-of-runs
     */
    async list(options: RunCollectionListOptions = {}): Promise<PaginatedList<ActorRunListItem>> {
        ow(options, ow.object.exactShape({
            limit: ow.optional.number,
            offset: ow.optional.number,
            desc: ow.optional.boolean,
            status: ow.optional.string.oneOf(Object.values(ACT_JOB_STATUSES)),
        }));

        return this._list(options);
    }
}

export interface RunCollectionListOptions {
    limit?: number;
    offset?: number;
    desc?: boolean;
    status?: keyof typeof ACT_JOB_STATUSES;
}
