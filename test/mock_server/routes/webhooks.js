const express = require('express');

const webhooks = express.Router();

const ROUTES = [
    { id: 'create-webhook', method: 'POST', path: '/' },
    { id: 'list-webhooks', method: 'GET', path: '/' },
    { id: 'get-webhook', method: 'GET', path: '/:webhookId' },
    { id: 'update-webhook', method: 'PUT', path: '/:webhookId' },
    { id: 'delete-webhook', method: 'DELETE', path: '/:webhookId' },
    { id: 'list-dispatches', method: 'GET', path: '/:webhookId/dispatches' },


];

const HANDLERS = {
    json(id) {
        return (req, res) => {
            const responseStatusCode = Number(req.params.webhookId) || 200;
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

addRoutes(webhooks, ROUTES);

module.exports = webhooks;
