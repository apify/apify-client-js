import express from 'express';
import { addRoutes } from './add_routes';

const store = express.Router();

const ROUTES = [
    { id: 'store-list', method: 'GET', path: '/' },
];

addRoutes(store, ROUTES);

module.exports = store;
