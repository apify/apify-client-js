const express = require('express');
const { addRoutes } = require('./add_routes');

const keyValueStores = express.Router();

const ROUTES = [
    { id: 'list-stores', method: 'GET', path: '/' },
    { id: 'get-or-create-store', method: 'POST', path: '/' },
    { id: 'get-store', method: 'GET', path: '/:storeId' },
    { id: 'delete-store', method: 'DELETE', path: '/:storeId' },
    { id: 'update-store', method: 'PUT', path: '/:storeId' },
    { id: 'get-record', method: 'GET', path: '/:storeId/records/:key', type: 'responseJsonMock' },
    { id: 'put-record', method: 'PUT', path: '/:storeId/records/:key' },
    { id: 'direct-upload-url', method: 'GET', path: '/:storeId/records/:key/direct-upload-url', type: 'responseJsonMock' },
    { id: 'delete-record', method: 'DELETE', path: '/:storeId/records/:key' },
    { id: 'list-keys', method: 'GET', path: '/:storeId/keys' },
];

addRoutes(keyValueStores, ROUTES);

module.exports = keyValueStores;
