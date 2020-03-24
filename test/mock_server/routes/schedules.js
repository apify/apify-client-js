const express = require('express');

const schedules = express.Router();

const ROUTES = [
    { id: 'create-schedule', method: 'POST', path: '/' },
    { id: 'list-schedules', method: 'GET', path: '/' },
    { id: 'get-schedule', method: 'GET', path: '/:scheduleId' },
    { id: 'update-schedule', method: 'PUT', path: '/:scheduleId' },
    { id: 'delete-schedule', method: 'DELETE', path: '/:scheduleId' },
    { id: 'get-log', method: 'GET', path: '/:scheduleId/log' },
];

const HANDLERS = {
    json(id) {
        return (req, res) => {
            const responseStatusCode = Number(req.params.scheduleId) || 200;
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

addRoutes(schedules, ROUTES);

module.exports = schedules;
