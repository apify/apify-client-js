import express from 'express';

import { addRoutes, type MockServerRoute } from './add_routes';

export const schedules = express.Router();

const ROUTES: MockServerRoute[] = [
    { id: 'create-schedule', method: 'POST', path: '/' },
    { id: 'list-schedules', method: 'GET', path: '/' },
    { id: 'get-schedule', method: 'GET', path: '/:scheduleId' },
    { id: 'update-schedule', method: 'PUT', path: '/:scheduleId' },
    { id: 'delete-schedule', method: 'DELETE', path: '/:scheduleId' },
    { id: 'get-log', method: 'GET', path: '/:scheduleId/log' },
];

addRoutes(schedules, ROUTES);
