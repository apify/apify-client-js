const express = require('express');
const { addRoutes } = require('./add_routes');

const actors = express.Router();

const ROUTES = [
    { id: 'list-actors', method: 'GET', path: '/' },
    { id: 'create-actor', method: 'POST', path: '/' },
    { id: 'update-actor', method: 'PUT', path: '/:actorId' },
    { id: 'delete-actor', method: 'DELETE', path: '/:actorId' },
    { id: 'get-actor', method: 'GET', path: '/:actorId' },
    { id: 'list-runs', method: 'GET', path: '/:actorId/runs' },
    { id: 'run-actor', method: 'POST', path: '/:actorId/runs', type: 'responseJsonMock' },
    { id: 'last-run-get', method: 'GET', path: '/:actorId/runs/last' },
    { id: 'last-run-dataset', method: 'GET', path: '/:actorId/runs/last/dataset' },
    { id: 'last-run-keyValueStore', method: 'GET', path: '/:actorId/runs/last/key-value-store' },
    { id: 'last-run-requestQueue', method: 'GET', path: '/:actorId/runs/last/request-queue' },
    { id: 'last-run-log', method: 'GET', path: '/:actorId/runs/last/log', type: 'text' },
    { id: 'get-run', method: 'GET', path: '/:actorId/runs/:runId', type: 'responseJsonMock' },
    { id: 'abort-run', method: 'POST', path: '/:actorId/runs/:runId/abort' },
    { id: 'metamorph-run', method: 'POST', path: '/:actorId/runs/:runId/metamorph' },
    { id: 'resurrect-run', method: 'POST', path: '/:actorId/runs/:runId/resurrect' },
    { id: 'list-builds', method: 'GET', path: '/:actorId/builds' },
    { id: 'build-actor', method: 'POST', path: '/:actorId/builds' },
    { id: 'get-build', method: 'GET', path: '/:actorId/builds/:buildId', type: 'responseJsonMock' },
    { id: 'abort-build', method: 'POST', path: '/:actorId/builds/:buildId/abort' },
    { id: 'list-actor-versions', method: 'GET', path: '/:actorId/versions' },
    { id: 'create-actor-version', method: 'POST', path: '/:actorId/versions' },
    { id: 'get-actor-version', method: 'GET', path: '/:actorId/versions/:versionNumber' },
    { id: 'update-actor-version', method: 'PUT', path: '/:actorId/versions/:versionNumber' },
    { id: 'delete-actor-version', method: 'DELETE', path: '/:actorId/versions/:versionNumber' },
    { id: 'list-webhooks', method: 'GET', path: '/:actorId/webhooks' },
];

addRoutes(actors, ROUTES);

module.exports = actors;
