import type { ApifyApiError } from '../apify_api_error';
import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import type { ApifyRequestConfig } from '../http_client';
import type { AccountAndUsageLimits, MonthlyUsage, User } from '../models';
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
     * @see https://docs.apify.com/api/v2/users-me-usage-monthly-get
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
} from '../models';
export { PlatformFeature } from '../models';

export type LimitsUpdateOptions = { maxMonthlyUsageUsd: number } | { dataRetentionDays: number };
