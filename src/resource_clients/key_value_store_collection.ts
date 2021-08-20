import ow from 'ow';
import { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import { PaginatedList } from '../utils';
import { KeyValueStore } from './key_value_store';

/**
 * @hideconstructor
 */
export class KeyValueStoreCollectionClient extends ResourceCollectionClient {
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'key-value-stores',
            ...options,
        });
    }

    /**
     * https://docs.apify.com/api/v2#/reference/key-value-stores/store-collection/get-list-of-key-value-stores
     */
    async list(options: KeyValueStoreCollectionClientListOptions = {}): Promise<PaginatedList<KeyValueStoreCollectionListResult>> {
        ow(options, ow.object.exactShape({
            unnamed: ow.optional.boolean,
            limit: ow.optional.number,
            offset: ow.optional.number,
            desc: ow.optional.boolean,
        }));

        return this._list(options);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/key-value-stores/store-collection/create-key-value-store
     */
    async getOrCreate(name?: string): Promise<KeyValueStore> {
        ow(name, ow.optional.string);

        return this._getOrCreate(name);
    }
}

export interface KeyValueStoreCollectionClientListOptions {
    unnamed?: boolean;
    limit?: number;
    offset?: number;
    desc?: boolean;
}

export type KeyValueStoreCollectionListResult = Omit<KeyValueStore, 'stats'> & { username?: string; };
