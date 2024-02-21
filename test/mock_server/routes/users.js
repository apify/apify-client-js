const express = require('express');

const { addRoutes } = require('./add_routes');

const users = express.Router();

const ROUTES = [
    { id: 'get-user', method: 'GET', path: '/:userId' },
    { id: 'get-monthly-usage', method: 'GET', path: '/:userId/usage/monthly' },
    { id: 'get-limits', method: 'GET', path: '/:userId/limits' },
];

addRoutes(users, ROUTES);

module.exports = users;
