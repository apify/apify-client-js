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
 * @since Added in 1.0.0
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
     * @since Added in 2.0.1
     */
    async get(): Promise<User> {
        return this._get() as Promise<User>;
    }

    /**
     * Retrieves the user's monthly usage data.
     *
     * @returns The monthly usage object, or `undefined` if it does not exist.
     * @see https://docs.apify.com/api/v2/users-me-usage-monthly-get
     * @since Added in 2.9.2
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
     * @see https://docs.apify.com/api/v2/users-me-limits-get
     * @since Added in 2.9.2
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
     * @see https://docs.apify.com/api/v2/users-me-limits-put
     * @since Added in 2.10.0
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

/**
 * @since Added in 0.2.2
 */
export interface User {
    // Public properties
    /**
     * @since Added in 2.0.1
     */
    username: string;
    /**
     * @since Added in 2.0.1
     */
    profile: {
        bio?: string;
        name?: string;
        pictureUrl?: string;
        githubUsername?: string;
        websiteUrl?: string;
        twitterUsername?: string;
    };
    // Private properties
    /**
     * @since Added in 2.0.1
     */
    id?: string;
    /**
     * @since Added in 2.0.1
     */
    email?: string;
    /**
     * @since Added in 2.0.1
     */
    proxy?: UserProxy;
    /**
     * @since Added in 2.0.1
     */
    plan?: UserPlan;
    /**
     * @since Added in 2.12.5
     */
    effectivePlatformFeatures?: EffectivePlatformFeatures;
    /**
     * @since Added in 2.12.5
     */
    createdAt?: Date;
    /**
     * @since Added in 2.12.5
     */
    isPaying?: boolean;
}

/**
 * @since Added in 2.0.1
 */
export interface UserProxy {
    /**
     * @since Added in 2.0.1
     */
    password: string;
    /**
     * @since Added in 2.0.1
     */
    groups: ProxyGroup[];
}

/**
 * @since Added in 2.0.1
 */
export interface ProxyGroup {
    /**
     * @since Added in 2.0.1
     */
    name: string;
    /**
     * @since Added in 2.0.1
     */
    description: string;
    /**
     * @since Added in 2.0.1
     */
    availableCount: number;
}

/**
 * @since Added in 2.0.1
 */
export interface UserPlan {
    /**
     * @since Added in 2.0.1
     */
    id: string;
    /**
     * @since Added in 2.0.1
     */
    description: string;
    /**
     * @since Added in 2.0.1
     */
    isEnabled: boolean;
    /**
     * @since Added in 2.0.1
     */
    monthlyBasePriceUsd: number;
    /**
     * @since Added in 2.0.1
     */
    monthlyUsageCreditsUsd: number;
    /**
     * @since Added in 2.0.1
     */
    usageDiscountPercent: number;
    /**
     * @since Added in 2.0.1
     */
    enabledPlatformFeatures: PlatformFeature[];
    /**
     * @since Added in 2.0.1
     */
    maxMonthlyUsageUsd: number;
    /**
     * @since Added in 2.0.1
     */
    maxActorMemoryGbytes: number;
    /**
     * @since Added in 2.0.1
     */
    maxMonthlyActorComputeUnits: number;
    /**
     * @since Added in 2.0.1
     */
    maxMonthlyResidentialProxyGbytes: number;
    /**
     * @since Added in 2.0.1
     */
    maxMonthlyProxySerps: number;
    /**
     * @since Added in 2.0.1
     */
    maxMonthlyExternalDataTransferGbytes: number;
    /**
     * @since Added in 2.0.1
     */
    maxActorCount: number;
    /**
     * @since Added in 2.0.1
     */
    maxActorTaskCount: number;
    /**
     * @since Added in 2.0.1
     */
    dataRetentionDays: number;
    /**
     * @since Added in 2.0.1
     */
    availableProxyGroups: Record<string, number>;
    /**
     * @since Added in 2.0.1
     */
    teamAccountSeatCount: number;
    /**
     * @since Added in 2.0.1
     */
    supportLevel: string;
    /**
     * @since Added in 2.0.1
     */
    availableAddOns: unknown[];
}

/**
 * @since Added in 2.0.1
 */
export enum PlatformFeature {
    /**
     * @since Added in 2.0.1
     */
    Actors = 'ACTORS',
    /**
     * @since Added in 2.0.1
     */
    Storage = 'STORAGE',
    /**
     * @since Added in 2.0.1
     */
    ProxySERPS = 'PROXY_SERPS',
    /**
     * @since Added in 2.0.1
     */
    Scheduler = 'SCHEDULER',
    /**
     * @since Added in 2.0.1
     */
    Webhooks = 'WEBHOOKS',
    /**
     * @since Added in 2.0.1
     */
    Proxy = 'PROXY',
    /**
     * @since Added in 2.0.1
     */
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

/**
 * @since Added in 2.9.2
 */
export interface MonthlyUsage {
    /**
     * @since Added in 2.9.2
     */
    usageCycle: UsageCycle;
    /**
     * @since Added in 2.9.2
     */
    monthlyServiceUsage: { [key: string]: MonthlyServiceUsageData };
    /**
     * @since Added in 2.9.2
     */
    dailyServiceUsages: DailyServiceUsage[];
    /**
     * @since Added in 2.9.2
     */
    totalUsageCreditsUsdBeforeVolumeDiscount: number;
    /**
     * @since Added in 2.9.2
     */
    totalUsageCreditsUsdAfterVolumeDiscount: number;
}

/**
 * @since Added in 2.9.2
 */
export interface UsageCycle {
    /**
     * @since Added in 2.9.2
     */
    startAt: Date;
    /**
     * @since Added in 2.9.2
     */
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

/**
 * @since Added in 2.9.2
 */
export interface AccountAndUsageLimits {
    /**
     * @since Added in 2.9.2
     */
    monthlyUsageCycle: MonthlyUsageCycle;
    /**
     * @since Added in 2.9.2
     */
    limits: Limits;
    /**
     * @since Added in 2.9.2
     */
    current: Current;
}

/**
 * @since Added in 2.9.2
 */
export interface MonthlyUsageCycle {
    /**
     * @since Added in 2.9.2
     */
    startAt: Date;
    /**
     * @since Added in 2.9.2
     */
    endAt: Date;
}

/**
 * @since Added in 2.9.2
 */
export interface Limits {
    /**
     * @since Added in 2.9.2
     */
    maxMonthlyUsageUsd: number;
    /**
     * @since Added in 2.9.2
     */
    maxMonthlyActorComputeUnits: number;
    /**
     * @since Added in 2.9.2
     */
    maxMonthlyExternalDataTransferGbytes: number;
    /**
     * @since Added in 2.9.2
     */
    maxMonthlyProxySerps: number;
    /**
     * @since Added in 2.9.2
     */
    maxMonthlyResidentialProxyGbytes: number;
    /**
     * @since Added in 2.9.2
     */
    maxActorMemoryGbytes: number;
    /**
     * @since Added in 2.9.2
     */
    maxActorCount: number;
    /**
     * @since Added in 2.9.2
     */
    maxActorTaskCount: number;
    /**
     * @since Added in 2.9.2
     */
    maxConcurrentActorJobs: number;
    /**
     * @since Added in 2.9.2
     */
    maxTeamAccountSeatCount: number;
    /**
     * @since Added in 2.9.2
     */
    dataRetentionDays: number;
}

/**
 * @since Added in 2.10.0
 */
export type LimitsUpdateOptions = { maxMonthlyUsageUsd: number } | { dataRetentionDays: number };

/**
 * @since Added in 2.9.2
 */
export interface Current {
    /**
     * @since Added in 2.9.2
     */
    monthlyUsageUsd: number;
    /**
     * @since Added in 2.9.2
     */
    monthlyActorComputeUnits: number;
    /**
     * @since Added in 2.9.2
     */
    monthlyExternalDataTransferGbytes: number;
    /**
     * @since Added in 2.9.2
     */
    monthlyProxySerps: number;
    /**
     * @since Added in 2.9.2
     */
    monthlyResidentialProxyGbytes: number;
    /**
     * @since Added in 2.9.2
     */
    actorMemoryGbytes: number;
    /**
     * @since Added in 2.9.2
     */
    actorCount: number;
    /**
     * @since Added in 2.9.2
     */
    actorTaskCount: number;
    /**
     * @since Added in 2.9.2
     */
    activeActorJobCount: number;
    /**
     * @since Added in 2.9.2
     */
    teamAccountSeatCount: number;
}
