import express from 'express';

import { addRoutes, type MockServerRoute } from './add_routes';

export const builds = express.Router();

const ROUTES: MockServerRoute[] = [
    { id: 'list-builds', method: 'GET', path: '/' },
    { id: 'get-build', method: 'GET', path: '/:buildId', type: 'responseJsonMock' },
    { id: 'abort-build', method: 'POST', path: '/:buildId/abort' },
    { id: 'build-log', method: 'GET', path: '/:buildId/log', type: 'text' },
    { id: 'build-openapi', method: 'GET', path: '/:buildId/openapi.json', type: 'responseJsonMock' },
];

addRoutes(builds, ROUTES);
