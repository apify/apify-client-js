import { ME_USER_NAME_PLACEHOLDER } from 'apify-shared/consts';
import { checkParamOrThrow, pluckData } from './utils';

export const BASE_PATH = '/v2/users';

export default {
    /**
     * Returns public profile of user for given user ID or username.
     * If user ID is not specified it returns info about your account.
     *
     * @memberof ApifyClient.users
     * @instance
     * @param {Object} options
     * @param {String} [options.token]
     * @param {String} [options.userId = 'me'] - User ID or username of the user
     * @param callback
     * @returns {UserInfo}<
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
