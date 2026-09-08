import express from 'express';

import * as fixtures from '../fixtures.js';
import { addRoutes, type MockServerRoute } from './add_routes.js';

export const builds = express.Router();

const ROUTES: MockServerRoute[] = [
    { id: 'list-builds', method: 'GET', path: '/', fixture: fixtures.buildList },
    { id: 'get-build', method: 'GET', path: '/:buildId', type: 'responseJsonMock', fixture: fixtures.build },
    { id: 'abort-build', method: 'POST', path: '/:buildId/abort', fixture: fixtures.build },
    { id: 'build-log', method: 'GET', path: '/:buildId/log', type: 'text' },
    { id: 'build-openapi', method: 'GET', path: '/:buildId/openapi.json', type: 'responseJsonMock' },
];

addRoutes(builds, ROUTES);
