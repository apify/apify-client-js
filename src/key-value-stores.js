import _ from 'underscore';
import { objectToQueryString } from './utils';

export const BASE_PATH = '/v2/key-value-stores';

const methods = {
    getOrCreateStore: (options, rp) => rp({
        url: `${options.baseUrl}${BASE_PATH}`,
        json: true,
        method: 'POST',
        body: _.pick(options, 'userId', 'username', 'token', 'storeName'),
    }),

    getStore: ({ baseUrl, storeId }, rp) => rp({
        url: `${baseUrl}${BASE_PATH}/${storeId}`,
        json: true,
        method: 'GET',
    }),

    deleteStore: ({ baseUrl, storeId }, rp) => rp({
        url: `${baseUrl}${BASE_PATH}/${storeId}`,
        json: true,
        method: 'DELETE',
    }),

    getRecord: ({ baseUrl, storeId, recordKey }, rp) => rp({
        url: `${baseUrl}${BASE_PATH}/${storeId}/records/${recordKey}`,
        json: true,
        method: 'GET',
    }),

    putRecord: ({ baseUrl, storeId, recordKey, body, contentType }, rp) => rp({
        url: `${baseUrl}${BASE_PATH}/${storeId}/records/${recordKey}`,
        json: true,
        method: 'PUT',
        body,
        headers: {
            'Content-Type': contentType,
        },
    }),

    deleteRecord: ({ baseUrl, storeId, recordKey }, rp) => rp({
        url: `${baseUrl}${BASE_PATH}/${storeId}/records/${recordKey}`,
        json: true,
        method: 'DELETE',
    }),

    // TODO: add pagination
    getRecordsKeys: ({ baseUrl, storeId, exclusiveStartKey, count }, rp) => rp({
        url: `${baseUrl}${BASE_PATH}/${storeId}/records${objectToQueryString({ exclusiveStartKey, count })}`,
        json: true,
        method: 'GET',
    }),
};

export default methods;
