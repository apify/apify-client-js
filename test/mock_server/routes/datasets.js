const express = require('express');

const datasets = express.Router();

const ROUTES = [
    { id: 'get-or-create-dataset', method: 'POST', path: '/' },
    { id: 'list-datasets', method: 'GET', path: '/' },
    { id: 'get-dataset', method: 'GET', path: '/:datasetId' },
    { id: 'delete-dataset', method: 'DELETE', path: '/:datasetId' },
    { id: 'update-dataset', method: 'PUT', path: '/:datasetId' },
    { id: 'list-items', method: 'GET', path: '/:datasetId/items', type: 'responseJsonMock' },
    { id: 'push-items', method: 'POST', path: '/:datasetId/items' },
];

const HANDLERS = {
    json(id) {
        return (req, res) => {
            const responseStatusCode = Number(req.params.datasetId) || 200;
            let payload;
            if (responseStatusCode === 200) payload = { data: { id } };
            else if (responseStatusCode === 204) payload = null;
            else if (responseStatusCode === 404) {
                payload = {
                    error: {
                        type: 'record-not-found',
                        message: 'Record with this name was not found',
                    },
                };
            }

            res
                .status(responseStatusCode)
                .json(payload);
        };
    },
    responseJsonMock() {
        return (req, res) => {
            const mockServer = req.app.get('mockServer');
            const { body, headers = {} } = mockServer.response;
            res
                .status(200)
                .set(headers)
                .json(body);
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

addRoutes(datasets, ROUTES);

module.exports = datasets;
