import express from 'express';

import { addRoutes } from './add_routes';

export const webhookDispatches = express.Router();

const ROUTES = [
    { id: 'list-dispatches', method: 'GET', path: '/' },
    { id: 'get-dispatch', method: 'GET', path: '/:webhookDispatchId' },
];

addRoutes(webhookDispatches, ROUTES);

