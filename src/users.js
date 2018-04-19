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
     * @param {String} [options.token] - If is set, it shows private and public information about user account, otherwise only public.
     * @param {String} [options.userId = 'me'] - User ID or username of the user,
     *                                          if not set it returns information about current user account.
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
