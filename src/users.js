import { ME_USER_NAME_PLACEHOLDER } from 'apify-shared/consts';
import { checkParamOrThrow, pluckData } from './utils';

/**
 * Users
 * @memberOf ApifyClient
 * @namespace users
 */

export const BASE_PATH = '/v2/users';

export default {
    /**
     * Returns private and public information about user account.
     *
     * @memberof ApifyClient.users
     * @instance
     * @param {Object} options
     * @param {String} [options.token] - If set, the function returns a private and public information for the user account,
     *                                   otherwise it only returns public information.
     * @param {String} [options.userId = 'me'] - Desired user ID or username. By default it is `'me'`,
     *                                           which causes the function to return information about the current user.
     * @param {function} [callback] - Callback function
     * @returns {UserInfo}
     */
    getUser: (requestPromise, options) => {
        const { baseUrl, userId = ME_USER_NAME_PLACEHOLDER, token } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(userId, 'userId', 'String');
        checkParamOrThrow(token, 'token', 'Maybe String');

        const requestOpts = {
            url: `${baseUrl}${BASE_PATH}/${userId}`,
            json: true,
            method: 'GET',
        };

        if (token) requestOpts.qs = { token };

        return requestPromise(requestOpts).then(pluckData);
    },
};
