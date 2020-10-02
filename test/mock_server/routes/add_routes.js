const HANDLERS = {
    text(id) {
        return (req, res) => {
            const [resourceId] = Object.values(req.params);
            const responseStatusCode = Number(resourceId) || 200;
            let payload;
            if (responseStatusCode === 200) payload = id;
            else if (responseStatusCode === 204) payload = null;
            else if (responseStatusCode === 404) {
                payload = {
                    error: {
                        type: 'record-not-found',
                        message: 'Record with this name was not found',
                    },
                };
            }

            res.send(payload);
        };
    },
    json(id) {
        return (req, res) => {
            const [resourceId] = Object.values(req.params);
            const responseStatusCode = Number(resourceId) || 200;
            let payload = {};
            if (responseStatusCode === 200) payload = { data: { id } };
            else if (responseStatusCode === 204) payload = null;
            else if (responseStatusCode === 404) {
                payload = {
                    error: {
                        type: 'record-not-found',
                        message: 'Record with this name was not found',
                    },
                };
            }

            res
                .status(responseStatusCode)
                .json(payload);
        };
    },
    responseJsonMock(id) {
        return (req, res) => {
            const [resourceId] = Object.values(req.params);
            const responseStatusCode = Number(resourceId) || 200;

            const mockServer = req.app.get('mockServer');
            let body = { data: { id } };
            let headers;
            let statusCode = responseStatusCode;

            if (mockServer.response) {
                body = mockServer.response.body;
                headers = mockServer.response.headers;
                statusCode = mockServer.response.statusCode || 200;
            }

            let payload;
            if (statusCode === 200) payload = body;
            else if (statusCode === 204) payload = null;
            else if (statusCode === 404) {
                payload = {
                    error: {
                        type: 'record-not-found',
                        message: 'Record with this name was not found',
                    },
                };
            }
            res
                .status(statusCode)
                .set(headers)
                .send(payload);
        };
    },
};

exports.addRoutes = (router, routes) => {
    routes.forEach((route) => {
        const type = route.type ? route.type : 'json';
        const handler = HANDLERS[type];
        const method = route.method.toLowerCase();
        router[method](route.path, handler(route.id));
    });
};
