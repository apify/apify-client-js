const express = require('express');

const { addRoutes } = require('./add_routes');

const keyValueStores = express.Router();

const ROUTES = [
    { id: 'list-stores', method: 'GET', path: '/' },
    { id: 'get-or-create-store', method: 'POST', path: '/' },
    { id: 'delete-store', method: 'DELETE', path: '/:storeId' },
    { id: 'update-store', method: 'PUT', path: '/:storeId' },
    { id: 'get-record', method: 'GET', path: '/:storeId/records/:key', type: 'responseJsonMock' },
    { id: 'put-record', method: 'PUT', path: '/:storeId/records/:key' },
    {
        id: 'direct-upload-url',
        method: 'GET',
        path: '/:storeId/records/:key/direct-upload-url',
        type: 'responseJsonMock',
    },
    { id: 'delete-record', method: 'DELETE', path: '/:storeId/records/:key' },
    { id: 'list-keys', method: 'GET', path: '/:storeId/keys' },
];

addRoutes(keyValueStores, ROUTES);

/**
 * GET /key-value-stores/:storeId
 * Returns a specific key-value store by its ID.
 * If the store ID is 'id-with-secret-key', it returns a store with a URL signing secret key.
 * If the store ID is '404', it returns a 404 error with a RECORD_NOT_FOUND type.
 * Otherwise, it returns a store with an ID of 'get-store' (default).
 */
keyValueStores.get('/:storeId', (req, res) => {
    const { storeId } = req.params;

    if (storeId === 'id-with-secret-key') {
        return res.json({
            data: {
                id: storeId,
                urlSigningSecretKey: 'a-real-secret-key-for-testing',
            }
        });
    }

    if (storeId === '404') {
        return res.status(404).json({ error: { type: 'record-not-found' } });
    }

    return res.json({
        data: {
            id: 'get-store',
        }
    });
});

module.exports = keyValueStores;
