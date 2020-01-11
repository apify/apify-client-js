const express = require('express');

const datasets = express.Router();

const ROUTES = [
    { id: 'get-or-create-dataset', method: 'POST', path: '/' },
    { id: 'list-datasets', method: 'GET', path: '/' },
    { id: 'get-dataset', method: 'GET', path: '/:datasetId' },
    { id: 'delete-dataset', method: 'DELETE', path: '/:datasetId' },
    { id: 'get-items', method: 'GET', path: '/:datasetId/items', type: 'responseJsonMock' },
    { id: 'put-items', method: 'POST', path: '/:datasetId/items' },
];

const HANDLERS = {
    json(id) {
        return (req, res) => {
            const responseStatusCode = Number(req.params.datasetId) || 200;
            let payload;
            switch (responseStatusCode) {
                case 204:
                    payload = null;
                    break;
                case 201:
                    payload = {};
                    break;
                default:
                    payload = { data: { id } };
            }
            res
                .status(responseStatusCode)
                .json(payload);
        };
    },
    responseJsonMock(id) {
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
