const express = require('express');

const tasks = express.Router();

const ROUTES = [
    { id: 'list-tasks', method: 'GET', path: '/' },
    { id: 'create-task', method: 'POST', path: '/' },
    { id: 'update-task', method: 'PUT', path: '/:taskId' },
    { id: 'delete-task', method: 'DELETE', path: '/:taskId' },
    { id: 'get-task', method: 'GET', path: '/:taskId' },
    { id: 'list-runs', method: 'GET', path: '/:taskId/runs' },
    { id: 'run-task', method: 'POST', path: '/:taskId/runs' },
    { id: 'list-webhooks', method: 'GET', path: '/:taskId/webhooks' },
    { id: 'get-input', method: 'GET', path: '/:taskId/input' },
    { id: 'get-input', method: 'PUT', path: '/:taskId/input' },


];

const HANDLERS = {
    json(id) {
        return (req, res) => {
            const responseStatusCode = Number(req.params.taskId) || 200;
            const payload = responseStatusCode === 204
                ? null
                : { data: { id } };
            res
                .status(responseStatusCode)
                .json(payload);
        };
    },
};

function addRoutes(router, routes) {
    routes.forEach((route) => {
        const type = route.type ? route.type : 'json';
        const handler = HANDLERS[type];
        const method = route.method.toLowerCase();
        router[method](route.path, handler(route.id));
    });
}

addRoutes(tasks, ROUTES);

module.exports = tasks;
