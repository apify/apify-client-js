const express = require('express');

const { addRoutes } = require('./add_routes');

const schedules = express.Router();

const ROUTES = [
    { id: 'create-schedule', method: 'POST', path: '/' },
    { id: 'list-schedules', method: 'GET', path: '/' },
    { id: 'get-schedule', method: 'GET', path: '/:scheduleId' },
    { id: 'update-schedule', method: 'PUT', path: '/:scheduleId' },
    { id: 'delete-schedule', method: 'DELETE', path: '/:scheduleId' },
    { id: 'get-log', method: 'GET', path: '/:scheduleId/log' },
];

addRoutes(schedules, ROUTES);

module.exports = schedules;
