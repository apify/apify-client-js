import express from 'express';

import * as fixtures from '../fixtures.js';
import { addRoutes, type MockServerRoute } from './add_routes.js';

export const store = express.Router();

const ROUTES: MockServerRoute[] = [{ id: 'store-list', method: 'GET', path: '/', fixture: fixtures.storeActorList }];

addRoutes(store, ROUTES);
