const express = require('express');

const { addRoutes } = require('./add_routes');

const builds = express.Router();

const ROUTES = [
    { id: 'list-builds', method: 'GET', path: '/' },
    { id: 'get-build', method: 'GET', path: '/:buildId', type: 'responseJsonMock' },
    { id: 'abort-build', method: 'POST', path: '/:buildId/abort' },
    { id: 'build-log', method: 'GET', path: '/:buildId/log', type: 'text' },
    { id: 'build-openapi-specification', method: 'GET', path: '/:buildId/openapi-specification', type: 'responseJsonMock' },
];

addRoutes(builds, ROUTES);

module.exports = builds;
