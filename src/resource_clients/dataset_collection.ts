import ow from 'ow';
import { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import { PaginatedList } from '../utils';
import { Dataset } from './dataset';

/**
 * @hideconstructor
 */
export class DatasetCollectionClient extends ResourceCollectionClient {
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'datasets',
            ...options,
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/datasets/dataset-collection/get-list-of-datasets
     */
    async list(options: DatasetCollectionClientListOptions = {}): Promise<DatasetCollectionClientListResult> {
        ow(options, ow.object.exactShape({
            unnamed: ow.optional.boolean,
            limit: ow.optional.number,
            offset: ow.optional.number,
            desc: ow.optional.boolean,
        }));

        return this._list(options);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/datasets/dataset-collection/create-dataset
     */
    async getOrCreate(name?: string): Promise<Dataset> {
        ow(name, ow.optional.string);
        return this._getOrCreate(name);
    }
}

export interface DatasetCollectionClientListOptions {
    unnamed?: boolean;
    limit?: number;
    offset?: number;
    desc?: boolean;
}

export type DatasetCollectionClientListResult = PaginatedList<Dataset>
