import { checkParamOrThrow, pluckData, catchNotFoundOrThrow } from './utils';

export const BASE_PATH = '/v2/key-value-stores';

export default {
    getOrCreateStore: (requestPromise, { baseUrl, token, storeName }) => {
        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(storeName, 'storeName', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}`,
            json: true,
            method: 'POST',
            qs: { name: storeName, token },
        })
        .then(pluckData);
    },

    listStores: (requestPromise, { baseUrl, token, offset, limit }) => {
        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(limit, 'limit', 'Maybe Number');
        checkParamOrThrow(offset, 'offset', 'Maybe Number');

        const query = { token };

        if (limit) query.limit = limit;
        if (offset) query.offset = offset;

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}`,
            json: true,
            method: 'GET',
            qs: query,
        })
        .then(pluckData);
    },

    getStore: (requestPromise, { baseUrl, storeId }) => {
        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${storeId}`,
            json: true,
            method: 'GET',
        })
        .then(pluckData)
        .catch(catchNotFoundOrThrow);
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

    // TODO: Ensure that body is null or string or buffer
    getRecord: (requestPromise, { baseUrl, storeId, key, raw }) => {
        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(key, 'key', 'String');
        checkParamOrThrow(raw, 'raw', 'Maybe Boolean');

        const options = {
            url: `${baseUrl}${BASE_PATH}/${storeId}/records/${key}`,
            method: 'GET',
            json: !raw,
        };

        if (raw) options.qs = { raw: 1 };

        return requestPromise(options)
        .then((body) => {
            if (raw) return body;

            const data = pluckData(body);

            if (data.contentType === 'application/json') {
                data.rawBody = data.body;
                data.body = JSON.parse(data.body);
            }

            return data;
        })
        .catch(catchNotFoundOrThrow);
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

    listKeys: (requestPromise, { baseUrl, storeId, exclusiveStartKey, limit }) => {
        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(exclusiveStartKey, 'exclusiveStartKey', 'Maybe String');
        checkParamOrThrow(limit, 'limit', 'Maybe Number');

        const query = {};

        if (exclusiveStartKey) query.exclusiveStartKey = exclusiveStartKey;
        if (limit) query.limit = limit;

        const requestOpts = {
            url: `${baseUrl}${BASE_PATH}/${storeId}/keys`,
            json: true,
            method: 'GET',
            qs: query,
        };

        return requestPromise(requestOpts).then(pluckData);
    },

    listRecords: (requestPromise, { baseUrl, storeId, exclusiveStartKey, limit }) => {
        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(exclusiveStartKey, 'exclusiveStartKey', 'Maybe String');
        checkParamOrThrow(limit, 'limit', 'Maybe Number');

        const query = {};

        if (exclusiveStartKey) query.exclusiveStartKey = exclusiveStartKey;
        if (limit) query.limit = limit;

        const requestOpts = {
            url: `${baseUrl}${BASE_PATH}/${storeId}/records`,
            json: true,
            method: 'GET',
            qs: query,
        };

        return requestPromise(requestOpts).then(pluckData);
    },
};
