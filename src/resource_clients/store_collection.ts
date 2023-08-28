import ow from 'ow';
import { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import { PaginatedList } from '../utils';
import { ActorStats } from './actor';

export class StoreCollectionClient extends ResourceCollectionClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'store',
            ...options,
        });
    }

    /**
     * https://docs.apify.com/api/v2/#/reference/store/store-actors-collection/get-list-of-actors-in-store
     */
    async list(options: StoreCollectionListOptions = {}): Promise<PaginatedList<ActorStoreList>> {
        ow(options, ow.object.exactShape({
            limit: ow.optional.number,
            offset: ow.optional.number,
            search: ow.optional.string,
            sortBy: ow.optional.string,
            category: ow.optional.string,
            username: ow.optional.string,
            pricingModel: ow.optional.string,
        }));

        return this._list(options);
    }
}

export interface PricingInfo {
    pricingModel: string;
}

export interface ActorStoreList {
    id: string;
    name: string;
    username: string;
    title?: string;
    description?: string;
    stats: ActorStats;
    currentPricingInfo: PricingInfo;
    pictureUrl?: string;
    userPictureUrl?: string;
}

export interface StoreCollectionListOptions {
    limit?: number;
    offset?: number;
    search?: string;
    sortBy?: string;
    category?: string;
    username?: string;
    pricingModel?: string;
}
