const express = require('express');
const { addRoutes } = require('./add_routes');

const runs = express.Router();

const ROUTES = [
    { id: 'get-run', method: 'GET', path: '/:runId', type: 'responseJsonMock' },
    { id: 'abort-run', method: 'POST', path: '/:runId/abort' },
    { id: 'metamorph-run', method: 'POST', path: '/:runId/metamorph' },
    { id: 'resurrect-run', method: 'POST', path: '/:runId/resurrect' },
];

addRoutes(runs, ROUTES);

module.exports = runs;
