const express = require('express');
const { addRoutes } = require('./add_routes');

const datasets = express.Router();

const ROUTES = [
    { id: 'get-or-create-dataset', method: 'POST', path: '/' },
    { id: 'list-datasets', method: 'GET', path: '/' },
    { id: 'get-dataset', method: 'GET', path: '/:datasetId' },
    { id: 'delete-dataset', method: 'DELETE', path: '/:datasetId' },
    { id: 'update-dataset', method: 'PUT', path: '/:datasetId' },
    { id: 'list-items', method: 'GET', path: '/:datasetId/items', type: 'responseJsonMock' },
    { id: 'push-items', method: 'POST', path: '/:datasetId/items' },
];

addRoutes(datasets, ROUTES);

module.exports = datasets;
