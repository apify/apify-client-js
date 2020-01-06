const express = require('express');

const webhookDispatches = express.Router();

const ROUTES = [
    { id: 'list-dispatches', method: 'GET', path: '/' },
    { id: 'get-dispatch', method: 'GET', path: '/:webhookDispatchId' },


];

const HANDLERS = {
    json(id) {
        return (req, res) => {
            const responseStatusCode = Number(req.params.webhookDispatchId) || 200;
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

addRoutes(webhookDispatches, ROUTES);

module.exports = webhookDispatches;
