import ow from 'ow';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import type { IterablePaginatedList , PaginatedList} from "../utils";
import type { ActorStats } from './actor';

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
    async list(options: StoreCollectionListOptions = {}): Promise<IterablePaginatedList<ActorStoreList>> {
        ow(
            options,
            ow.object.exactShape({
                limit: ow.optional.number,
                offset: ow.optional.number,
                search: ow.optional.string,
                sortBy: ow.optional.string,
                category: ow.optional.string,
                username: ow.optional.string,
                pricingModel: ow.optional.string,
            }),
        );
        const getPaginatedList = this._list.bind(this);

        let currentPage = await getPaginatedList<StoreCollectionListOptions, PaginatedList<ActorStoreList>>(options)



        return {
            ...currentPage,
            async *[Symbol.asyncIterator](){
                yield currentPage;
                let itemsFetched = currentPage.items.length;
                let currentLimit= options.limit !== undefined ? options.limit-itemsFetched: undefined;
                let currentOffset= options.offset ?? 0 + itemsFetched;

                while (currentPage.items.length>0 && (currentLimit === undefined || currentLimit>0)) {

                    const newOptions = { ...options, limit: currentLimit, offset: currentOffset};
                    currentPage = await getPaginatedList<StoreCollectionListOptions, PaginatedList<ActorStoreList>>(newOptions)
                    yield currentPage;
                    itemsFetched += currentPage.items.length
                    currentLimit= options.limit !== undefined ? options.limit-itemsFetched: undefined;
                    currentOffset= options.offset ?? 0 + itemsFetched;

                }
            }
        };
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
    url: string;
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
