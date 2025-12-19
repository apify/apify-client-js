import express from 'express';

import { addRoutes, type MockServerRoute } from './add_routes';

export const userRouter = express.Router();

const ROUTES: MockServerRoute[] = [
    { id: 'get-user', method: 'GET', path: '/:userId' },
    { id: 'get-monthly-usage', method: 'GET', path: '/:userId/usage/monthly' },
    { id: 'get-limits', method: 'GET', path: '/:userId/limits' },
    { id: 'update-limits', method: 'PUT', path: '/:userId/limits' },
];

addRoutes(userRouter, ROUTES);

