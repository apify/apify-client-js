import express from 'express';

import { addRoutes, type MockServerRoute } from './add_routes';

export const webhookDispatches = express.Router();

const ROUTES: MockServerRoute[] = [
    { id: 'list-dispatches', method: 'GET', path: '/' },
    { id: 'get-dispatch', method: 'GET', path: '/:webhookDispatchId' },
];

addRoutes(webhookDispatches, ROUTES);
