import { checkParamOrThrow } from './utils';
import { NOT_FOUND_STATUS_CODE } from './apify_error';

export const BASE_PATH = '/v2/key-value-stores';

export default {
    getOrCreateStore: (requestPromise, options) => {
        const { baseUrl, userId, username, token, storeName } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(storeName, 'storeName', 'String');
        checkParamOrThrow(userId || username, null, 'String', 'One of parameters "userId" and "username" of type String must be provided.');

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
        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${storeId}`,
            json: true,
            method: 'GET',
        });
    },

    deleteStore: (requestPromise, { baseUrl, storeId }) => {
        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${storeId}`,
            json: true,
            method: 'DELETE',
        });
    },

    // TODO: Ensure that body is null or body or buffer
    getRecord: (requestPromise, { baseUrl, storeId, key }) => {
        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(key, 'key', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${storeId}/records/${key}`,
            method: 'GET',
            json: false,
            resolveWithResponse: true,
        })
        .then(({ body, headers }) => {
            const contentType = headers['content-type'];

            return { body, contentType };
        })
        .catch((err) => {
            if (err.details.statusCode === NOT_FOUND_STATUS_CODE) return null;

            throw err;
        });
    },

    // TODO: check that body is buffer or string, ...
    putRecord: (requestPromise, { baseUrl, storeId, key, body, contentType = 'text/plain' }) => {
        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(key, 'key', 'String');
        checkParamOrThrow(contentType, 'contentType', 'String');

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
        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(key, 'key', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${storeId}/records/${key}`,
            json: true,
            method: 'DELETE',
        });
    },

    // TODO: add pagination
    getRecordsKeys: (requestPromise, { baseUrl, storeId, exclusiveStartKey, count }) => {
        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(exclusiveStartKey, 'exclusiveStartKey', 'Maybe String');
        checkParamOrThrow(count, 'count', 'Maybe Number');

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
