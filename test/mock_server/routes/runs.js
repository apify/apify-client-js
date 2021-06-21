const express = require('express');
const { addRoutes } = require('./add_routes');

const runs = express.Router();

const ROUTES = [
    { id: 'get-run', method: 'GET', path: '/:runId', type: 'responseJsonMock' },
    { id: 'abort-run', method: 'POST', path: '/:runId/abort' },
    { id: 'metamorph-run', method: 'POST', path: '/:runId/metamorph' },
    { id: 'resurrect-run', method: 'POST', path: '/:runId/resurrect' },
    { id: 'run-dataset', method: 'GET', path: '/:runId/dataset' },
    { id: 'run-keyValueStore', method: 'GET', path: '/:runId/key-value-store' },
    { id: 'run-requestQueue', method: 'GET', path: '/:runId/request-queue' },
    { id: 'run-log', method: 'GET', path: '/:runId/log', type: 'text' },
];

addRoutes(runs, ROUTES);

module.exports = runs;
