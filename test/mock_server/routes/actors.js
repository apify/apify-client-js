const express = require('express');

const actors = express.Router();

const ROUTES = [
    { id: 'list-actors', method: 'GET', path: '/' },
    { id: 'create-actor', method: 'POST', path: '/' },
    { id: 'update-actor', method: 'PUT', path: '/:actorId' },
    { id: 'delete-actor', method: 'DELETE', path: '/:actorId' },
    { id: 'get-actor', method: 'GET', path: '/:actorId' },
    { id: 'list-runs', method: 'GET', path: '/:actorId/runs' },
    { id: 'run-actor', method: 'POST', path: '/:actorId/runs' },
    { id: 'get-run', method: 'GET', path: '/:actorId/runs/:runId' },
    { id: 'abort-run', method: 'POST', path: '/:actorId/runs/:runId/abort' },
    { id: 'metamorph-run', method: 'POST', path: '/:actorId/runs/:runId/metamorph' },
    { id: 'resurrect-run', method: 'POST', path: '/:actorId/runs/:runId/resurrect' },
    { id: 'list-builds', method: 'GET', path: '/:actorId/builds' },
    { id: 'build-actor', method: 'POST', path: '/:actorId/builds' },
    { id: 'get-build', method: 'GET', path: '/:actorId/builds/:buildId' },
    { id: 'abort-build', method: 'POST', path: '/:actorId/builds/:buildId/abort' },
    { id: 'list-actor-versions', method: 'GET', path: '/:actorId/versions' },
    { id: 'create-actor-version', method: 'POST', path: '/:actorId/versions' },
    { id: 'get-actor-version', method: 'GET', path: '/:actorId/versions/:versionNumber' },
    { id: 'update-actor-version', method: 'PUT', path: '/:actorId/versions/:versionNumber' },
    { id: 'delete-actor-version', method: 'DELETE', path: '/:actorId/versions/:versionNumber' },
    { id: 'list-webhooks', method: 'GET', path: '/:actorId/webhooks' },
];

const HANDLERS = {
    json(id) {
        return (req, res) => {
            const responseStatusCode = Number(req.params.actorId) || 200;
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

addRoutes(actors, ROUTES);

module.exports = actors;
