const express = require('express');
const { addRoutes } = require('./add_routes');

const users = express.Router();

const ROUTES = [
    { id: 'get-user', method: 'GET', path: '/:userId' },

];

addRoutes(users, ROUTES);

module.exports = users;
