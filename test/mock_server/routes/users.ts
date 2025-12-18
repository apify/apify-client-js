import express from 'express';

import { addRoutes } from './add_routes';

export const users = express.Router();

const ROUTES = [
    { id: 'get-user', method: 'GET', path: '/:userId' },
    { id: 'get-monthly-usage', method: 'GET', path: '/:userId/usage/monthly' },
    { id: 'get-limits', method: 'GET', path: '/:userId/limits' },
    { id: 'update-limits', method: 'PUT', path: '/:userId/limits' },
];

addRoutes(users, ROUTES);

