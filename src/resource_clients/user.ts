import type { ApifyApiError } from '../apify_api_error';
import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import type { ApifyRequestConfig } from '../http_client';
import { cast, catchNotFoundOrThrow, parseDateFields, pluckData } from '../utils';

/**
 * Client for managing user account information.
 *
 * Provides methods to retrieve user details, monthly usage statistics, and account limits.
 * When using an API token, you can access your own user information or public information
 * about other users.
 *
 * @example
 * ```javascript
 * const client = new ApifyClient({ token: 'my-token' });
 * const userClient = client.user('my-user-id');
 *
 * // Get user information
 * const user = await userClient.get();
 *
 * // Get monthly usage
 * const usage = await userClient.monthlyUsage();
 *
 * // Get account limits
 * const limits = await userClient.limits();
 * ```
 *
 * @see https://docs.apify.com/platform/actors/running
 */
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
     * Retrieves the user data.
     *
     * Depending on whether ApifyClient was created with a token,
     * the method will either return public or private user data.
     *
     * @returns The user object.
     * @see https://docs.apify.com/api/v2/user-get
     */
    async get(): Promise<User> {
        return this._get() as Promise<User>;
    }

    /**
     * Retrieves the user's monthly usage data.
     *
     * @returns The monthly usage object, or `undefined` if it does not exist.
     * @see https://docs.apify.com/api/v2/user-usage-monthly-get
     */
    async monthlyUsage(): Promise<MonthlyUsage | undefined> {
        const requestOpts: ApifyRequestConfig = {
            url: this._url('usage/monthly'),
            method: 'GET',
            params: this._params(),
        };
        try {
            const response = await this.httpClient.call(requestOpts);
            return cast(
                parseDateFields(
                    pluckData(response.data),
                    // Convert  monthlyUsage.dailyServiceUsages[].date to Date (by default it's ignored by parseDateFields)
                    /* shouldParseField = */ (key) => key === 'date',
                ),
            );
        } catch (err) {
            catchNotFoundOrThrow(err as ApifyApiError);
        }

        return undefined;
    }

    /**
     * Retrieves the user's account and usage limits.
     *
     * @returns The account and usage limits object, or `undefined` if it does not exist.
     * @see https://docs.apify.com/api/v2/user-limits-get
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

    /**
     * Updates the user's account and usage limits.
     *
     * @param options - The new limits to set.
     * @see https://docs.apify.com/api/v2/user-limits-put
     */
    async updateLimits(options: LimitsUpdateOptions): Promise<void> {
        const requestOpts: ApifyRequestConfig = {
            url: this._url('limits'),
            method: 'PUT',
            params: this._params(),
            data: options,
        };
        await this.httpClient.call(requestOpts);
    }
}

//
// Response interface for /users/:userId and /users/me
// Using token will return private user data
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
    };
    // Private properties
    id?: string;
    email?: string;
    proxy?: UserProxy;
    plan?: UserPlan;
    effectivePlatformFeatures?: EffectivePlatformFeatures;
    createdAt?: Date;
    isPaying?: boolean;
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

interface EffectivePlatformFeature {
    isEnabled: boolean;
    disabledReason: string | null;
    disabledReasonType: string | null;
    isTrial: boolean;
    trialExpirationAt: Date | null;
}

interface EffectivePlatformFeatures {
    ACTORS: EffectivePlatformFeature;
    STORAGE: EffectivePlatformFeature;
    SCHEDULER: EffectivePlatformFeature;
    PROXY: EffectivePlatformFeature;
    PROXY_EXTERNAL_ACCESS: EffectivePlatformFeature;
    PROXY_RESIDENTIAL: EffectivePlatformFeature;
    PROXY_SERPS: EffectivePlatformFeature;
    WEBHOOKS: EffectivePlatformFeature;
    ACTORS_PUBLIC_ALL: EffectivePlatformFeature;
    ACTORS_PUBLIC_DEVELOPER: EffectivePlatformFeature;
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

export type LimitsUpdateOptions = Pick<Limits, 'maxMonthlyUsageUsd' | 'dataRetentionDays'>;

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
