const express = require('express');
const { addRoutes } = require('./add_routes');

const external = express.Router();

const ROUTES = [
    { id: 'signed-url', method: 'PUT', path: '/signed-url/:code', type: 'responseJsonMock' },
];

addRoutes(external, ROUTES);

module.exports = external;
