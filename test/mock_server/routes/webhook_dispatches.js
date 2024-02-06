const express = require('express');

const { addRoutes } = require('./add_routes');

const webhookDispatches = express.Router();

const ROUTES = [
    { id: 'list-dispatches', method: 'GET', path: '/' },
    { id: 'get-dispatch', method: 'GET', path: '/:webhookDispatchId' },

];

addRoutes(webhookDispatches, ROUTES);

module.exports = webhookDispatches;
