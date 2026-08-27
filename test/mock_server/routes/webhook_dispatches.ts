import express from 'express';

import * as fixtures from '../fixtures';
import { addRoutes, type MockServerRoute } from './add_routes';

export const webhookDispatches = express.Router();

const ROUTES: MockServerRoute[] = [
    { id: 'list-dispatches', method: 'GET', path: '/', fixture: fixtures.webhookDispatchList },
    { id: 'get-dispatch', method: 'GET', path: '/:webhookDispatchId', fixture: fixtures.webhookDispatch },
];

addRoutes(webhookDispatches, ROUTES);
