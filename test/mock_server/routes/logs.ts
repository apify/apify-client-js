import express from 'express';

import { addRoutes, type MockServerRoute } from './add_routes';

export const logRouter = express.Router();

const ROUTES: MockServerRoute[] = [{ id: 'get-log', method: 'GET', path: '/:logId', type: 'text' }];

addRoutes(logRouter, ROUTES);
