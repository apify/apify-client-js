import _ from 'underscore';
import { checkParamOrThrow, gzipPromise, pluckData, catchNotFoundOrThrow, decodeBody, encodeBody } from './utils';

/**
 * Key Value Store
 * @memberOf ApifyClient
 * @namespace keyValueStore
 */

export const BASE_PATH = '/v2/key-value-stores';
export const SIGNED_URL_UPLOAD_MIN_BYTESIZE = 1024 * 256;

export default {
    /**
     * @memberof ApifyClient.keyValueStore
     * @param requestPromise
     * @param options
     * @returns {Promise.<TResult>|*}
     */
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

    /**
     * @memberof ApifyClient.keyValueStore
     * @param requestPromise
     * @param options
     * @returns {Promise.<TResult>|*}
     */
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

    /**
     * @memberof ApifyClient.keyValueStore
     * @param requestPromise
     * @param options
     * @returns {Promise.<T>}
     */
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

    /**
     * @memberof ApifyClient.keyValueStore
     * @param requestPromise
     * @param options
     * @returns {*}
     */
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

    /**
     * @memberof ApifyClient.keyValueStore
     * @param requestPromise
     * @param options
     * @returns {Promise.<TResult>|*}
     */
    // TODO: Ensure that body is null or string or buffer
    getRecord: (requestPromise, options) => {
        const { baseUrl, storeId, key, raw, useRawBody, url } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(key, 'key', 'String');
        checkParamOrThrow(raw, 'raw', 'Maybe Boolean');
        checkParamOrThrow(useRawBody, 'useRawBody', 'Maybe Boolean');
        checkParamOrThrow(url, 'url', 'Maybe Boolean');

        const requestOpts = {
            url: `${baseUrl}${BASE_PATH}/${storeId}/records/${key}`,
            method: 'GET',
            json: !raw,
            qs: {},
            gzip: true,
        };

        if (raw) {
            requestOpts.encoding = null;
            requestOpts.qs.raw = 1;
        }

        const parseResponse = (response) => {
            if (raw) return response;

            const data = pluckData(response);

            if (!useRawBody) data.body = decodeBody(data.body, data.contentType);

            return data;
        };

        // Downloading via our servers:
        if (!url) return requestPromise(requestOpts).then(parseResponse, catchNotFoundOrThrow);

        // ... or via signed url directly to S3:
        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${storeId}/records/${key}/direct-download-url`,
            method: 'GET',
            json: true,
            gzip: true,
            qs: requestOpts.qs,
        })
        .then((response) => {
            const meta = _.omit(response.data, 'signedUrl');

            return requestPromise({
                method: 'GET',
                url: response.data.signedUrl,
                json: false,
                gzip: true,
            })
            .then((body) => {
                return raw ? body : { data: Object.assign({}, _.omit(meta, 'contentEncoding'), { body }) };
            })
            .then(parseResponse, catchNotFoundOrThrow);
        });
    },

    /**
     * @memberof keyValueStore
     * @param requestPromise
     * @param options
     * @returns {*}
     */
    // TODO: check that body is buffer or string
    putRecord: (requestPromise, options) => {
        const { baseUrl, storeId, key, body, contentType = 'text/plain', useRawBody } = options;
        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(storeId, 'storeId', 'String');
        checkParamOrThrow(key, 'key', 'String');
        checkParamOrThrow(contentType, 'contentType', 'String');
        checkParamOrThrow(useRawBody, 'useRawBody', 'Maybe Boolean');

        const encodedBody = useRawBody ? body : encodeBody(body, contentType);

        return gzipPromise(options.promise, encodedBody)
            .then((gzipedBody) => {
                const requestOpts = {
                    url: `${baseUrl}${BASE_PATH}/${storeId}/records/${key}`,
                    method: 'PUT',
                    body: gzipedBody,
                    json: false,
                    headers: {
                        'Content-Type': contentType,
                        'Content-Encoding': 'gzip',
                    },
                };

                // Uploading via our servers:
                if (gzipedBody.length < SIGNED_URL_UPLOAD_MIN_BYTESIZE) return requestPromise(requestOpts);

                // ... or via signed url directly to S3:
                return requestPromise({
                    url: `${baseUrl}${BASE_PATH}/${storeId}/records/${key}/direct-upload-url`,
                    method: 'GET',
                    json: true,
                    headers: {
                        'Content-Type': contentType,
                    },
                })
                .then((response) => {
                    const signedUrl = response.data.signedUrl;
                    const s3RequestOpts = Object.assign({}, requestOpts, { url: signedUrl });

                    return requestPromise(s3RequestOpts);
                });
            });
    },

    /**
     * @memberof ApifyClient.keyValueStore
     * @param requestPromise
     * @param options
     * @returns {*}
     */
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

    /**
     * @memberof ApifyClient.keyValueStore
     * @param requestPromise
     * @param options
     * @returns {Promise.<TResult>|*}
     */
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

    /**
     * @memberof ApifyClient.keyValueStore
     * @param requestPromise
     * @param options
     * @returns {Promise.<TResult>}
     */
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
            if (!useRawBody) item.body = decodeBody(item.body, item.contentType);

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
