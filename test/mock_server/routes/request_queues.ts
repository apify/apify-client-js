import express from 'express';

import * as fixtures from '../fixtures';
import { addRoutes, type MockServerRoute } from './add_routes';

export const requestQueues = express.Router();

const ROUTES: MockServerRoute[] = [
    { id: 'get-or-create-queue', method: 'POST', path: '/', fixture: fixtures.requestQueue },
    { id: 'list-queues', method: 'GET', path: '/', fixture: fixtures.requestQueueList },
    { id: 'get-queue', method: 'GET', path: '/:queueId', fixture: fixtures.requestQueue },
    { id: 'delete-queue', method: 'DELETE', path: '/:queueId' },
    { id: 'update-queue', method: 'PUT', path: '/:queueId', fixture: fixtures.requestQueue },
    { id: 'add-request', method: 'POST', path: '/:queueId/requests/', fixture: fixtures.requestRegistration },
    {
        id: 'list-requests',
        method: 'GET',
        path: '/:queueId/requests/',
        type: 'responseJsonMock',
        fixture: fixtures.requestList,
    },
    {
        id: 'update-request',
        method: 'PUT',
        path: '/:queueId/requests/:requestId',
        fixture: fixtures.requestRegistration,
    },
    {
        id: 'put-lock-request',
        method: 'PUT',
        path: '/:queueId/requests/:requestId/lock',
        fixture: fixtures.requestLockInfo,
    },
    { id: 'delete-lock-request', method: 'DELETE', path: '/:queueId/requests/:requestId/lock' },
    { id: 'batch-insert', method: 'POST', path: '/:queueId/requests/batch', type: 'dummyBatchOperation' },
    {
        id: 'unlock-requests',
        method: 'POST',
        path: '/:queueId/requests/unlock',
        fixture: fixtures.unlockRequestsResult,
    },
    { id: 'batch-delete', method: 'DELETE', path: '/:queueId/requests/batch', type: 'dummyBatchOperation' },
    { id: 'get-request', method: 'GET', path: '/:queueId/requests/:requestId', fixture: fixtures.request },
    { id: 'delete-request', method: 'DELETE', path: '/:queueId/requests/:requestId' },
    { id: 'get-head', method: 'GET', path: '/:queueId/head', fixture: fixtures.requestQueueHead },
    { id: 'post-lock-head', method: 'POST', path: '/:queueId/head/lock', fixture: fixtures.lockedRequestQueueHead },
];

addRoutes(requestQueues, ROUTES);
