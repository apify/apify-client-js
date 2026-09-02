import express from 'express';

import * as fixtures from '../fixtures.js';
import { addRoutes, type MockServerRoute } from './add_routes.js';

export const schedules = express.Router();

const ROUTES: MockServerRoute[] = [
    { id: 'create-schedule', method: 'POST', path: '/', fixture: fixtures.schedule },
    { id: 'list-schedules', method: 'GET', path: '/', fixture: fixtures.scheduleList },
    { id: 'get-schedule', method: 'GET', path: '/:scheduleId', fixture: fixtures.schedule },
    { id: 'update-schedule', method: 'PUT', path: '/:scheduleId', fixture: fixtures.schedule },
    { id: 'delete-schedule', method: 'DELETE', path: '/:scheduleId' },
    { id: 'get-log', method: 'GET', path: '/:scheduleId/log', fixture: [fixtures.scheduleInvoked] },
];

addRoutes(schedules, ROUTES);
