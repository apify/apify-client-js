const express = require('express');
const { addRoutes } = require('./add_routes');

const logs = express.Router();

const ROUTES = [
    { id: 'get-log', method: 'GET', path: '/:logId', type: 'text' },
];

addRoutes(logs, ROUTES);

module.exports = logs;
