import express from 'express';

import * as fixtures from '../fixtures.js';
import { addRoutes, type MockServerRoute } from './add_routes.js';

export const runs = express.Router();

const ROUTES: MockServerRoute[] = [
    { id: 'list-runs', method: 'GET', path: '/', fixture: fixtures.runList },
    { id: 'get-run', method: 'GET', path: '/:runId', type: 'responseJsonMock', fixture: fixtures.run },
    { id: 'abort-run', method: 'POST', path: '/:runId/abort', fixture: fixtures.run },
    { id: 'metamorph-run', method: 'POST', path: '/:runId/metamorph', fixture: fixtures.run },
    { id: 'reboot-run', method: 'POST', path: '/:runId/reboot', fixture: fixtures.run },
    { id: 'resurrect-run', method: 'POST', path: '/:runId/resurrect', fixture: fixtures.run },
    { id: 'run-dataset', method: 'GET', path: '/:runId/dataset', fixture: fixtures.dataset },
    { id: 'run-keyValueStore', method: 'GET', path: '/:runId/key-value-store', fixture: fixtures.keyValueStore },
    { id: 'run-requestQueue', method: 'GET', path: '/:runId/request-queue', fixture: fixtures.requestQueue },
    { id: 'run-log', method: 'GET', path: '/:runId/log', type: 'text' },
    { id: 'run-charge', method: 'POST', path: '/:runId/charge' },
];

addRoutes(runs, ROUTES);
