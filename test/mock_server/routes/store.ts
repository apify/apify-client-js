import express from 'express';

import * as fixtures from '../fixtures';
import { addRoutes, type MockServerRoute } from './add_routes';

export const store = express.Router();

const ROUTES: MockServerRoute[] = [{ id: 'store-list', method: 'GET', path: '/', fixture: fixtures.storeActorList }];

addRoutes(store, ROUTES);
