const express = require('express');

const { addRoutes } = require('./add_routes');

const builds = express.Router();

const ROUTES = [
    { id: 'get-build', method: 'GET', path: '/:buildId', type: 'responseJsonMock' },
    { id: 'abort-build', method: 'POST', path: '/:buildId/abort' },
    { id: 'build-log', method: 'GET', path: '/:buildId/log', type: 'text' },
];

addRoutes(builds, ROUTES);

module.exports = builds;
