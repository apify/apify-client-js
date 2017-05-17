import _ from 'underscore';
import { objectToQueryString } from './utils';

export const BASE_PATH = '/v2/key-value-stores';

// TODO: we should throw an error if a required parameter is missing,
//       e.g. when I had "key" instead of "recordKey", then I received RECORD_NOT_FOUND,
//       it would be more user friendly to receive Exception "Required parameter is missing"
//       (btw "key" would be better than "recordKey", considering putRecord is using
//       simple names such as "body", "contentType", ...

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

    getRecord: (requestPromise, { baseUrl, storeId, recordKey }) => requestPromise({
        url: `${baseUrl}${BASE_PATH}/${storeId}/records/${recordKey}`,
        json: true,
        method: 'GET',
    }, true)
    .then(({ response, body }) => {
        const contentType = response.headers['content-type'];

        return { body, contentType };
    }),

    putRecord: (requestPromise, { baseUrl, storeId, recordKey, body, contentType }) => requestPromise({
        url: `${baseUrl}${BASE_PATH}/${storeId}/records/${recordKey}`,
        json: true,
        method: 'PUT',
        body,
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
        const queryString = objectToQueryString({ exclusiveStartKey, count });
        const requestOpts = {
            url: `${baseUrl}${BASE_PATH}/${storeId}/records${queryString}`,
            json: true,
            method: 'GET',
        };

        return requestPromise(requestOpts).then(items => ({ items }));
    },
};
