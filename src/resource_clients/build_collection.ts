import ow from 'ow';

import { Build } from './build';
import { ApiClientOptionsWithOptionalResourcePath } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import { PaginatedList } from '../utils';

export class BuildCollectionClient extends ResourceCollectionClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientOptionsWithOptionalResourcePath) {
        super({
            ...options,
            resourcePath: options.resourcePath || 'actor-builds',
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/actors/build-collection/get-list-of-builds
     */
    async list(options: BuildCollectionClientListOptions = {}): Promise<BuildCollectionClientListResult> {
        ow(options, ow.object.exactShape({
            limit: ow.optional.number,
            offset: ow.optional.number,
            desc: ow.optional.boolean,
        }));

        return this._list(options);
    }
}

export interface BuildCollectionClientListOptions {
    limit?: number;
    offset?: number;
    desc?: boolean;
}

export type BuildCollectionClientListItem = Required<Pick<Build, 'id' | 'status' | 'startedAt' | 'finishedAt'>> & Partial<Pick<Build, 'meta' | 'usageTotalUsd'>>

export type BuildCollectionClientListResult = PaginatedList<BuildCollectionClientListItem>;
