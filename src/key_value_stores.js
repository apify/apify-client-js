import _ from 'underscore';

export const BASE_PATH = '/v2/key-value-stores';

// TODO: we should throw an error if a required parameter is missing,
//       e.g. when I had "key" instead of "recordKey", then I received RECORD_NOT_FOUND,
//       it would be more user friendly to receive Exception "Required parameter is missing"
//       (btw "key" would be better than "recordKey", considering putRecord is using
//       simple names such as "body", "contentType", ...
// TODO: if there is no record in getRecord, the function should return null (now it returns undefined)
// TODO: getRecord returns an object if body is valid JSON and content type is 'application/json',
//       it should only return string (if possible) or buffer

export default {
    getOrCreateStore: (requestPromise, options) => requestPromise({
        url: `${options.baseUrl}${BASE_PATH}`,
        json: true,
        method: 'POST',
        body: _.pick(options, 'userId', 'username', 'token', 'storeName'),
    }),

    getStore: (requestPromise, { baseUrl, storeId }) => requestPromise({
        url: `${baseUrl}${BASE_PATH}/${storeId}`,
        json: true,
        method: 'GET',
    }),

    deleteStore: (requestPromise, { baseUrl, storeId }) => requestPromise({
        url: `${baseUrl}${BASE_PATH}/${storeId}`,
        json: true,
        method: 'DELETE',
    }),

    // TODO: Ensure that body is null or body or buffer
    getRecord: (requestPromise, { baseUrl, storeId, recordKey }) => requestPromise({
        url: `${baseUrl}${BASE_PATH}/${storeId}/records/${recordKey}`,
        method: 'GET',
        json: false,
        resolveWithResponse: true,
    })
    .then(({ response, body }) => {
        const contentType = response.headers['content-type'];

        return { body, contentType };
    }),

    // TODO: check that body is buffer or string, ...
    putRecord: (requestPromise, { baseUrl, storeId, recordKey, body, contentType = 'text/plain' }) => requestPromise({
        url: `${baseUrl}${BASE_PATH}/${storeId}/records/${recordKey}`,
        method: 'PUT',
        body,
        json: false,
        headers: {
            'Content-Type': contentType,
        },
    }),

    deleteRecord: (requestPromise, { baseUrl, storeId, recordKey }) => requestPromise({
        url: `${baseUrl}${BASE_PATH}/${storeId}/records/${recordKey}`,
        json: true,
        method: 'DELETE',
    }),

    // TODO: add pagination
    getRecordsKeys: (requestPromise, options) => {
        const { baseUrl, storeId, exclusiveStartKey, count } = options;
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
