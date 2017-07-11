import { checkParamOrThrow } from './utils';

export const BASE_PATH = '/v2/logs';

export default {
    getLog: (requestPromise, options) => {
        const { baseUrl, logId } = options;

        checkParamOrThrow(logId, 'logId', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${logId}`,
            method: 'GET',
            gzip: true,
        });
    },
};
