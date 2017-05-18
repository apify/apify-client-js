import _ from 'underscore';

export const BASE_PATH = '/v1';

export default {
    listCrawlers: (requestPromise, options) => {
        if (!options.userId) {
            throw new Error('Missing required parameter: userId');
        }
        if (!options.token) {
            throw new Error('Missing required parameter: token');
        }

        return requestPromise({
            url: `${options.baseUrl}${BASE_PATH}/${options.userId}/crawlers?token=${options.token}`,
            json: true,
            method: 'GET',
        });
    },
};
