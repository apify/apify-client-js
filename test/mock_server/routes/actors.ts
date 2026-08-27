import express from 'express';

import * as fixtures from '../fixtures';
import { addRoutes, type MockServerRoute } from './add_routes';

export const actors = express.Router();

const ROUTES: MockServerRoute[] = [
    { id: 'list-actors', method: 'GET', path: '/', fixture: fixtures.actorList },
    { id: 'create-actor', method: 'POST', path: '/', fixture: fixtures.actor },
    { id: 'update-actor', method: 'PUT', path: '/:actorId', fixture: fixtures.actor },
    { id: 'validate-input', method: 'POST', path: '/:actorId/validate-input', type: 'responseJsonMock' },
    { id: 'delete-actor', method: 'DELETE', path: '/:actorId' },
    { id: 'get-actor', method: 'GET', path: '/:actorId', fixture: fixtures.actor },
    { id: 'list-runs', method: 'GET', path: '/:actorId/runs', fixture: fixtures.runList },
    { id: 'run-actor', method: 'POST', path: '/:actorId/runs', type: 'responseJsonMock', fixture: fixtures.run },
    { id: 'last-run-get', method: 'GET', path: '/:actorId/runs/last', fixture: fixtures.run },
    { id: 'last-run-dataset', method: 'GET', path: '/:actorId/runs/last/dataset', fixture: fixtures.dataset },
    {
        id: 'last-run-keyValueStore',
        method: 'GET',
        path: '/:actorId/runs/last/key-value-store',
        fixture: fixtures.keyValueStore,
    },
    {
        id: 'last-run-requestQueue',
        method: 'GET',
        path: '/:actorId/runs/last/request-queue',
        fixture: fixtures.requestQueue,
    },
    { id: 'last-run-log', method: 'GET', path: '/:actorId/runs/last/log', type: 'text' },
    { id: 'get-run', method: 'GET', path: '/:actorId/runs/:runId', type: 'responseJsonMock', fixture: fixtures.run },
    { id: 'abort-run', method: 'POST', path: '/:actorId/runs/:runId/abort', fixture: fixtures.run },
    { id: 'metamorph-run', method: 'POST', path: '/:actorId/runs/:runId/metamorph', fixture: fixtures.run },
    { id: 'resurrect-run', method: 'POST', path: '/:actorId/runs/:runId/resurrect', fixture: fixtures.run },
    { id: 'list-builds', method: 'GET', path: '/:actorId/builds', fixture: fixtures.buildList },
    { id: 'build-actor', method: 'POST', path: '/:actorId/builds', fixture: fixtures.build },
    {
        id: 'default-build-get',
        method: 'GET',
        path: '/:actorId/builds/default',
        type: 'responseJsonMock',
        fixture: fixtures.build,
    },
    {
        id: 'get-build',
        method: 'GET',
        path: '/:actorId/builds/:buildId',
        type: 'responseJsonMock',
        fixture: fixtures.build,
    },
    { id: 'abort-build', method: 'POST', path: '/:actorId/builds/:buildId/abort', fixture: fixtures.build },
    { id: 'list-actor-versions', method: 'GET', path: '/:actorId/versions', fixture: fixtures.versionList },
    { id: 'create-actor-version', method: 'POST', path: '/:actorId/versions', fixture: fixtures.version },
    { id: 'get-actor-version', method: 'GET', path: '/:actorId/versions/:versionNumber', fixture: fixtures.version },
    { id: 'update-actor-version', method: 'PUT', path: '/:actorId/versions/:versionNumber', fixture: fixtures.version },
    { id: 'delete-actor-version', method: 'DELETE', path: '/:actorId/versions/:versionNumber' },
    {
        id: 'list-actor-env-vars',
        method: 'GET',
        path: '/:actorId/versions/:versionNumber/env-vars',
        fixture: fixtures.envVarList,
    },
    {
        id: 'create-actor-env-var',
        method: 'POST',
        path: '/:actorId/versions/:versionNumber/env-vars',
        fixture: fixtures.envVar,
    },
    {
        id: 'get-actor-env-var',
        method: 'GET',
        path: '/:actorId/versions/:versionNumber/env-vars/:envVarName',
        fixture: fixtures.envVar,
    },
    {
        id: 'update-actor-env-var',
        method: 'PUT',
        path: '/:actorId/versions/:versionNumber/env-vars/:envVarName',
        fixture: fixtures.envVar,
    },
    { id: 'delete-actor-env-var', method: 'DELETE', path: '/:actorId/versions/:versionNumber/env-vars/:envVarName' },
    { id: 'list-webhooks', method: 'GET', path: '/:actorId/webhooks', fixture: fixtures.webhookList },
];

addRoutes(actors, ROUTES);
