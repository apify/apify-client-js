const express = require('express');

const { addRoutes } = require('./add_routes');

const webhooks = express.Router();

const ROUTES = [
    { id: 'create-webhook', method: 'POST', path: '/' },
    { id: 'list-webhooks', method: 'GET', path: '/' },
    { id: 'get-webhook', method: 'GET', path: '/:webhookId' },
    { id: 'update-webhook', method: 'PUT', path: '/:webhookId' },
    { id: 'delete-webhook', method: 'DELETE', path: '/:webhookId' },
    { id: 'test-webhook', method: 'POST', path: '/:webhookId/test' },
    { id: 'list-dispatches', method: 'GET', path: '/:webhookId/dispatches' },

];

addRoutes(webhooks, ROUTES);

module.exports = webhooks;
