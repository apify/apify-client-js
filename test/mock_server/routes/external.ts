import express from 'express';

import { addRoutes, type MockServerRoute } from './add_routes';

export const external = express.Router();

const ROUTES: MockServerRoute[] = [
    { id: 'signed-url', method: 'PUT', path: '/signed-url/:code', type: 'responseJsonMock' },
];

addRoutes(external, ROUTES);
