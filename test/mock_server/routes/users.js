const express = require('express');

const users = express.Router();

const ROUTES = [
    { id: 'get-user', method: 'GET', path: '/:userId' },

];

const HANDLERS = {
    json(id) {
        return (req, res) => {
            const responseStatusCode = 200;
            const payload = { data: { id } };
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

addRoutes(users, ROUTES);

module.exports = users;
