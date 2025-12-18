import express from 'express';

import { addRoutes } from './add_routes';

export const logs = express.Router();

const ROUTES = [{ id: 'get-log', method: 'GET', path: '/:logId', type: 'text' }];

addRoutes(logs, ROUTES);

