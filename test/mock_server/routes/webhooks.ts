import express from 'express';

import * as fixtures from '../fixtures';
import { addRoutes, type MockServerRoute } from './add_routes';

export const webhooks = express.Router();

const ROUTES: MockServerRoute[] = [
    { id: 'create-webhook', method: 'POST', path: '/', fixture: fixtures.webhook },
    { id: 'list-webhooks', method: 'GET', path: '/', fixture: fixtures.webhookList },
    { id: 'get-webhook', method: 'GET', path: '/:webhookId', fixture: fixtures.webhook },
    { id: 'update-webhook', method: 'PUT', path: '/:webhookId', fixture: fixtures.webhook },
    { id: 'delete-webhook', method: 'DELETE', path: '/:webhookId' },
    { id: 'test-webhook', method: 'POST', path: '/:webhookId/test', fixture: fixtures.webhookDispatch },
    { id: 'list-dispatches', method: 'GET', path: '/:webhookId/dispatches', fixture: fixtures.webhookDispatchList },
];

addRoutes(webhooks, ROUTES);
