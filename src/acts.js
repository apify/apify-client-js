import _ from 'underscore';
import { checkParamOrThrow, pluckData, catchNotFoundOrThrow } from './utils';

/**
 * Acts
 * @module apifier-client
 * @namespace acts
 */

export const BASE_PATH = '/v2/acts';

export default {
    /**
     * List of Acts
     *
     * @memberof acts
     * @param requestPromise
     * @param options
     * @returns {Promise.<TResult>|*}
     */
    listActs: (requestPromise, options) => {
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
     * @memberof acts
     * @param requestPromise
     * @param options
     * @returns {Promise.<TResult>|*}
     */
    createAct: (requestPromise, options) => {
        const { baseUrl, token, act } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(act, 'act', 'Object');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}`,
            json: true,
            method: 'POST',
            qs: { token },
            body: act,
        })
        .then(pluckData);
    },

    /**
     * @memberof acts
     * @param requestPromise
     * @param options
     * @returns {Promise.<TResult>|*}
     */
    updateAct: (requestPromise, options) => {
        const { baseUrl, token, actId, act } = options;
        const safeActId = !actId && act.id ? act.id : actId;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(safeActId, 'actId', 'String');
        checkParamOrThrow(act, 'act', 'Object');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${safeActId}`,
            json: true,
            method: 'PUT',
            qs: { token },
            body: _.omit(act, 'id'),
        })
        .then(pluckData);
    },

    /**
     * @memberof acts
     * @param requestPromise
     * @param options
     * @returns {*}
     */
    deleteAct: (requestPromise, options) => {
        const { baseUrl, token, actId } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(actId, 'actId', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${actId}`,
            json: true,
            method: 'DELETE',
            qs: { token },
        });
    },

    /**
     * @memberof acts
     * @param requestPromise
     * @param options
     * @returns {Promise.<T>}
     */
    getAct: (requestPromise, options) => {
        const { baseUrl, token, actId } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(actId, 'actId', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${actId}`,
            json: true,
            method: 'GET',
            qs: { token },
        })
        .then(pluckData)
        .catch(catchNotFoundOrThrow);
    },

    /**
     * @memberof acts
     * @param requestPromise
     * @param options
     * @returns {Promise.<TResult>|*}
     */
    listRuns: (requestPromise, options) => {
        const { baseUrl, token, actId, offset, limit } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(limit, 'limit', 'Maybe Number');
        checkParamOrThrow(offset, 'offset', 'Maybe Number');

        const query = { token };

        if (limit) query.limit = limit;
        if (offset) query.offset = offset;

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${actId}/runs`,
            json: true,
            method: 'GET',
            qs: query,
        })
        .then(pluckData);
    },

    /**
     * @memberof acts
     * @param requestPromise
     * @param options
     * @returns {Promise.<TResult>|*}
     */
    runAct: (requestPromise, options) => {
        const { baseUrl, token, actId, contentType, body } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(contentType, 'contentType', 'Maybe String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${actId}/runs`,
            json: true,
            method: 'POST',
            qs: { token },
            headers: {
                'Content-Type': contentType,
            },
            body,
        })
        .then(pluckData);
    },

    /**
     * @memberof acts
     * @param requestPromise
     * @param options
     * @returns {Promise.<T>}
     */
    getRun: (requestPromise, options) => {
        const { baseUrl, token, actId, runId } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(runId, 'runId', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${actId}/runs/${runId}`,
            json: true,
            method: 'GET',
            qs: { token },
        })
        .then(pluckData)
        .catch(catchNotFoundOrThrow);
    },

    /**
     * @memberof acts
     * @param requestPromise
     * @param options
     * @returns {Promise.<TResult>|*}
     */
    listBuilds: (requestPromise, options) => {
        const { baseUrl, token, actId, offset, limit } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(limit, 'limit', 'Maybe Number');
        checkParamOrThrow(offset, 'offset', 'Maybe Number');

        const query = { token };

        if (limit) query.limit = limit;
        if (offset) query.offset = offset;

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${actId}/builds`,
            json: true,
            method: 'GET',
            qs: query,
        })
        .then(pluckData);
    },

    /**
     * @memberof acts
     * @param requestPromise
     * @param options
     * @returns {Promise.<TResult>|*}
     */
    buildAct: (requestPromise, options) => {
        const { baseUrl, token, actId } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(actId, 'actId', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${actId}/builds`,
            json: true,
            method: 'POST',
            qs: { token },
        })
        .then(pluckData);
    },

    /**
     * @memberof acts
     * @param requestPromise
     * @param options
     * @returns {Promise.<T>}
     */
    getBuild: (requestPromise, options) => {
        const { baseUrl, token, actId, buildId } = options;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(buildId, 'buildId', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${actId}/builds/${buildId}`,
            json: true,
            method: 'GET',
            qs: { token },
        })
        .then(pluckData)
        .catch(catchNotFoundOrThrow);
    },

};
