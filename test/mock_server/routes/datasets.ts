import express from 'express';

import { addRoutes, type MockServerRoute } from './add_routes';

export const datasetRouter = express.Router();

const ROUTES: MockServerRoute[] = [
    { id: 'get-or-create-dataset', method: 'POST', path: '/' },
    { id: 'list-datasets', method: 'GET', path: '/' },
    { id: 'delete-dataset', method: 'DELETE', path: '/:datasetId' },
    { id: 'update-dataset', method: 'PUT', path: '/:datasetId' },
    { id: 'list-items', method: 'GET', path: '/:datasetId/items', type: 'responseJsonMock' },
    { id: 'push-items', method: 'POST', path: '/:datasetId/items' },
    { id: 'get-statistics', method: 'GET', path: '/:datasetId/statistics' },
];

addRoutes(datasetRouter, ROUTES);

/**
 * GET /datasets/:datasetId
 * Returns a specific dataset by its ID.
 * If the dataset ID is 'id-with-secret-key', it returns a dataset with a URL signing secret key.
 * If the dataset ID is '404', it returns a 404 error with a RECORD_NOT_FOUND type.
 * Otherwise, it returns a dataset with an ID of 'get-dataset' (default).
 */
datasetRouter.get('/:datasetId', (req, res) => {
    const { datasetId } = req.params;

    if (datasetId === 'id-with-secret-key') {
        return res.json({
            data: {
                id: datasetId,
                urlSigningSecretKey: 'secret-key-for-testing',
            },
        });
    }

    if (datasetId === '404') {
        return res.status(404).json({ error: { type: 'record-not-found' } });
    }

    return res.json({
        data: {
            id: 'get-dataset',
        },
    });
});
