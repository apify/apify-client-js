import { ME_USER_NAME_PLACEHOLDER } from 'apify-shared/consts';
import { checkParamOrThrow, pluckData } from './utils';

export const BASE_PATH = '/v2/users';

export default {
    /**
     * Returns public profile of user for given user ID or username.
     *
     * @memberof ApifyClient.users
     * @instance
     * @param {Object} options
     * @param {String} options.token
     * @param {String} options.userId - User ID or username of the user
     * @param callback
     * @returns {UserInfo}
     */
    getUser: (requestPromise, options) => {
        const { baseUrl, userId } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(userId, 'userId', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${userId}`,
            json: true,
            method: 'GET',
        }).then(pluckData);
    },

    /**
     * Returns public profile and additional info for your account.
     *
     * @memberof ApifyClient.users
     * @instance
     * @param {Object} options
     * @param options.token
     * @param callback
     * @returns {UserAccountInfo}
     */
    getAccount: (requestPromise, options) => {
        const { baseUrl, token } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(token, 'token', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${ME_USER_NAME_PLACEHOLDER}`,
            json: true,
            method: 'GET',
            qs: { token },
        }).then(pluckData);
    },
};
