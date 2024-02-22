import { ApifyApiError } from '../apify_api_error';
import { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import { ApifyRequestConfig } from '../http_client';
import { cast, catchNotFoundOrThrow, parseDateFields, pluckData } from '../utils';

export class UserClient extends ResourceClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'users',
            ...options,
        });
    }

    /**
     * Depending on whether ApifyClient was created with a token,
     * the method will either return public or private user data.
     * https://docs.apify.com/api/v2#/reference/users
     */
    async get(): Promise<User> {
        return this._get() as Promise<User>;
    }

    /**
     * https://docs.apify.com/api/v2/#/reference/users/monthly-usage
     */
    async monthlyUsage(): Promise<MonthlyUsage | undefined> {
        const requestOpts: ApifyRequestConfig = {
            url: this._url('usage/monthly'),
            method: 'GET',
            params: this._params(),
        };
        try {
            const response = await this.httpClient.call(requestOpts);
            return cast(parseDateFields(
                pluckData(response.data),
                // Convert  monthlyUsage.dailyServiceUsages[].date to Date (by default it's ignored by parseDateFields)
                /* shouldParseField = */ (key) => key === 'date'));
        } catch (err) {
            catchNotFoundOrThrow(err as ApifyApiError);
        }

        return undefined;
    }

    /**
     * https://docs.apify.com/api/v2/#/reference/users/account-and-usage-limits
     */
    async limits(): Promise<AccountAndUsageLimits | undefined> {
        const requestOpts: ApifyRequestConfig = {
            url: this._url('limits'),
            method: 'GET',
            params: this._params(),
        };
        try {
            const response = await this.httpClient.call(requestOpts);
            return cast(parseDateFields(pluckData(response.data)));
        } catch (err) {
            catchNotFoundOrThrow(err as ApifyApiError);
        }

        return undefined;
    }
}

//
// Response interface for /users/:userId
//

export interface User {
    // Public properties
    username: string;
    profile: {
        bio?: string;
        name?: string;
        pictureUrl?: string;
        githubUsername?: string;
        websiteUrl?: string;
        twitterUsername?: string;
    }
    // Private properties
    id?: string;
    email?: string;
    proxy?: UserProxy;
    plan?: UserPlan;
}

export interface UserProxy {
    password: string;
    groups: ProxyGroup[];
}

export interface ProxyGroup {
    name: string;
    description: string;
    availableCount: number;
}

export interface UserPlan {
    id: string;
    description: string;
    isEnabled: boolean;
    monthlyBasePriceUsd: number;
    monthlyUsageCreditsUsd: number;
    usageDiscountPercent: number;
    enabledPlatformFeatures: PlatformFeature[];
    maxMonthlyUsageUsd: number;
    maxActorMemoryGbytes: number;
    maxMonthlyActorComputeUnits: number;
    maxMonthlyResidentialProxyGbytes: number;
    maxMonthlyProxySerps: number;
    maxMonthlyExternalDataTransferGbytes: number;
    maxActorCount: number;
    maxActorTaskCount: number;
    dataRetentionDays: number;
    availableProxyGroups: Record<string, number>;
    teamAccountSeatCount: number;
    supportLevel: string;
    availableAddOns: unknown[];
}

export enum PlatformFeature {
    Actors = 'ACTORS',
    Storage = 'STORAGE',
    ProxySERPS = 'PROXY_SERPS',
    Scheduler = 'SCHEDULER',
    Webhooks = 'WEBHOOKS',
    Proxy = 'PROXY',
    ProxyExternalAccess = 'PROXY_EXTERNAL_ACCESS',
}

//
// Response interface for /users/:userId/usage/monthly
//

export interface MonthlyUsage {
    usageCycle: UsageCycle;
    monthlyServiceUsage: { [key: string]: MonthlyServiceUsageData };
    dailyServiceUsages: DailyServiceUsage[];
    totalUsageCreditsUsdBeforeVolumeDiscount: number;
    totalUsageCreditsUsdAfterVolumeDiscount: number;
}

export interface UsageCycle {
    startAt: Date;
    endAt: Date;
}

/** Monthly usage of a single service */
interface MonthlyServiceUsageData {
    quantity: number;
    baseAmountUsd: number;
    baseUnitPriceUsd: number;
    amountAfterVolumeDiscountUsd: number;
    priceTiers: PriceTier[];
}

interface PriceTier {
    quantityAbove: number;
    discountPercent: number;
    tierQuantity: number;
    unitPriceUsd: number;
    priceUsd: number;
}

interface DailyServiceUsage {
    date: Date;
    serviceUsage: { [key: string]: DailyServiceUsageData };
    totalUsageCreditsUsd: number;
}

/** Daily usage of a single service */
interface DailyServiceUsageData {
    quantity: number;
    baseAmountUsd: number;
}

//
// Response interface for /users/:userId/limits
//

export interface AccountAndUsageLimits {
    monthlyUsageCycle: MonthlyUsageCycle;
    limits: Limits;
    current: Current;
}

export interface MonthlyUsageCycle {
    startAt: Date;
    endAt: Date;
}

export interface Limits {
    maxMonthlyUsageUsd: number;
    maxMonthlyActorComputeUnits: number;
    maxMonthlyExternalDataTransferGbytes: number;
    maxMonthlyProxySerps: number;
    maxMonthlyResidentialProxyGbytes: number;
    maxActorMemoryGbytes: number;
    maxActorCount: number;
    maxActorTaskCount: number;
    maxConcurrentActorJobs: number;
    maxTeamAccountSeatCount: number;
    dataRetentionDays: number;
}

export interface Current {
    monthlyUsageUsd: number;
    monthlyActorComputeUnits: number;
    monthlyExternalDataTransferGbytes: number;
    monthlyProxySerps: number;
    monthlyResidentialProxyGbytes: number;
    actorMemoryGbytes: number;
    actorCount: number;
    actorTaskCount: number;
    activeActorJobCount: number;
    teamAccountSeatCount: number;
}
