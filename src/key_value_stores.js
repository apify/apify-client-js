import { checkParamOrThrow, pluckData, catchNotFoundOrThrow } from './utils';

export const BASE_PATH = '/v2/key-value-stores';
export const CONTENT_TYPE_JSON = 'application/json';

const parseBody = (body, contentType) => {
    switch (contentType) {
        case CONTENT_TYPE_JSON: return JSON.parse(body);
        default: return body;
    }
};

const encodeBody = (body, contentType) => {
    switch (contentType) {
        case CONTENT_TYPE_JSON: return JSON.stringify(body);
        default: return body;
    }
};

export default {
    getOrCreateStore: (requestPromise, options) => {
        const { baseUrl, token, storeName } = options;

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

    listStores: (requestPromise, options) => {
        const { baseUrl, token, offset, limit } = options;

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

    getStore: (requestPromise, options) => {
        const { baseUrl, storeId } = options;

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

    deleteStore: (requestPromise, options) => {
        const { baseUrl, storeId } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${storeId}`,
            json: true,
            method: 'DELETE',
        });
    },

    // TODO: Ensure that body is null or string or buffer
    getRecord: (requestPromise, options) => {
        const { baseUrl, storeId, key, raw, useRawBody } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(key, 'key', 'String');
        checkParamOrThrow(raw, 'raw', 'Maybe Boolean');
        checkParamOrThrow(useRawBody, 'useRawBody', 'Maybe Boolean');

        const requestOpts = {
            url: `${baseUrl}${BASE_PATH}/${storeId}/records/${key}`,
            method: 'GET',
            json: !raw,
        };

        if (raw) requestOpts.qs = { raw: 1 };

        return requestPromise(requestOpts)
            .then((body) => {
                if (raw) return body;

                const data = pluckData(body);

                if (!useRawBody) data.body = parseBody(data.body, data.contentType);

                return data;
            }, catchNotFoundOrThrow);
    },

    // TODO: check that body is buffer or string, ...
    putRecord: (requestPromise, options) => {
        const { baseUrl, storeId, key, body, contentType = 'text/plain', useRawBody } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(key, 'key', 'String');
        checkParamOrThrow(contentType, 'contentType', 'String');
        checkParamOrThrow(useRawBody, 'useRawBody', 'Maybe Boolean');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${storeId}/records/${key}`,
            method: 'PUT',
            body: useRawBody ? body : encodeBody(body, contentType),
            json: false,
            headers: {
                'Content-Type': contentType,
            },
        });
    },

    deleteRecord: (requestPromise, options) => {
        const { baseUrl, storeId, key } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(key, 'key', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${storeId}/records/${key}`,
            json: true,
            method: 'DELETE',
        });
    },

    listKeys: (requestPromise, options) => {
        const { baseUrl, storeId, exclusiveStartKey, limit } = options;

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

    listRecords: (requestPromise, options) => {
        const { baseUrl, storeId, exclusiveStartKey, limit, useRawBody } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(exclusiveStartKey, 'exclusiveStartKey', 'Maybe String');
        checkParamOrThrow(limit, 'limit', 'Maybe Number');
        checkParamOrThrow(useRawBody, 'useRawBody', 'Maybe Boolean');

        const query = {};

        if (exclusiveStartKey) query.exclusiveStartKey = exclusiveStartKey;
        if (limit) query.limit = limit;

        const requestOpts = {
            url: `${baseUrl}${BASE_PATH}/${storeId}/records`,
            json: true,
            method: 'GET',
            qs: query,
        };

        const transformItem = (item) => {
            if (!useRawBody) item.body = parseBody(item.body, item.contentType);

            return item;
        };

        return requestPromise(requestOpts)
            .then(pluckData)
            .then((data) => {
                data.items = data.items.map(transformItem);

                return data;
            });
    },
};
