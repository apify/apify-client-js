import _ from 'underscore';
import { objectToQueryString } from './utils';

export const BASE_PATH = '/v2/key-value-stores';

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

    // TODO: return proper content types, the return value should be null if record not available
    // TODO: On error, this function (and all others) must throw,
    //       now it only returns e.g. { type: 'RECORD_NOT_FOUND', message: 'Store was not found.' }
    // TODO: also, we should throw an error if a required parameter is missing,
    //       e.g. when I had "key" instead of "recordKey", then I received RECORD_NOT_FOUND,
    //       it would be more user friendly to receive Exception "Required parameter is missing"
    //       (btw "key" would be better than "recordKey", considering putRecord is using
    //       simple names such as "body", "contentType", ...
    // TODO: if there is no such record, the function should return null (now it returns undefined)
    getRecord: (requestPromise, { baseUrl, storeId, recordKey }) => requestPromise({
        url: `${baseUrl}${BASE_PATH}/${storeId}/records/${recordKey}`,
        json: true,
        method: 'GET',
    })
    .then(body => ({ body, contentType: 'text/plain' })),

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
