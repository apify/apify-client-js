import { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';

/**
 * @hideconstructor
 */
export class UserClient extends ResourceClient {
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
}

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
