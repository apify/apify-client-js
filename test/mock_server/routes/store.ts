import express from 'express';

import { addRoutes, type MockServerRoute } from './add_routes';

export const store = express.Router();

const ROUTES: MockServerRoute[] = [{ id: 'store-list', method: 'GET', path: '/' }];

addRoutes(store, ROUTES);
