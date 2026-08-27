import express from 'express';

import * as fixtures from '../fixtures';
import { addRoutes, type MockServerRoute } from './add_routes';

export const users = express.Router();

const ROUTES: MockServerRoute[] = [
    { id: 'get-user', method: 'GET', path: '/:userId', fixture: fixtures.user },
    {
        id: 'get-monthly-usage',
        method: 'GET',
        path: '/:userId/usage/monthly',
        type: 'responseJsonMock',
        fixture: fixtures.monthlyUsage,
    },
    { id: 'get-limits', method: 'GET', path: '/:userId/limits', fixture: fixtures.accountLimits },
    { id: 'update-limits', method: 'PUT', path: '/:userId/limits' },
];

addRoutes(users, ROUTES);
