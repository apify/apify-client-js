const express = require('express');
const { addRoutes } = require('./add_routes');

const requestQueues = express.Router();

const ROUTES = [
    { id: 'get-or-create-queue', method: 'POST', path: '/' },
    { id: 'list-queues', method: 'GET', path: '/' },
    { id: 'get-queue', method: 'GET', path: '/:queueId' },
    { id: 'delete-queue', method: 'DELETE', path: '/:queueId' },
    { id: 'update-queue', method: 'PUT', path: '/:queueId' },
    { id: 'add-request', method: 'POST', path: '/:queueId/requests/' },
    { id: 'update-request', method: 'PUT', path: '/:queueId/requests/:requestId' },
    { id: 'put-lock-request', method: 'PUT', path: '/:queueId/requests/:requestId/lock' },
    { id: 'delete-lock-request', method: 'DELETE', path: '/:queueId/requests/:requestId/lock' },
    { id: 'batch-insert', method: 'POST', path: '/:queueId/requests/batch', type: 'dummyBatchOperation' },
    { id: 'batch-delete', method: 'DELETE', path: '/:queueId/requests/batch', type: 'dummyBatchOperation' },
    { id: 'get-request', method: 'GET', path: '/:queueId/requests/:requestId' },
    { id: 'delete-request', method: 'DELETE', path: '/:queueId/requests/:requestId' },
    { id: 'get-head', method: 'GET', path: '/:queueId/head' },
    { id: 'post-lock-head', method: 'POST', path: '/:queueId/head/lock' },
];

addRoutes(requestQueues, ROUTES);

module.exports = requestQueues;
