const express = require('express');

const { addRoutes } = require('./add_routes');

const tasks = express.Router();

const ROUTES = [
    { id: 'list-tasks', method: 'GET', path: '/' },
    { id: 'create-task', method: 'POST', path: '/' },
    { id: 'update-task', method: 'PUT', path: '/:taskId' },
    { id: 'delete-task', method: 'DELETE', path: '/:taskId' },
    { id: 'get-task', method: 'GET', path: '/:taskId' },
    { id: 'list-runs', method: 'GET', path: '/:taskId/runs' },
    { id: 'run-task', method: 'POST', path: '/:taskId/runs', type: 'responseJsonMock' },
    { id: 'list-webhooks', method: 'GET', path: '/:taskId/webhooks' },
    { id: 'get-input', method: 'GET', path: '/:taskId/input' },
    { id: 'update-input', method: 'PUT', path: '/:taskId/input' },
];

addRoutes(tasks, ROUTES);

module.exports = tasks;
