import _ from 'underscore';
import { checkParamOrThrow, pluckData, catchNotFoundOrThrow } from './utils';

export const BASE_PATH = '/v2/acts';

export default {
    listActs: (requestPromise, { baseUrl, token, offset, limit }) => {
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

    createAct: (requestPromise, { baseUrl, token, act }) => {
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

    updateAct: (requestPromise, { baseUrl, token, actId, act }) => {
        if (!actId && act.id) actId = act.id;

        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(token, 'token', 'String');
        checkParamOrThrow(actId, 'actId', 'String');
        checkParamOrThrow(act, 'act', 'Object');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${actId}`,
            json: true,
            method: 'PUT',
            qs: { token },
            body: _.omit(act, 'id'),
        })
        .then(pluckData);
    },

    deleteAct: (requestPromise, { baseUrl, token, actId }) => {
        checkParamOrThrow(baseUrl, 'baseUrl', 'String');
        checkParamOrThrow(actId, 'actId', 'String');

        return requestPromise({
            url: `${baseUrl}${BASE_PATH}/${actId}`,
            json: true,
            method: 'DELETE',
            qs: { token },
        });
    },

    getAct: (requestPromise, { baseUrl, token, actId }) => {
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

    listRuns: (requestPromise, { baseUrl, token, actId, offset, limit }) => {
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

    runAct: (requestPromise, { baseUrl, token, actId, contentType, body }) => {
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

    getRun: (requestPromise, { baseUrl, token, actId, runId }) => {
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

    listBuilds: (requestPromise, { baseUrl, token, actId, offset, limit }) => {
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

    buildAct: (requestPromise, { baseUrl, token, actId }) => {
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

    getBuild: (requestPromise, { baseUrl, token, actId, buildId }) => {
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
