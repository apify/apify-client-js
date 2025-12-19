import express from 'express';

import { addRoutes, type MockServerRoute } from './add_routes';

export const runRouter = express.Router();

const ROUTES: MockServerRoute[] = [
    { id: 'list-runs', method: 'GET', path: '/' },
    { id: 'get-run', method: 'GET', path: '/:runId', type: 'responseJsonMock' },
    { id: 'abort-run', method: 'POST', path: '/:runId/abort' },
    { id: 'metamorph-run', method: 'POST', path: '/:runId/metamorph' },
    { id: 'reboot-run', method: 'POST', path: '/:runId/reboot' },
    { id: 'resurrect-run', method: 'POST', path: '/:runId/resurrect' },
    { id: 'run-dataset', method: 'GET', path: '/:runId/dataset' },
    { id: 'run-keyValueStore', method: 'GET', path: '/:runId/key-value-store' },
    { id: 'run-requestQueue', method: 'GET', path: '/:runId/request-queue' },
    { id: 'run-log', method: 'GET', path: '/:runId/log', type: 'text' },
    { id: 'run-charge', method: 'POST', path: '/:runId/charge' },
];

addRoutes(runRouter, ROUTES);

