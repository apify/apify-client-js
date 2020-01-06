const express = require('express');

const requestQueues = express.Router();

const ROUTES = [
    { id: 'get-or-create-request-queue', method: 'POST', path: '/' },
    { id: 'list-queues', method: 'GET', path: '/' },
    { id: 'get-queue', method: 'GET', path: '/:queueId' },
    { id: 'delete-queue', method: 'DELETE', path: '/:queueId' },
    { id: 'add-request', method: 'POST', path: '/:queueId/requests/' },
    { id: 'get-request', method: 'GET', path: '/:queueId/requests/:requestId' },
    { id: 'delete-request', method: 'DELETE', path: '/:queueId/requests/:requestId' },
    { id: 'update-request', method: 'PUT', path: '/:queueId/requests/:requestId' },
    { id: 'get-head', method: 'GET', path: '/:queueId/head' },


];

const HANDLERS = {
    json(id) {
        return (req, res) => {
            const responseStatusCode = Number(req.params.queueId) || 200;
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

addRoutes(requestQueues, ROUTES);

module.exports = requestQueues;
