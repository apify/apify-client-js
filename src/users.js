import { ME_USER_NAME_PLACEHOLDER } from 'apify-shared/consts';
import { checkParamOrThrow, pluckData, parseDateFields } from './utils';

/**
 * Users
 * @memberOf ApifyClient
 * @namespace users
 */

export default class User {
    constructor(httpClient) {
        this.basePath = '/v2/users';
        this.client = httpClient;
    }

    _call(userOptions, endpointOptions) {
        const callOptions = this._getCallOptions(userOptions, endpointOptions);
        return this.client.call(callOptions);
    }

    _getCallOptions(userOptions, endpointOptions) {
        const { baseUrl, token } = userOptions;
        const callOptions = {
            basePath: this.basePath,
            json: true,
            ...endpointOptions,
        };
        if (baseUrl) callOptions.baseUrl = baseUrl;
        if (token) callOptions.token = token;
        return callOptions;
    }

    /**
     * Returns private and public information about user account.
     *
     * @memberof ApifyClient.users
     * @instance
     * @param {Object} options
     * @param {String} [options.userId = 'me'] - Desired user ID or username. By default it is `'me'`,
     *                                           which causes the function to return information about the current user.
     * @returns {UserInfo}
     */
    async getUser(options = {}) {
        const { userId = ME_USER_NAME_PLACEHOLDER } = options;

        checkParamOrThrow(userId, 'userId', 'String');

        const endpointOptions = {
            url: `/${userId}`,
            method: 'GET',
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }
}
