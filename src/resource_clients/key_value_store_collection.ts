import ow from 'ow';
import { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import { PaginatedList } from '../utils';
import { KeyValueStore } from './key_value_store';

export class KeyValueStoreCollectionClient extends ResourceCollectionClient {
    /**
     * @hidden
     */
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
    async getOrCreate(name?: string, options?: KeyValueStoreCollectionClientGetOrCreateOptions): Promise<KeyValueStore> {
        ow(name, ow.optional.string);
        ow(options?.schema, ow.optional.object); // TODO: Add schema validatioon

        return this._getOrCreate(name, options);
    }
}

export interface KeyValueStoreCollectionClientListOptions {
    unnamed?: boolean;
    limit?: number;
    offset?: number;
    desc?: boolean;
}

export interface KeyValueStoreCollectionClientGetOrCreateOptions {
    schema?: Record<string, unknown>;
}

export type KeyValueStoreCollectionListResult = Omit<KeyValueStore, 'stats'> & { username?: string; };
