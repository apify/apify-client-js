import { ME_USER_NAME_PLACEHOLDER } from 'apify-shared/consts';
import { checkParamOrThrow, pluckData, parseDateFields } from './utils';
import Endpoint from './endpoint';

/**
 * Users
 * @memberOf ApifyClient
 * @namespace users
 */

export default class User extends Endpoint {
    constructor(httpClient) {
        super(httpClient, '/v2/users');
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
