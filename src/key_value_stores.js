import { checkParamOrThrow } from './utils';
import { NOT_FOUND_STATUS_CODE } from './apify_error';

export const BASE_PATH = '/v2/key-value-stores';

export default {
    getOrCreateStore: (requestPromise, options) => {
        const { baseUrl, userId, username, token, storeName } = options;

        checkParamOrThrow('String', baseUrl, 'baseUrl');
        checkParamOrThrow('String', token, 'token');
        checkParamOrThrow('String', storeName, 'storeName');
        checkParamOrThrow('String', userId || username, null, 'One of parameters "userId" and "username" of type String must be provided.');

        const body = { token, storeName };

        if (userId) body.userId = userId;
        if (username) body.username = username;

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}`,
            json: true,
            method: 'POST',
            body,
        });
    },

    getStore: (requestPromise, { baseUrl, storeId }) => {
        checkParamOrThrow('String', baseUrl, 'baseUrl');
        checkParamOrThrow('String', storeId, 'storeId');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${storeId}`,
            json: true,
            method: 'GET',
        });
    },

    deleteStore: (requestPromise, { baseUrl, storeId }) => {
        checkParamOrThrow('String', baseUrl, 'baseUrl');
        checkParamOrThrow('String', storeId, 'storeId');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${storeId}`,
            json: true,
            method: 'DELETE',
        });
    },

    // TODO: Ensure that body is null or body or buffer
    getRecord: (requestPromise, { baseUrl, storeId, key }) => {
        checkParamOrThrow('String', baseUrl, 'baseUrl');
        checkParamOrThrow('String', storeId, 'storeId');
        checkParamOrThrow('String', key, 'key');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${storeId}/records/${key}`,
            method: 'GET',
            json: false,
            resolveWithResponse: true,
        })
        .then(({ response, body }) => {
            const contentType = response.headers['content-type'];

            return { body, contentType };
        })
        .catch((err) => {
            if (err.details.statusCode === NOT_FOUND_STATUS_CODE) return null;

            throw err;
        });
    },

    // TODO: check that body is buffer or string, ...
    putRecord: (requestPromise, { baseUrl, storeId, key, body, contentType = 'text/plain' }) => {
        checkParamOrThrow('String', baseUrl, 'baseUrl');
        checkParamOrThrow('String', storeId, 'storeId');
        checkParamOrThrow('String', key, 'key');
        checkParamOrThrow('String', contentType, 'contentType');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${storeId}/records/${key}`,
            method: 'PUT',
            body,
            json: false,
            headers: {
                'Content-Type': contentType,
            },
        });
    },

    deleteRecord: (requestPromise, { baseUrl, storeId, key }) => {
        checkParamOrThrow('String', baseUrl, 'baseUrl');
        checkParamOrThrow('String', storeId, 'storeId');
        checkParamOrThrow('String', key, 'key');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${storeId}/records/${key}`,
            json: true,
            method: 'DELETE',
        });
    },

    // TODO: add pagination
    getRecordsKeys: (requestPromise, { baseUrl, storeId, exclusiveStartKey, count }) => {
        checkParamOrThrow('String', baseUrl, 'baseUrl');
        checkParamOrThrow('String', storeId, 'storeId');
        checkParamOrThrow('Maybe String', exclusiveStartKey, 'exclusiveStartKey');
        checkParamOrThrow('Maybe Number', count, 'count');

        const query = {};

        if (exclusiveStartKey) query.exclusiveStartKey = exclusiveStartKey;
        if (count) query.count = count;

        const requestOpts = {
            url: `${baseUrl}${BASE_PATH}/${storeId}/records`,
            json: true,
            method: 'GET',
            qs: query,
        };

        return requestPromise(requestOpts).then(items => ({ items }));
    },
};
