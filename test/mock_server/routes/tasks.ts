import express from 'express';

import * as fixtures from '../fixtures';
import { addRoutes, type MockServerRoute } from './add_routes';

export const tasks = express.Router();

const ROUTES: MockServerRoute[] = [
    { id: 'list-tasks', method: 'GET', path: '/', fixture: fixtures.taskList },
    { id: 'create-task', method: 'POST', path: '/', fixture: fixtures.task },
    { id: 'update-task', method: 'PUT', path: '/:taskId', fixture: fixtures.task },
    { id: 'delete-task', method: 'DELETE', path: '/:taskId' },
    { id: 'get-task', method: 'GET', path: '/:taskId', fixture: fixtures.task },
    { id: 'list-runs', method: 'GET', path: '/:taskId/runs', fixture: fixtures.runList },
    { id: 'run-task', method: 'POST', path: '/:taskId/runs', type: 'responseJsonMock', fixture: fixtures.run },
    { id: 'list-webhooks', method: 'GET', path: '/:taskId/webhooks', fixture: fixtures.webhookList },
    { id: 'get-input', method: 'GET', path: '/:taskId/input' },
    { id: 'update-input', method: 'PUT', path: '/:taskId/input' },
];

addRoutes(tasks, ROUTES);
