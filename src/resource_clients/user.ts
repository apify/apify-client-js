import type { ApifyApiError } from '../apify_api_error.js';
import type { ApiClientSubResourceOptions } from '../base/api_client.js';
import { ResourceClient } from '../base/resource_client.js';
import type { ApifyRequestConfig } from '../http_client.js';
import type { AccountAndUsageLimits, MonthlyUsage, User } from '../models.js';
import * as schemas from '../schemas.js';
import { catchNotFoundOrThrow, parseResponse } from '../utils.js';

export type {
    AccountAndUsageLimits,
    Current,
    DailyServiceUsage,
    EffectivePlatformFeature,
    EffectivePlatformFeatures,
    Limits,
    MonthlyUsage,
    MonthlyUsageCycle,
    PriceTier,
    ProxyGroup,
    ServiceUsage,
    UsageCycle,
    UsageItem,
    User,
    UserPlan,
    UserProfile,
    UserProxy,
} from '../models.js';
export { PlatformFeature } from '../models.js';

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
        return this._get(schemas.UserPrivateInfo) as Promise<User>;
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
            // `dailyServiceUsages[].date` does not end in `At`, so it has to be named for `parseDateFields`.
            return parseResponse(response, schemas.MonthlyUsage, (key) => key === 'date');
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
            return parseResponse(response, schemas.AccountLimits);
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

/**
 * @since Added in 2.10.0
 */
export type LimitsUpdateOptions = { maxMonthlyUsageUsd: number } | { dataRetentionDays: number };
