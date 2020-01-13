const express = require('express');

const keyValueStores = express.Router();

const ROUTES = [
    { id: 'list-stores', method: 'GET', path: '/' },
    { id: 'get-or-create-store', method: 'POST', path: '/' },
    { id: 'get-store', method: 'GET', path: '/:storeId' },
    { id: 'delete-store', method: 'DELETE', path: '/:storeId' },
    { id: 'get-record', method: 'GET', path: '/:storeId/records/:key', type: 'responseJsonMock' },
    { id: 'put-record', method: 'PUT', path: '/:storeId/records/:key', type: 'responseJsonMock' },
    { id: 'delete-record', method: 'DELETE', path: '/:storeId/record/:key' },
    { id: 'list-keys', method: 'GET', path: '/:storeId/keys' },


];

const HANDLERS = {
    json(id) {
        return (req, res) => {
            const responseStatusCode = Number(req.params.storeId) || 200;
            const payload = responseStatusCode === 204
                ? null
                : { data: { id } };
            res
                .status(responseStatusCode)
                .json(payload);
        };
    },
    responseJsonMock(id) {
        return (req, res) => {
            const mockServer = req.app.get('mockServer');
            const { body, headers = {}, statusCode = 200 } = mockServer.response;
            const payload = statusCode === 200 ? body : null;
            res
                .status(statusCode)
                .set(headers)
                .send(payload);
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

addRoutes(keyValueStores, ROUTES);

module.exports = keyValueStores;
