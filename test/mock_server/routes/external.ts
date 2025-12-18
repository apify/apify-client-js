import express from 'express';

import { addRoutes } from './add_routes';

export const external = express.Router();

const ROUTES = [{ id: 'signed-url', method: 'PUT', path: '/signed-url/:code', type: 'responseJsonMock' }];

addRoutes(external, ROUTES);

